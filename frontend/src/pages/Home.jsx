import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { RecentSearches } from '@/components/RecentSearches';
import { FeaturedCategories } from '@/components/FeaturedCategories';

import { PopularAlbums } from '@/components/PopularAlbums';
import { ChartsSection } from '@/components/ChartsSection';
import { CategorySection } from '@/components/CategorySection';
import { SongCard } from '@/components/SongCard';
import { AlbumCard } from '@/components/AlbumCard';
import { ArtistCard } from '@/components/ArtistCard';
import { FocusSection } from '@/components/FocusSection';
import { MadeForYou } from '@/components/MadeForYou';
import { RecentHindiReleases } from '@/components/RecentHindiReleases';
import { NoCopyrightSection } from '@/components/NoCopyrightSection';
import { Button } from '@/components/ui/button';
import { searchMusic, getAudioStream, getCategorySongs } from '@/lib/api';
import { Music, Disc, User, Loader2, ListMusic, Plus, AlertCircle, X } from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonCard';
import { usePlaylist } from '@/context/PlaylistContext';

export function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { playlists, openAddToPlaylist, createPlaylist } = usePlaylist();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [playError, setPlayError] = useState(null);
    const playErrorTimer = useRef(null);

    const lastSearchRef = useState({ query: null, offset: -1 })[0]; // Use mutable ref-like object stable across renders

    // Auto-clear play error after 5 seconds
    const showPlayError = (msg) => {
        setPlayError(msg);
        clearTimeout(playErrorTimer.current);
        playErrorTimer.current = setTimeout(() => setPlayError(null), 5000);
    };

    // Load search results from URL on mount or when URL params change
    useEffect(() => {
        const queryParam = searchParams.get('q');

        // Prevent duplicate search for same query
        if (queryParam && !currentCategory) {
            if (lastSearchRef.query !== queryParam) {
                lastSearchRef.query = queryParam;
                setQuery(queryParam);
                setSearchError(null);
                executeSearch(queryParam, 0);
            }
        } else if (!queryParam && !currentCategory) {
            // Reset to home if no query and no category (Back button pressed)
            if (results !== null) {
                setResults(null);
                setQuery('');
                setSearchError(null);
                lastSearchRef.query = null;
            }
        }
    }, [searchParams]);

    const executeSearch = async (searchQuery, currentOffset = 0) => {
        setLoading(true);
        if (currentOffset === 0) {
            setResults(null); // Clear previous results on new search
            setOffset(0);
            setHasMore(true);
        }

        try {
            const data = await searchMusic(searchQuery, currentOffset);

            if (currentOffset === 0) {
                setResults(data);
            } else {
                setResults(prev => ({
                    songs: [...(prev?.songs || []), ...(data?.songs || [])],
                    albums: [...(prev?.albums || []), ...(data?.albums || [])],
                    artists: [...(prev?.artists || []), ...(data?.artists || [])]
                }));
            }

            const totalResults = (data?.songs?.length || 0) + (data?.albums?.length || 0) + (data?.artists?.length || 0);
            setHasMore(totalResults >= 50);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchError(error?.message || 'Search failed. Check your connection and try again.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSearch = (searchQuery) => {
        // Just update URL - useEffect will trigger the search
        setCurrentCategory(null);
        setSearchParams({ q: searchQuery });
        setQuery(searchQuery);
    };

    const handleCategoryClick = async (categoryInfo) => {
        setLoading(true);
        setCurrentCategory(categoryInfo);
        setQuery('');
        setSearchParams({}); // Clear query param
        setResults(null);
        setOffset(0);

        try {
            let data;
            if (categoryInfo.query) {
                // Search-based category (Made For You, Focus, etc.) — supports pagination
                data = await searchMusic(categoryInfo.query, 0);
                const totalResults = (data?.songs?.length || 0) + (data?.albums?.length || 0) + (data?.artists?.length || 0);
                setHasMore(totalResults >= 50);
            } else {
                // ID-based category (Featured) — no pagination support
                data = await getCategorySongs(categoryInfo.id);
                setHasMore(false);
            }
            setResults(data);
        } catch (error) {
            console.error('Category fetch failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecentSearchClick = (searchQuery) => {
        handleSearch(searchQuery);
    };

    const handlePlaySong = async (song) => {
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
            };


            // If viewing a category, add queue support
            if (currentCategory && results && results.songs) {
                const songIndex = results.songs.findIndex(s => s.search_term === song.search_term);
                if (songIndex !== -1) {
                    trackData.queue = results.songs;
                    trackData.currentIndex = songIndex;
                }
            }

            // Dispatch custom event to notify StickyPlayer
            window.dispatchEvent(new CustomEvent('playTrack', { detail: trackData }));
        } catch (error) {
            console.error('Failed to play song:', error);
            showPlayError(`Couldn't play "${song.title}" — ${!navigator.onLine ? 'no internet connection' : 'stream unavailable. Try again.'}`);
        }
    };

    const handlePlayAll = async () => {
        if (!results || !results.songs || results.songs.length === 0) return;

        try {
            const firstSong = results.songs[0];
            const { stream_url, source } = await getAudioStream(firstSong.search_term);

            const trackData = {
                title: firstSong.title,
                artist: firstSong.artist,
                img: firstSong.image,
                album: firstSong.album || null,
                album_id: firstSong.album_id || null,
                stream_url,
                source,
                queue: results.songs,
                currentIndex: 0,
            };

            window.dispatchEvent(new CustomEvent('playTrack', { detail: trackData }));
        } catch (error) {
            console.error('Failed to play all:', error);
            showPlayError("Couldn't start playback — please try again.");
        }
    };

    const handleShuffle = async () => {
        if (!results || !results.songs || results.songs.length === 0) return;

        const shuffled = [...results.songs].sort(() => Math.random() - 0.5);

        try {
            const firstSong = shuffled[0];
            const { stream_url, source } = await getAudioStream(firstSong.search_term);

            const trackData = {
                title: firstSong.title,
                artist: firstSong.artist,
                img: firstSong.image,
                album: firstSong.album || null,
                album_id: firstSong.album_id || null,
                stream_url,
                source,
                queue: shuffled,
                currentIndex: 0,
            };

            window.dispatchEvent(new CustomEvent('playTrack', { detail: trackData }));
        } catch (error) {
            console.error('Failed to shuffle:', error);
        }
    };

    const handleBackToHome = () => {
        setResults(null);
        setCurrentCategory(null);
        setQuery('');
        setSearchParams({});  // Clear URL search params
        setOffset(0);
        setHasMore(true);
    };

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const newOffset = offset + 50;
        setOffset(newOffset);

        // For text searches use the query; for query-based categories use the category query
        const currentQuery = query || searchParams.get('q') || currentCategory?.query;
        if (currentQuery) {
            await executeSearch(currentQuery, newOffset);
        } else {
            // ID-based categories don't support pagination — shouldn't reach here
            setLoadingMore(false);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8 pb-32 relative">
            {/* Play error toast — top-right floating notification */}
            {playError && (
                <div className="fixed top-4 right-4 z-[150] max-w-sm animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex items-start gap-3 bg-zinc-900 border border-red-800/50 text-sm text-red-300 px-4 py-3 rounded-xl shadow-2xl shadow-black/50">
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="flex-1 leading-snug">{playError}</p>
                        <button onClick={() => setPlayError(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-volt mb-2">⚡ Volt Music</h1>
                <p className="text-muted-foreground">Search and stream your favorite music</p>
            </div>

            <div className="mb-8">
                <SearchBar onSearch={handleSearch} query={query} setQuery={setQuery} />
            </div>

            {!results && !loading && (
                <>
                    <RecentSearches onSearchClick={handleRecentSearchClick} />

                    {/* My Playlists — shown above Explore Music when playlists exist */}
                    {playlists.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <ListMusic className="h-5 w-5 text-primary" />
                                    My Playlists
                                </h2>
                                <button
                                    onClick={() => createPlaylist('New Playlist')}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" /> New
                                </button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {playlists.map((pl) => (
                                    <button
                                        key={pl.id}
                                        onClick={() => navigate(`/playlist/${pl.id}`)}
                                        className="flex-shrink-0 w-36 group focus:outline-none"
                                    >
                                        {/* Mosaic cover */}
                                        <div className="w-36 h-36 rounded-xl overflow-hidden bg-zinc-800 mb-2 shadow-md ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                                            {pl.songs.length > 0 ? (
                                                <div className="grid grid-cols-2 w-full h-full">
                                                    {pl.songs.slice(0, 4).map((s, i) => (
                                                        <div key={i} className="w-full h-full overflow-hidden">
                                                            <img src={s.img || s.image} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                    {pl.songs.length < 4 && [...Array(4 - pl.songs.length)].map((_, i) => (
                                                        <div key={i} className="bg-zinc-700 flex items-center justify-center">
                                                            <ListMusic className="h-4 w-4 text-zinc-500" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ListMusic className="h-10 w-10 text-zinc-500" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold truncate text-left group-hover:text-primary transition-colors">{pl.name}</p>
                                        <p className="text-xs text-muted-foreground text-left">{pl.songs.length} song{pl.songs.length !== 1 ? 's' : ''}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <FeaturedCategories onCategoryClick={handleCategoryClick} />
                    <MadeForYou onCategoryClick={handleCategoryClick} />
                    <FocusSection onCategoryClick={handleCategoryClick} />
                    <PopularAlbums onViewAll={() => handleCategoryClick({
                        id: 'popular_albums',
                        title: 'Popular Albums',
                        description: 'Top albums from around the world'
                    })} />
                    <RecentHindiReleases onCategoryClick={handleCategoryClick} />
                    <ChartsSection
                        onSongPlay={handlePlaySong}
                        onViewAll={() => handleCategoryClick({
                            id: 'charts_hindi',
                            title: 'Top Hindi Charts',
                            description: 'Most popular Hindi songs'
                        })}
                    />
                    <NoCopyrightSection onCategoryClick={handleCategoryClick} />
                </>
            )}

            {loading && !results && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {results &&
                (!results.songs?.length && !results.albums?.length && !results.artists?.length) && !searchError && (
                    <div className="text-center py-12">
                        <div className="inline-block p-4 rounded-full bg-secondary mb-4">
                            <Music className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No results found</h3>
                        <p className="text-muted-foreground">Try adjusting your search terms</p>
                    </div>
                )}

            {/* Search error state */}
            {searchError && (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Search failed</h3>
                    <p className="text-zinc-400 mb-6 max-w-sm mx-auto">{searchError}</p>
                    <Button
                        onClick={() => { setSearchError(null); if (query) executeSearch(query, 0); }}
                        variant="outline"
                        className="gap-2"
                    >
                        <Loader2 className="h-4 w-4" />
                        Try again
                    </Button>
                </div>
            )}

            {results && (
                <>
                    {/* Category Header with Controls */}
                    {currentCategory && (
                        <div className="mb-6">
                            {/* Back Button */}
                            <Button variant="ghost" className="mb-4" onClick={handleBackToHome}>
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Home
                            </Button>

                            {/* Category Title */}
                            <div className="text-center mb-4">
                                <h2 className="text-3xl font-bold mb-2">{currentCategory.title}</h2>
                                <p className="text-muted-foreground">{currentCategory.description}</p>
                            </div>

                            {/* Play Controls - Only show if there are songs */}
                            {results.songs && results.songs.length > 0 && (
                                <div className="flex gap-3 justify-center mb-6">
                                    <Button size="lg" onClick={handlePlayAll} className="gap-2">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        Play All
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={handleShuffle} className="gap-2">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4l2.5 4L13 4h7m0 0v4m0-4l-5 5m5 11h-7l-2.5-4L8 20H4m16 0v-4m0 4l-5-5" />
                                        </svg>
                                        Shuffle
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Songs Section - Always show for categories, otherwise show normally */}
                    {results.songs && results.songs.length > 0 && (
                        <CategorySection
                            title={currentCategory ? "Songs" : "Songs"}
                            icon={<Music />}
                            count={results.songs.length}
                        >
                            {results.songs.map((song, idx) => (
                                <SongCard key={idx} song={song} onPlay={handlePlaySong} />
                            ))}
                        </CategorySection>
                    )}

                    {/* Albums Section - Show if albums exist */}
                    {results.albums && results.albums.length > 0 && (
                        <CategorySection title="Albums" icon={<Disc />} count={results.albums.length}>
                            {results.albums.map((album, idx) => (
                                <AlbumCard key={idx} album={album} />
                            ))}
                        </CategorySection>
                    )}

                    {/* Artists Section - Hide for category searches */}
                    {!currentCategory && results.artists && results.artists.length > 0 && (
                        <CategorySection title="Artists" icon={<User />} count={results.artists.length}>
                            {results.artists.map((artist, idx) => (
                                <ArtistCard key={idx} artist={artist} />
                            ))}
                        </CategorySection>
                    )}
                </>
            )}

            {results && hasMore && (
                <div className="flex justify-center mt-8 pt-4 border-t border-border">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="min-w-[150px]"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
