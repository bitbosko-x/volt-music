const STORAGE_KEY = 'volt_playlists';

export function getPlaylists() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function savePlaylists(playlists) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

export function createPlaylist(name, id) {
    const playlists = getPlaylists();
    const newPlaylist = {
        id: id || `pl_${Date.now()}`,
        name: name.trim() || 'My Playlist',
        createdAt: new Date().toISOString(),
        songs: [],
    };
    playlists.unshift(newPlaylist);
    savePlaylists(playlists);
    return newPlaylist;
}

export function renamePlaylist(playlistId, newName) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (pl) pl.name = newName.trim() || pl.name;
    savePlaylists(playlists);
}

export function deletePlaylist(playlistId) {
    const playlists = getPlaylists().filter(p => p.id !== playlistId);
    savePlaylists(playlists);
}

function songKey(song) {
    return `${song.title}||${song.artist}`;
}

export function addSongToPlaylist(playlistId, song) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    const key = songKey(song);
    if (!pl.songs.find(s => songKey(s) === key)) {
        pl.songs.push({
            title: song.title,
            artist: song.artist,
            img: song.img || song.image,
            album: song.album || null,
            album_id: song.album_id || null,
            search_term: song.search_term || `${song.title} ${song.artist}`,
        });
    }
    savePlaylists(playlists);
}

export function removeSongFromPlaylist(playlistId, song) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    const key = songKey(song);
    pl.songs = pl.songs.filter(s => songKey(s) !== key);
    savePlaylists(playlists);
}

export function isSongInPlaylist(playlistId, song) {
    const pl = getPlaylists().find(p => p.id === playlistId);
    if (!pl) return false;
    const key = songKey(song);
    return pl.songs.some(s => songKey(s) === key);
}

export function isSongInAnyPlaylist(song) {
    const key = songKey(song);
    return getPlaylists().some(pl => pl.songs.some(s => songKey(s) === key));
}
