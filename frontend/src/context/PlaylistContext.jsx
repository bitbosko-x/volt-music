import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
    getPlaylists, createPlaylist, renamePlaylist, deletePlaylist,
    addSongToPlaylist, removeSongFromPlaylist, isSongInPlaylist, isSongInAnyPlaylist,
} from '@/lib/playlists';

const PlaylistContext = createContext(null);

export function PlaylistProvider({ children }) {
    const [playlists, setPlaylists] = useState(() => getPlaylists());
    const [modalSong, setModalSong] = useState(null); // song to add; null = modal closed

    const refresh = useCallback(() => setPlaylists(getPlaylists()), []);

    const handleCreate = useCallback((name, id) => {
        createPlaylist(name, id);
        refresh();
    }, [refresh]);

    const handleRename = useCallback((id, name) => {
        renamePlaylist(id, name);
        refresh();
    }, [refresh]);

    const handleDelete = useCallback((id) => {
        deletePlaylist(id);
        refresh();
    }, [refresh]);

    const handleAddSong = useCallback((playlistId, song) => {
        addSongToPlaylist(playlistId, song);
        refresh();
    }, [refresh]);

    const handleRemoveSong = useCallback((playlistId, song) => {
        removeSongFromPlaylist(playlistId, song);
        refresh();
    }, [refresh]);

    const openAddToPlaylist = useCallback((song) => setModalSong(song), []);
    const closeModal = useCallback(() => setModalSong(null), []);

    // Keep in sync if another tab changes localStorage
    useEffect(() => {
        const onStorage = () => refresh();
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [refresh]);

    return (
        <PlaylistContext.Provider value={{
            playlists,
            modalSong,
            openAddToPlaylist,
            closeModal,
            createPlaylist: handleCreate,
            renamePlaylist: handleRename,
            deletePlaylist: handleDelete,
            addSongToPlaylist: handleAddSong,
            removeSongFromPlaylist: handleRemoveSong,
            isSongInPlaylist,
            isSongInAnyPlaylist,
        }}>
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylist() {
    const ctx = useContext(PlaylistContext);
    if (!ctx) throw new Error('usePlaylist must be used inside PlaylistProvider');
    return ctx;
}
