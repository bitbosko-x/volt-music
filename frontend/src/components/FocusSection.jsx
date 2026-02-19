import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Brain, Coffee, Moon, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FocusSection({ onCategoryClick }) {

    const focusPlaylists = [
        {
            title: "Lofi Beats",
            subtitle: "Chill & Relax",
            icon: Coffee,
            color: "bg-orange-100 text-orange-600",
            query: "lofi hip hop radio"
        },
        {
            title: "Deep Focus",
            subtitle: "Instrumental Study",
            icon: Brain,
            color: "bg-blue-100 text-blue-600",
            query: "deep focus instrumental"
        },
        {
            title: "Sleep Sound",
            subtitle: "Ambient Peace",
            icon: Moon,
            color: "bg-indigo-100 text-indigo-600",
            query: "ambient sleep music"
        },
        {
            title: "Reading Jazz",
            subtitle: "Soft Background",
            icon: BookOpen,
            color: "bg-emerald-100 text-emerald-600",
            query: "coffee shop jazz"
        }
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Focus & Study
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {focusPlaylists.map((playlist, idx) => {
                    const Icon = playlist.icon;
                    return (
                        <Card
                            key={idx}
                            onClick={() => onCategoryClick({
                                id: `focus_${idx}`,
                                title: playlist.title,
                                description: playlist.subtitle,
                                query: playlist.query
                            })}
                            className="p-4 cursor-pointer hover:bg-accent transition-colors group"
                        >
                            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${playlist.color}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">{playlist.title}</h3>
                            <p className="text-sm text-muted-foreground">{playlist.subtitle}</p>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
