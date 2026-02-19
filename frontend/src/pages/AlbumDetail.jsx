import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAlbumTracks, getAudioStream } from '@/lib/api';
import { SongCard } from '@/components/SongCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function AlbumDetail() {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlbum = async () => {
            try {
                const data = await getAlbumTracks(albumId);
                setAlbum(data);
            } catch (error) {
                console.error('Failed to fetch album:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlbum();
    }, [albumId]);

    const handlePlaySong = async (song, songIndex) => {
        try {
            const { stream_url, source } = await getAudioStream(song.search_term);

            const trackData = {
                title: song.title,
                artist: song.artist,
                img: song.image,
                album: song.album || album.album_name || null,
                album_id: song.album_id || albumId || null,
                stream_url,
                source,
                queue: album.songs,  // Send full album as queue
                currentIndex: songIndex,  // Current position in queue
            };

            window.dispatchEvent(new CustomEvent('playTrack', { detail: trackData }));
        } catch (error) {
            console.error('Failed to play song:', error);
        }
    };

    const handleShuffle = async () => {
        if (!album || album.songs.length === 0) return;

        // Shuffle the songs array
        const shuffled = [...album.songs].sort(() => Math.random() - 0.5);
        const firstSong = shuffled[0];

        try {
            const { stream_url, source } = await getAudioStream(firstSong.search_term);

            const trackData = {
                title: firstSong.title,
                artist: firstSong.artist,
                img: firstSong.image,
                stream_url,
                source,
                queue: shuffled,  // Send shuffled queue
                currentIndex: 0,
            };

            window.dispatchEvent(new CustomEvent('playTrack', { detail: trackData }));
        } catch (error) {
            console.error('Failed to shuffle:', error);
        }
    };

    if (loading) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
                <p className="text-muted-foreground">Loading album...</p>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
                <p className="text-destructive">Album not found</p>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-6 pb-32">
            <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {/* Album Header */}
            <div className="flex flex-col items-center text-center mb-6 px-2">
                <img
                    src={album.artwork}
                    alt={album.album_name}
                    className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-xl mx-auto mb-4 shadow-xl object-cover"
                />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 leading-tight px-2">
                    {album.album_name}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground mb-1 truncate max-w-full px-2">
                    {album.artist_name}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    {album.genre} • {album.track_count} tracks
                </p>

                {/* Play All & Shuffle Buttons */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-xs sm:max-w-none">
                    <Button
                        size="default"
                        onClick={() => handlePlaySong(album.songs[0], 0)}
                        className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 gap-2"
                    >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        Play All
                    </Button>
                    <Button
                        size="default"
                        variant="outline"
                        onClick={handleShuffle}
                        className="flex-1 sm:flex-none gap-2"
                    >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4l2.5 4L13 4h7m0 0v4m0-4l-5 5m5 11h-7l-2.5-4L8 20H4m16 0v-4m0 4l-5-5" />
                        </svg>
                        Shuffle
                    </Button>
                </div>
            </div>

            {/* Track List */}
            <div className="space-y-1.5">
                {album.songs.map((song, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                        <span className="hidden xs:block text-muted-foreground w-6 sm:w-8 text-right text-xs sm:text-sm shrink-0">
                            {song.track_number}
                        </span>
                        <div className="flex-1 min-w-0">
                            <SongCard song={song} onPlay={() => handlePlaySong(song, idx)} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
