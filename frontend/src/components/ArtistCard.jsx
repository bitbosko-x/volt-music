import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

export function ArtistCard({ artist }) {
    return (
        <Link to={`/artist/${encodeURIComponent(artist.name)}`}>
            <Card className="flex items-center p-3 hover:bg-accent transition-all cursor-pointer group">
                {artist.image ? (
                    <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-20 h-20 rounded-full object-cover mr-4"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mr-4">
                        <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate group-hover:text-primary transition-colors">
                        {artist.name}
                    </p>
                    {artist.genre && (
                        <p className="text-sm text-muted-foreground truncate">
                            {artist.genre}
                        </p>
                    )}
                </div>
                <Badge variant="secondary" className="bg-cyan-600">ARTIST</Badge>
            </Card>
        </Link>
    );
}
