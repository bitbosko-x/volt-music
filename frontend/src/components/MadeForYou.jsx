import { Card } from '@/components/ui/card';
import { Sparkles, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MadeForYou({ onCategoryClick }) {

    const mixes = [
        {
            title: "My Super Mix",
            subtitle: "Your favorite styles",
            gradient: "from-pink-500 via-red-500 to-yellow-500",
            query: "best songs mix"
        },
        {
            title: "Discover Mix",
            subtitle: "New gems for you",
            gradient: "from-blue-400 via-indigo-500 to-purple-500",
            query: "new music mix"
        },
        {
            title: "Chill Mix",
            subtitle: "Relax & Unwind",
            gradient: "from-green-400 to-cyan-500",
            query: "chill mix"
        },
        {
            title: "Party Mix",
            subtitle: "Get the energy up",
            gradient: "from-yellow-400 via-orange-500 to-red-500",
            query: "party mix"
        }
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Made For You
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {mixes.map((mix, idx) => (
                    <Card
                        key={idx}
                        onClick={() => onCategoryClick({
                            id: `mix_${idx}`,
                            title: mix.title,
                            description: mix.subtitle,
                            query: mix.query
                        })}
                        className="relative h-40 overflow-hidden cursor-pointer group rounded-xl border-none shadow-md"
                    >
                        {/* Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${mix.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />

                        {/* Content */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                            <div className="mb-auto opacity-0 group-hover:opacity-100 transition-opacity self-end">
                                <span className="bg-black/30 p-2 rounded-full inline-flex backdrop-blur-sm">
                                    <Play className="h-5 w-5 fill-white" />
                                </span>
                            </div>
                            <h3 className="font-bold text-lg leading-tight">{mix.title}</h3>
                            <p className="text-xs text-white/80 font-medium">{mix.subtitle}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
