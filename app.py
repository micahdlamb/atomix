import os, functools, collections
from typing import Dict, Tuple
from quart import Quart, jsonify, url_for, request, send_from_directory, redirect, session, abort
import spotify
from spotify.models import User

from pathlib import Path
root = Path(__file__).parent

app = Quart(__name__, static_folder='build')
app.secret_key = 'sup3rsp1cy'

# from quart_cors import cors
# app = cors(app, allow_origin="*")

# OAuth ###########################################################################################

scopes = """
playlist-read-collaborative
playlist-modify-private
playlist-modify-public
playlist-read-private

user-modify-playback-state
user-read-currently-playing
user-read-playback-state

user-read-private
user-read-email

user-library-modify
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

    if session['next'] == '/python_console':
        return "user = await User.from_code(spotify.Client(os.environ['SPOTIFY_CLIENT_ID'], os.environ['SPOTIFY_CLIENT_SECRET']), '"+code+"', redirect_uri=os.environ['SPOTIFY_REDIRECT_URI'], refresh=True)"
    client = spotify.Client(os.environ['SPOTIFY_CLIENT_ID'], os.environ['SPOTIFY_CLIENT_SECRET']) # This errors if constructed outside of route
    user = await User.from_code(client, code, redirect_uri=os.environ['SPOTIFY_REDIRECT_URI'], refresh=True)
    users[id(user)] = user
    session['user_id'] = id(user)
    return redirect(session['next'])


# Main ############################################################################################

# TODO users are sitting in here forever refreshing their tokens
# Need to update spotify.py to refresh token when a request fails due to expired token
users = {}

def get_user() -> User:
    return users.get(session.get('user_id'))


class HostPlaylist(spotify.models.Playlist):

    @classmethod
    async def create(cls, owner, name, latLng=None):
        full_name = f"Intersection - {name}"
        # Reusing same playlist is convenient for development
        playlists = await owner.get_all_playlists()
        self = next((p for p in playlists if p.name == full_name), None)
        if self is None: # Empty playlist is considered False!!!
            self = await owner.create_playlist(full_name)

        self.__class__ = cls
        self.owner = owner
        self.name  = name
        self.latLng = latLng
        self.users = {}
        self._tracks = []
        self.join_url = url_for('join_playlist', _external=True, playlist_id=self.id)
        return self

    async def add_tracks(self, user, tracks):
        self.users[user] = tracks
        await self._update_tracks()

    async def remove_tracks(self, user):
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
            id       = self.id,
            owner    = self.owner.display_name,
            name     = self.name,
            latLng   = self.latLng,
            users    = [user.display_name for user in self.users],
            url      = self.url,
            tracks   = [track.name for track in self._tracks]
        )

host_playlists : Dict[str, HostPlaylist] = {}


@app.route('/create_playlist/<name>', methods=['POST'])
@require_user
async def create_playlist(name):
    user = get_user()
    kwds = await request.json
    playlist = await HostPlaylist.create(user, name, **kwds)
    host_playlists[playlist.id] = playlist
    return playlist.to_dict()

@app.route('/get_playlist/<playlist_id>')
async def get_playlist(playlist_id):
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
async def delete_playlist(playlist_id):
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
async def find_playlists():
    playlists = host_playlists.values()
    latLng = to_floats(request.args.get('latLng'))
    if latLng:
        radius = request.args.get('radius', 100)
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

    if request.args.get('give') == 'playlists':
        playlists = await user.get_all_playlists()
        owned = [p for p in playlists if p.owner == user]
        tracks = [track for p in owned for track in await p.get_all_tracks()]
        # Remove local songs.  {} since song can be in multi playlists
        tracks = {track for track in tracks if track.uri.startswith("spotify:track")}
    else:
        tracks = await user.library.get_all_tracks()

    await playlist.add_tracks(user, tracks)
    if user != playlist.owner:
        await user.follow_playlist(playlist)
    return playlist.to_dict()

@app.route("/leave_playlist/<playlist_id>", methods=['POST'])
@require_user
def leave_playlist(playlist_id):
    user = get_user()
    host_playlist = host_playlists[playlist_id]
    host_playlist.remove_tracks(user)


@app.route('/reset')
def reset():
    global users, host_playlists
    users = {}
    host_playlists = {}
    return jsonify("great success")


to_floats = lambda val: val and [float(v) for v in val.split(",")]


# Serve React App #################################################################################

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
@require_user
def serve(path):
    if path and (Path(app.static_folder) / path).exists():
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


# Run #############################################################################################

if 'HOST' in os.environ:
    from hypercorn.middleware import HTTPToHTTPSRedirectMiddleware
    redirected_app = HTTPToHTTPSRedirectMiddleware(app, os.environ['HOST'])

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)
