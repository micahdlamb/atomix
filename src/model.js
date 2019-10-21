export function createPlaylist(name, latLng=undefined){
    return post(`playlist/${name}`, {latLng})
}

export function joinPlaylist(playlist_id, give='likes'){
    return post(`join/playlist/${playlist_id}`, {give})
}

export function getPlaylists(){
    return get(`playlist`)
}

export function findPlaylists(latLng=undefined){
    return get('playlist/find')
}

export function get(url){
    return fetch(url, {
        credentials: 'include'
    }).then(resp => resp.json())
}

export function post(url, body){
    return fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body && JSON.stringify(body)
    }).then(resp => resp.json())
}