import { useState, useEffect, useRef } from 'react';
import { Search, History, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchBar({ onSearch, query, setQuery }) {
    const [searchHistory, setSearchHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Load search history from localStorage
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(history);

        // Click outside to close dropdown
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowHistory(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveToHistory = (searchQuery) => {
        if (!searchQuery.trim()) return;

        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        // Remove if already exists
        history = history.filter(item => item !== searchQuery);
        // Add to beginning
        history.unshift(searchQuery);
        // Keep only last 10
        history = history.slice(0, 10);

        localStorage.setItem('searchHistory', JSON.stringify(history));
        setSearchHistory(history);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            saveToHistory(query);
            onSearch(query);
            setShowHistory(false);
        }
    };

    const handleHistoryClick = (historyItem) => {
        setQuery(historyItem);
        onSearch(historyItem);
        setShowHistory(false);
    };

    const clearHistory = () => {
        localStorage.removeItem('searchHistory');
        setSearchHistory([]);
    };

    return (
        <div ref={wrapperRef} className="relative flex gap-2 w-full max-w-2xl mx-auto">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                    type="text"
                    placeholder="Search for songs, albums, or artists..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    className="pl-10 h-12 text-base"
                />

                {/* Search History Dropdown */}
                {showHistory && searchHistory.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-card border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                        <div className="flex items-center justify-between p-2 border-b">
                            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Recent Searches
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearHistory}
                                className="h-6 text-xs"
                            >
                                Clear All
                            </Button>
                        </div>
                        {searchHistory.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleHistoryClick(item)}
                                className="w-full text-left px-4 py-2 hover:bg-accent transition-colors flex items-center gap-2 group"
                            >
                                <History className="h-3 w-3 text-muted-foreground" />
                                <span className="flex-1 truncate">{item}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <Button type="submit" size="lg" className="h-12 px-8" onClick={handleSubmit}>
                Search
            </Button>
        </div>
    );
}
