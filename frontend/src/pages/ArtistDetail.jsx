import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArtistSongs, getAudioStream } from '@/lib/api';
import { SongCard } from '@/components/SongCard';
import { AlbumCard } from '@/components/AlbumCard';
import { CategorySection } from '@/components/CategorySection';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Music, Disc } from 'lucide-react';

export function ArtistDetail() {
    const { artistName } = useParams();
    const navigate = useNavigate();
    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllAlbums, setShowAllAlbums] = useState(false);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                const data = await getArtistSongs(decodeURIComponent(artistName));
                setArtist(data);
            } catch (error) {
                console.error('Failed to fetch artist:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchArtist();
    }, [artistName]);

    const handlePlaySong = async (song, songIndex) => {
        try {
            const { stream_url, source } = await getAudioStream(song.search_term);

            const trackData = {
                title: song.title,
                artist: song.artist,
                img: song.image,
                album: song.album || null,
                album_id: song.album_id || null,
                stream_url,
                source,
                queue: artist.songs,  // Send full artist songs as queue
                currentIndex: songIndex,  // Current position in queue
            };

            window.dispatchEvent(new CustomEvent('playTrack', { detail: trackData }));
        } catch (error) {
            console.error('Failed to play song:', error);
        }
    };

    const handleShuffle = async () => {
        if (!artist || artist.songs.length === 0) return;

        // Shuffle the songs array
        const shuffled = [...artist.songs].sort(() => Math.random() - 0.5);
        const firstSong = shuffled[0];

        try {
            const { stream_url, source } = await getAudioStream(firstSong.search_term);

            const trackData = {
                title: firstSong.title,
                artist: firstSong.artist,
                img: firstSong.image,
                album: firstSong.album || null,
                album_id: firstSong.album_id || null,
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
                <p className="text-muted-foreground">Loading artist...</p>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
                <p className="text-destructive">Artist not found</p>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8 pb-32">
            <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <div className="text-center mb-8">
                {artist.artist_image ? (
                    <img
                        src={artist.artist_image}
                        alt={artist.artist_name}
                        className="w-48 h-48 rounded-full mx-auto mb-4 shadow-lg object-cover"
                    />
                ) : (
                    <div className="w-48 h-48 rounded-full mx-auto mb-4 bg-secondary flex items-center justify-center">
                        <User className="h-24 w-24 text-muted-foreground" />
                    </div>
                )}
                <h1 className="text-3xl font-bold mb-2">{artist.artist_name}</h1>
                {artist.genre && (
                    <p className="text-xl text-muted-foreground mb-1">{artist.genre}</p>
                )}
                <p className="text-sm text-muted-foreground mb-4">Top Songs</p>

                {/* Play All & Shuffle Buttons */}
                <div className="flex items-center justify-center gap-3 mt-6">
                    <Button
                        size="lg"
                        onClick={() => handlePlaySong(artist.songs[0], 0)}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        Play All
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleShuffle}
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4l2.5 4L13 4h7m0 0v4m0-4l-5 5m5 11h-7l-2.5-4L8 20H4m16 0v-4m0 4l-5-5" />
                        </svg>
                        Shuffle
                    </Button>
                </div>
            </div>

            <CategorySection title="Top Songs" icon={<Music />} count={artist.songs.length}>
                {artist.songs.map((song, idx) => (
                    <SongCard key={idx} song={song} onPlay={() => handlePlaySong(song, idx)} />
                ))}
            </CategorySection>

            {artist.albums && artist.albums.length > 0 && (
                <CategorySection title="Albums" icon={<Disc />} count={artist.albums.length}>
                    {(showAllAlbums ? artist.albums : artist.albums.slice(0, 5)).map((album, idx) => (
                        <AlbumCard key={idx} album={album} />
                    ))}
                    {artist.albums.length > 5 && (
                        <div className="flex justify-center mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowAllAlbums(!showAllAlbums)}
                                className="w-full md:w-auto"
                            >
                                {showAllAlbums ? 'Show Less' : `View All Albums (${artist.albums.length})`}
                            </Button>
                        </div>
                    )}
                </CategorySection>
            )}
        </div>
    );
}
