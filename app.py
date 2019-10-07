import os, functools, collections
from typing import Dict, Tuple
from quart import Quart, jsonify, url_for, request, send_from_directory, redirect, session
import spotify

from pathlib import Path
root = Path(__file__).parent

app = Quart(__name__, static_folder='build')
app.secret_key = 'sup3rsp1cy'

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
            if request.is_json: # quart doesn't have is_xhr...
                return "login required", 401
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

class User(spotify.models.User):

    async def get_playlist(self, name):
        # Ideally I could request playlist by name
        playlists = await self.get_playlists(limit=50)
        return next((p for p in playlists if p.name == name), None)

    async def get_host_playlist(self, name):
        full_name = f"Intersection - {name}"
        playlist = await self.get_playlist(full_name)
        if playlist is None: # Empty playlist is considered False!!!
            playlist = await self.create_playlist(full_name)
        return HostPlaylist.cast(playlist)

    async def get_all_tracks(self):
        tracks = []
        for i in range(100):
            try:    tracks.extend(await self.library.get_tracks(limit=50, offset=50*i))
            except: break
        return tracks

    # Fix token refreshing until github owner releases fix
    async def _refreshing_token(self, expires: int, token: str):
        while True:
            import asyncio
            await asyncio.sleep(expires-1)
            REFRESH_TOKEN_URL = "https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token={refresh_token}"
            route = ("POST", REFRESH_TOKEN_URL.format(refresh_token=token))
            from base64 import b64encode
            auth = b64encode(":".join((os.environ['SPOTIFY_CLIENT_ID'], os.environ['SPOTIFY_CLIENT_SECRET'])).encode())
            try:
                data = await self.client.http.request(
                    route,
                    headers={"Content-Type": "application/x-www-form-urlencoded",
                             "Authorization": f"Basic {auth.decode()}"}
                )

                expires = data["expires_in"]
                self.http.token = data["access_token"]
                print('token refreshed', data["access_token"])
            except:
                import traceback
                traceback.print_exc()

users = {}

def get_user() -> User:
    return users.get(session.get('user_id'))


class HostPlaylist(spotify.models.Playlist):
    @classmethod
    def cast(cls, playlist):
        playlist.__class__ = cls
        playlist.users = {}
        return playlist

    async def add_tracks(self, user, playlist_name=None):
        if playlist_name:
            playlist = await user.get_playlist(playlist_name)
            if not playlist: raise LookupError(playlist_name)
            tracks = await playlist.get_all_tracks()
        else:
            tracks = await user.get_all_tracks()

        self.users[user] = tracks

        counter = collections.Counter(track for user_tracks in self.users.values() for track in user_tracks)
        common_likes = [(track, count) for track, count in counter.items() if count > 1]
        ordered = sorted(common_likes, key=lambda x: x[1], reverse=True)
        most_common = [track for track, count in ordered]
        await self.replace_tracks(*most_common)
        return most_common

host_playlists : Dict[Tuple[str, str], HostPlaylist] = {}


@app.route('/host/<name>')
@require_user
async def host(name):
    user = get_user()
    host_playlists[(user.id, name)] = await user.get_host_playlist(name)
    participate = url_for('participate', _external=True, host_id=user.id, name=name)
    return f"<a href='{participate}'>{participate}</a>"


@app.route('/participate/<host_id>/<name>')
@require_user
async def participate(host_id, name):
    user = get_user()
    host_playlist = host_playlists[(host_id, name)]
    most_common = await host_playlist.add_tracks(user)
    return jsonify(dict(
        users=[user.display_name for user in host_playlist.users],
        common_songs=[track.name for track in most_common]
    ))


@app.route('/rest')
def reset():
    global users, host_playlists
    users = {}
    host_playlists = {}
    return "great success"


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

# set QUART_APP=app:app && quart run --host=0.0.0.0 --port=80
if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)
