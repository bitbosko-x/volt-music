import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export function RecentHindiReleases({ onCategoryClick }) {
    const handleViewAll = () => {
        onCategoryClick({
            id: 'recent_hindi_releases',
            title: 'Recent Hindi Releases',
            description: 'Latest Hindi songs just dropped'
        });
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl">🎵 Recent Hindi Releases</CardTitle>
                        <CardDescription>Discover the latest Hindi tracks</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={handleViewAll}>
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Click "View All" to explore recent Hindi song releases
                </p>
            </CardContent>
        </Card>
    );
}
