import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ChartsSection({ onSongPlay, onViewAll }) {
    const navigate = useNavigate();
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHindiSongs = async () => {
            // Popular Hindi songs to search
            const searches = [
                'Tum Hi Ho Arijit Singh',
                'Kesariya Arijit Singh',
                'Apna Bana Le Arijit Singh',
                'Chaleya Arijit Singh',
                'Satranga Arijit Singh',
                'O Maahi Arijit Singh'
            ];

            try {
                const songData = await Promise.all(
                    searches.map(async (search) => {
                        const response = await fetch(
                            `https://itunes.apple.com/search?term=${encodeURIComponent(search)}&entity=song&limit=1&country=IN`
                        );
                        const data = await response.json();
                        if (data.results && data.results.length > 0) {
                            const track = data.results[0];
                            return {
                                title: track.trackName,
                                artist: track.artistName,
                                album: track.collectionName,
                                image: track.artworkUrl100?.replace('100x100bb', '600x600bb') ||
                                    'https://via.placeholder.com/200x200/444/fff?text=Song',
                                search_term: `${track.trackName} ${track.artistName}`
                            };
                        }
                        return null;
                    })
                );
                setSongs(songData.filter(song => song !== null));
            } catch (error) {
                console.error('Failed to fetch songs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHindiSongs();
    }, []);

    const handleViewAll = () => {
        // Search for Hindi songs to show chart-like results
        navigate('/?q=hindi+songs');
    };

    if (loading) {
        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Charts</h2>
                        <Badge variant="secondary">Top Hindi</Badge>
                    </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-48 h-56 bg-accent animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Charts</h2>
                    <Badge variant="secondary">Top Hindi</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
                    View All
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {songs.map((song, idx) => (
                    <Card
                        key={idx}
                        onClick={() => onSongPlay && onSongPlay(song)}
                        className="flex-shrink-0 w-48 p-4 hover:bg-accent transition-all cursor-pointer group relative"
                    >
                        <div className="relative aspect-square mb-3 overflow-hidden rounded-md">
                            <img
                                src={song.image}
                                alt={song.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            {/* Play button overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                                    <Play className="h-6 w-6 text-primary-foreground ml-1" fill="currentColor" />
                                </div>
                            </div>
                            {/* Rank badge */}
                            <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{idx + 1}</span>
                            </div>
                        </div>
                        <p className="font-semibold text-sm truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}
