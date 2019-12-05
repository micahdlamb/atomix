import os, functools, collections
from typing import Dict
from quart import Quart, jsonify, url_for, request, send_from_directory, redirect, session, abort
import spotify
from spotify.models import User

from pathlib import Path
root = Path(__file__).parent

app = Quart(__name__, static_folder='build')
app.secret_key = 'sup3rsp1cy'

# from quart_cors import cors
# app = cors(app, allow_origin="*")

client = None # Must be created after event loop set

# OAuth ################################################################################################################

# playlist-read-collaborative
# playlist-modify-private
# playlist-modify-public
# playlist-read-private
#
# user-modify-playback-state
# user-read-currently-playing
# user-read-playback-state
#
# user-read-private
# user-read-email
#
# user-library-modify
# user-library-read
#
# user-follow-modify
# user-follow-read
#
# user-read-recently-played
# user-top-read
#
# streaming
# app-remote-control

scopes = """
playlist-read-collaborative
playlist-modify-private
playlist-modify-public
playlist-read-private

user-modify-playback-state
user-read-currently-playing
user-read-playback-state

user-read-email

user-library-read

user-follow-modify
user-follow-read

user-read-recently-played
user-top-read

streaming
app-remote-control
""".split()
oauth2 = spotify.OAuth2(os.environ['SPOTIFY_CLIENT_ID'], os.environ['SPOTIFY_REDIRECT_URI'], scopes=scopes)


def require_user(func):
    @functools.wraps(func)
    def wrap(*args, **kwds):
        if not get_user():
            if request.is_json: # quart is missing is_xhr...
                abort(401)
            else:
                session['next'] = request.path
                return redirect(oauth2.url)
        return func(*args, **kwds)
    return wrap


@app.route('/login/authorized')
async def spotify_authorized():
    try:
        code = request.args['code']
    except KeyError:
        return f"Failed to authenticate with Spotify: {request.args['error']}"

    next = session.get('next', '/')
    if next == '/python_console':
        return "user = await User.from_code(spotify.Client(os.environ['SPOTIFY_CLIENT_ID'], os.environ['SPOTIFY_CLIENT_SECRET']), '"+code+"', redirect_uri=os.environ['SPOTIFY_REDIRECT_URI'])"
    try:
        user = await User.from_code(client, code, redirect_uri=os.environ['SPOTIFY_REDIRECT_URI'])
    except spotify.errors.HTTPException:
        # In case user navigates back here...  TODO prevent this from happening?
        return redirect(next)
    users[user.id] = user
    session['user_id'] = user.id
    return redirect(next)


@app.route("/python_console")
@require_user
def python_console():
    return "logout and try again..."


@app.route("/login_as/<user_id>")
def login_as(user_id):
    micah_id, harsh_id = "1224049687", "12150784354"
    assert session['user_id'] in (micah_id, harsh_id)
    user = next(user for user in users.values() if user.id == user_id)
    session['user_id'] = user.id
    return user_to_dict(user)

# API ##################################################################################################################

users = {}

def get_user() -> User:
    return users.get(session.get('user_id'))

@app.route('/get_user')
def _get_user():
    user = get_user()
    return jsonify(user and user_to_dict(user))


class HostPlaylist(spotify.models.Playlist):

    @classmethod
    async def create(cls, owner, name, latLng=None):
        # Reusing same playlist is convenient for development
        self = await get_create_playlist(owner, f"Mixify - {name}")
        self.__class__ = cls
        self.owner = owner
        self.name  = name
        self.latLng = latLng
        self.users = {}
        self._tracks = []
        self.join_url = url_for('join_playlist', _external=True, playlist_id=self.id)
        return self

    async def join(self, user, tracks):
        self.users[user] = tracks
        await self._update_tracks()

    async def leave(self, user):
        del self.users[user]
        await self._update_tracks()

    async def _update_tracks(self):
        counter = collections.Counter(track for user_tracks in self.users.values() for track in user_tracks)
        common = [(track, count) for track, count in counter.items() if count > 1]
        common_first = sorted(common, key=lambda x: x[1], reverse=True)
        tracks = [track for track, count in common_first]
        await self.replace_tracks(*tracks)
        # TODO Ask about base playlist code being so broken...
        # self.tracks looks like it is supposed to work, but it doesn't
        self._tracks = tracks

    def to_dict(self):
        return dict(
            id     = self.id,
            owner  = user_to_dict(self.owner),
            name   = self.name,
            latLng = self.latLng,
            users  = [user.display_name for user in self.users],
            url    = self.url,
            tracks = [track_to_dict(track) for track in self._tracks]
        )

host_playlists : Dict[str, HostPlaylist] = {}


async def get_create_playlist(user, name):
    playlists = await user.get_all_playlists()
    playlist = next((p for p in playlists if p.name == name and p.owner == user), None)
    # Empty playlist is considered False!!!
    return await user.create_playlist(name) if playlist is None else playlist


class Track(spotify.models.Track):

    @classmethod
    def cast(cls, track):
        track.__class__ = Track
        track_name, *type = track.name.rsplit(" - ", 1)
        track.key = f"{track_name}:{track.artists[0].name}"
        return track

    def __hash__(self):
        return hash(self.key)

    def __eq__(self, other):
        return type(self) is type(other) and self.key == other.key


async def get_tracks(user, take='likes'):
    attr = f"tracks_{take}"
    cached = getattr(user, attr, None)
    if cached: return cached

    if take == 'playlists':
        playlists = await user.get_all_playlists()
        owned = [p for p in playlists if p.owner == user]
        tracks = [track for p in owned for track in await p.get_all_tracks()]
        # Remove local songs
        tracks = (track for track in tracks if track.uri.startswith("spotify:track"))
    else:
        tracks = await user.library.get_all_tracks()

    tracks = {Track.cast(track) for track in tracks}
    setattr(user, attr, tracks)
    return tracks


@app.route('/create_playlist/<name>', methods=['POST'])
@require_user
async def create_playlist(name):
    user = get_user()
    kwds = await request.json
    playlist = await HostPlaylist.create(user, name, **kwds)
    host_playlists[playlist.id] = playlist
    return playlist.to_dict()

@app.route('/get_playlist/<playlist_id>')
def get_playlist(playlist_id):
    playlist = host_playlists[playlist_id]
    return playlist.to_dict()

@app.route('/update_playlist/<playlist_id>', methods=['PUT'])
@require_user
async def update_playlist(playlist_id):
    user = get_user()
    playlist = host_playlists[playlist_id]
    if (user != playlist.owner): abort(403)
    kwds = await request.json
    playlist.__dict__.update(kwds)
    return playlist.to_dict()

@app.route('/delete_playlist/<playlist_id>', methods=['DELETE'])
@require_user
def delete_playlist(playlist_id):
    user = get_user()
    playlist = host_playlists[playlist_id]
    if (user != playlist.owner): abort(403)
    del host_playlists[playlist_id]
    return jsonify("success")


@app.route('/get_my_playlists')
@require_user
def get_my_playlists():
    user = get_user()
    playlists = [playlist for playlist in host_playlists.values() if user == playlist.owner]
    return jsonify([playlist.to_dict() for playlist in reversed(playlists)])

@app.route('/get_joined_playlists')
@require_user
def get_joined_playlists():
    user = get_user()
    playlists = [playlist for playlist in host_playlists.values() if user in playlist.users]
    return jsonify([playlist.to_dict() for playlist in reversed(playlists)])

@app.route('/find_playlists')
def find_playlists():
    playlists = host_playlists.values()
    latLng = to_floats(request.args.get('latLng'))
    if latLng:
        radius = float(request.args.get('radius', 100))
        from geopy.distance import distance
        def close(playlist):
            return playlist.latLng and distance(latLng, playlist.latLng).m < radius
        playlists = [p for p in playlists if close(p)]

    return jsonify([p.to_dict() for p in playlists])


@app.route('/join_playlist/<playlist_id>', methods=['GET','POST'])
@require_user
async def join_playlist(playlist_id):
    user = get_user()
    playlist = host_playlists[playlist_id]
    tracks = await get_tracks(user, request.args.get('give'))
    await playlist.join(user, tracks)
    if user != playlist.owner:
        await user.follow_playlist(playlist)
    return playlist.to_dict()

@app.route("/leave_playlist/<playlist_id>", methods=['POST'])
@require_user
async def leave_playlist(playlist_id):
    user = get_user()
    playlist = host_playlists[playlist_id]
    await playlist.leave(user)


@app.route("/find_matched_users")
@require_user
async def find_matched_users():
    user = get_user()
    user_tracks = await get_tracks(user)
    matches = []
    for other in users.values():
        if other == user: continue
        other_tracks = await get_tracks(other)
        common = user_tracks & other_tracks
        if not common: continue
        total_tracks = len(user_tracks) + len(other_tracks) - len(common)
        matches.append({
            'user': user_to_dict(other),
            'score': 100 * sum((101 - track.popularity)**.25 for track in common) / total_tracks**.25,
            'tracks': [track_to_dict(track) for track in sorted(common, key=lambda track: track.popularity)]
        })
    matches.sort(key=lambda m: m['score'], reverse=True)
    return jsonify(matches)


@app.route("/create_playlist_with_user/<user_id>")
@require_user
async def create_playlist_with_user(user_id):
    user = get_user()
    other = users[user_id]
    user_tracks = await get_tracks(user)
    other_tracks = await get_tracks(other)
    common = user_tracks & other_tracks
    tracks = list(sorted(common, key=lambda track: track.popularity))
    playlist = await get_create_playlist(user, f"Mixify - {other.display_name}")
    await playlist.replace_tracks(*tracks)
    return jsonify(playlist.url)


@app.route('/play_track/<user_id>/<track_uri>', methods=['PUT'])
async def play_track(user_id, track_uri):
    if not track_uri.startswith("spotify:track:"):
        track_uri = "spotify:track:" + track_uri
    user = users[user_id]
    devices = await user.get_devices()
    phone = next((d for d in devices if d.type == 'Smartphone'), None)
    if not phone: return jsonify("Smartphone not connected")
    player = await user.get_player()
    await player.play(track_uri, device=phone)
    return jsonify("success")


to_floats = lambda val: val and [float(v) for v in val.split(",")]
user_to_dict = lambda u: dict(id=u.id, display_name=u.display_name, image=u.images[0].url if u.images else None)
track_to_dict = lambda t: dict(id=t.id, name=t.name, popularity=t.popularity)

# Serve React App ######################################################################################################

@app.route('/playlists')
@app.route('/find')
@app.route('/join/<playlist_id>')
@require_user
def serve_protected(**_):
    return send_from_directory(app.static_folder, 'index.html', cache_timeout=0)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and (Path(app.static_folder) / path).exists():
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Persist ##############################################################################################################

refresh_tokens_file = root / 'refresh_tokens.txt'
refresh_tokens_file.touch()

def save_users():
    with open(refresh_tokens_file, 'w') as f:
        f.write('\n'.join(user.http.refresh_token for user in users.values()))

    print(f"{len(users)} users saved")

async def restore_users():
    with open(refresh_tokens_file) as f:
        refresh_tokens = f.read().split()

    for token in refresh_tokens:
        user = await User.from_refresh_token(client, token)
        users[user.id] = user

    print(f"{len(users)} users restored")

import asyncio
policy = asyncio.get_event_loop_policy()
_set_event_loop = policy.set_event_loop
def set_event_loop(loop):
    _set_event_loop(loop)
    if loop:
        global client
        client = spotify.Client(os.environ['SPOTIFY_CLIENT_ID'], os.environ['SPOTIFY_CLIENT_SECRET'])
        loop.run_until_complete(restore_users())
    else:
        save_users()
policy.set_event_loop = set_event_loop

# Run ##################################################################################################################

if 'HOST' in os.environ:
    from hypercorn.middleware import HTTPToHTTPSRedirectMiddleware
    redirected_app = HTTPToHTTPSRedirectMiddleware(app, os.environ['HOST'])

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)