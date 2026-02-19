import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RecentSearches({ onSearchClick }) {
    const [searchHistory, setSearchHistory] = useState([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(history.slice(0, 6)); // Show only first 6
    };

    const removeFromHistory = (item, e) => {
        e.stopPropagation();
        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        history = history.filter(h => h !== item);
        localStorage.setItem('searchHistory', JSON.stringify(history));
        loadHistory();
    };

    const clearAllHistory = () => {
        localStorage.removeItem('searchHistory');
        setSearchHistory([]);
    };

    if (searchHistory.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recently Searched
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllHistory}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Clear All
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchHistory.map((item, idx) => (
                    <Card
                        key={idx}
                        onClick={() => onSearchClick(item)}
                        className="p-4 hover:bg-accent transition-all cursor-pointer group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <History className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">{item}</p>
                                <p className="text-xs text-muted-foreground">Search query</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => removeFromHistory(item, e)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
