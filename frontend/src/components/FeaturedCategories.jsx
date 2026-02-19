import { Card } from '@/components/ui/card';
import { Music, TrendingUp, Award, Radio, Sparkles } from 'lucide-react';

export function FeaturedCategories({ onCategoryClick }) {
    const categories = [
        {
            id: 'latest',
            title: 'Latest Releases',
            description: 'Fresh new music',
            icon: Sparkles,
            gradient: 'from-purple-500 to-pink-500',
            query: 'new music 2024'  // More specific for recent releases
        },
        {
            id: 'top100',
            title: 'Top 100',
            description: 'Chart-topping hits',
            icon: Award,
            gradient: 'from-yellow-500 to-orange-500',
            query: 'billboard hot 100'  // Gets actual chart songs
        },
        {
            id: 'trending',
            title: 'Trending Now',
            description: 'Viral hits',
            icon: TrendingUp,
            gradient: 'from-green-500 to-teal-500',
            query: 'viral songs 2024'  // More relevant trending content
        },
        {
            id: 'hits',
            title: 'Greatest Hits',
            description: 'All-time classics',
            icon: Radio,
            gradient: 'from-blue-500 to-indigo-500',
            query: 'classic hits greatest'  // Better for timeless songs
        }
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Music className="h-5 w-5" />
                Explore Music
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <Card
                            key={category.id}
                            onClick={() => onCategoryClick(category)}  // Pass full category object
                            className="relative overflow-hidden cursor-pointer group hover:scale-105 transition-all duration-300"
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />

                            {/* Content */}
                            <div className="relative p-6">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>

                                <h3 className="font-bold text-lg mb-1">{category.title}</h3>
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                            </div>

                            {/* Hover Arrow */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
