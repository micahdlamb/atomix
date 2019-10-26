export function createPlaylist(name, latLng=undefined){
    return post(`/create_playlist/${name}`, {latLng})
}

export function getPlaylist(playlist_id){
    return get(`/get_playlist/${playlist_id}`)
}

export function updatePlaylist(playlist_id, latLng){
    return put(`/update_playlist/${playlist_id}`, {latLng})
}

export function deletePlaylist(playlist_id){
    return del(`/delete_playlist/${playlist_id}`)
}


export function getMyPlaylists(){
    return get(`/get_my_playlists`)
}

export function getJoinedPlaylists(){
    return get(`/get_joined_playlists`)
}

export function findPlaylists(latLng, radius=100){
    // radius in meters
    return get(`/find_playlists?latLng=${latLng.join(',')}&radius=${radius}`)
}


export function joinPlaylist(playlist_id, give='likes'){
    return post(`/join_playlist/${playlist_id}?give=${give}`)
}

export function leavePlaylist(playlist_id){
    return post(`/leave_playlist/${playlist_id}`)
}


function get(url){
    return fetchJson('GET', url)
}

function post(url, body){
    return fetchJson('POST', url, body)
}

function put(url, body){
    return fetchJson('PUT', url, body)
}

function del(url){
    return fetchJson('DELETE', url)
}

function fetchJson(method, url, body){
    return fetch(url, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body && JSON.stringify(body)
    }).then(resp => resp.json())
}