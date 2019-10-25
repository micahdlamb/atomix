export function createPlaylist(name, latLng=undefined){
    return post(`playlist/${name}`, {latLng})
}

export function updatePlaylist(playlist_id, latLng){
    return put(`playlist/${playlist_id}`, {latLng})
}

export function deletePlaylist(playlist_id){
    return del(`playlist/${playlist_id}`)
}


export function getMyPlaylists(){
    return get(`playlist/mine`)
}

export function getJoinedPlaylists(){
    return get(`playlist/joined`)
}

export function findPlaylists(latLng){
    return get(`playlist/find?latLng=${latLng.join(',')}`)
}


export function joinPlaylist(playlist_id, give='likes'){
    return post(`join/playlist/${playlist_id}?give=${give}`)
}

export function leavePlaylist(playlist_id){
    return put(`join/playlist/${playlist_id}`)
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