import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

export function PopularAlbums({ onViewAll }) {
    const navigate = useNavigate();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Static popular albums to prevent slow loading
        const staticAlbums = [
            {
                id: 1699799210,
                title: "AUSTIN (Bonus)",
                artist: "Post Malone",
                image: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/9a/aa/8c/9aaa8c62-7567-d1d6-fdca-bf6ac60e9d66/23UMGIM50188.rgb.jpg/600x600bb.jpg"
            },
            {
                id: 1771721470,
                title: "THE TORTURED POETS DEPARTMENT: THE ANTHOLOGY",
                artist: "Taylor Swift",
                image: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f2/e9/df/f2e9dfd0-6602-1aef-6171-51cd3138df86/24UM1IM07019.rgb.jpg/600x600bb.jpg"
            },
            {
                id: 1499385848,
                title: "After Hours",
                artist: "The Weeknd",
                image: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/b9/fe/2bb9fef5-d7f3-8345-25a9-db0e79fde4e4/20UMGIM11048.rgb.jpg/600x600bb.jpg"
            },
            {
                id: 1658650093,
                title: "SOS",
                artist: "SZA",
                image: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/600x600bb.jpg"
            },
            {
                id: 1560734944,
                title: "SOUR",
                artist: "Olivia Rodrigo",
                image: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/02/ed/8c/02ed8cab-c089-2fdd-7ce6-ab334a9a4e19/21UMGIM26093.rgb.jpg/600x600bb.jpg"
            },
            {
                id: 1584449196,
                title: "Certified Lover Boy",
                artist: "Drake",
                image: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/cb/6b/5f/cb6b5fc3-8d35-908a-18e6-6f8eda46ce11/21UM1IM07521.rgb.jpg/600x600bb.jpg"
            }
        ];

        setAlbums(staticAlbums);
        setLoading(false);
    }, []);

    const handleViewAll = () => {
        // Search for popular music to show diverse albums
        navigate('/?q=taylor+swift');
    };

    if (loading) {
        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Popular Albums</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-40 h-48 bg-accent animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Popular Albums</h2>
                <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
                    View All
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {albums.map((album, idx) => (
                    <Card
                        key={idx}
                        onClick={() => navigate(`/album/${album.id}`)}
                        className="flex-shrink-0 w-40 p-3 hover:bg-accent transition-all cursor-pointer group"
                    >
                        <div className="aspect-square mb-3 overflow-hidden rounded-md">
                            <img
                                src={album.image}
                                alt={album.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                        </div>
                        <p className="font-semibold text-sm truncate">{album.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}
