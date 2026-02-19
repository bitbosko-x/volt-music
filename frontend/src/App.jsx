import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { AlbumDetail } from '@/pages/AlbumDetail';
import { ArtistDetail } from '@/pages/ArtistDetail';
import { PlaylistPage } from '@/pages/PlaylistPage';
import { StickyPlayer } from '@/components/StickyPlayer';
import { PlaylistModal } from '@/components/PlaylistModal';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BackendOfflinePage, BackendErrorBanner } from '@/components/BackendError';
import { useBackendHealth } from '@/lib/useBackendHealth';

function AppContent() {
    const { isOnline, isChecking, retry } = useBackendHealth();
    const [bannerDismissed, setBannerDismissed] = useState(false);

    // Reset banner if connection is lost again
    useEffect(() => {
        if (isOnline === false) setBannerDismissed(false);
    }, [isOnline]);

    // Full offline screen on first load when backend is unreachable
    if (isOnline === false) {
        return <BackendOfflinePage onRetry={retry} isRetrying={isChecking} />;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Slim banner for transient/reconnection errors — dismissible */}
            {isOnline === null && !isChecking && !bannerDismissed && (
                <BackendErrorBanner
                    message="Connecting to the Volt Music backend…"
                    onRetry={retry}
                    isRetrying={isChecking}
                    onDismiss={() => setBannerDismissed(true)}
                />
            )}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/album/:albumId" element={<AlbumDetail />} />
                <Route path="/artist/:artistName" element={<ArtistDetail />} />
                <Route path="/playlist/:id" element={<PlaylistPage />} />
            </Routes>
            <StickyPlayer />
            <PlaylistModal />
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <PlaylistProvider>
                <Router>
                    <AppContent />
                </Router>
            </PlaylistProvider>
        </ErrorBoundary>
    );
}

export default App;
