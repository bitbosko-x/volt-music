import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { searchMusic } from '@/lib/api';

const creators = [
    {
        name: "NCS",
        subtitle: "NoCopyrightSounds",
        // iTunes search for a known NCS track's art
        itunesQuery: "Cartoon On On feat Daniel Levi",
        query: "NoCopyrightSounds",
        fallbackColor: "06B6D4",
    },
    {
        name: "Alan Walker",
        subtitle: "Electronic / EDM",
        itunesQuery: "Alan Walker Faded",
        query: "Alan Walker",
        fallbackColor: "1E3A5F",
    },
    {
        name: "Elektronomia",
        subtitle: "NCS Release",
        itunesQuery: "Elektronomia Sky High",
        query: "Elektronomia",
        fallbackColor: "7C3AED",
    },
    {
        name: "TheFatRat",
        subtitle: "Free music",
        itunesQuery: "TheFatRat Unity",
        query: "TheFatRat",
        fallbackColor: "F97316",
    },
    {
        name: "Tobu",
        subtitle: "Free to use",
        itunesQuery: "Tobu Hope",
        query: "Tobu",
        fallbackColor: "10B981",
    },
    {
        name: "Disfigure",
        subtitle: "NCS Release",
        itunesQuery: "Disfigure Blank",
        query: "Disfigure",
        fallbackColor: "EC4899",
    },
];

async function fetchSongArt(itunesQuery, fallbackColor, name) {
    try {
        // Use our backend API to avoid CORS issues and get HQ images
        const data = await searchMusic(itunesQuery);
        // data.songs is an array of songs with .image property
        if (data && data.songs && data.songs.length > 0) {
            return data.songs[0].image;
        }
    } catch (_) { }
    // Fallback UI Avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=${fallbackColor}&color=fff&bold=true&font-size=0.35`;
}

export function NoCopyrightSection({ onCategoryClick }) {
    const [images, setImages] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const loadImages = async () => {
            // Create a promise for each creator
            const promises = creators.map(c => fetchSongArt(c.itunesQuery, c.fallbackColor, c.name));

            // Wait for all (or handle individually if needed, but Promise.all is fine here as fetchSongArt handles errors)
            const results = await Promise.all(promises);

            if (!cancelled) {
                setImages(results);
            }
        };

        loadImages();

        return () => { cancelled = true; };
    }, []);

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🎵 No Copyright Music
            </h2>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {creators.map((creator, idx) => (
                    <Card
                        key={idx}
                        onClick={() => onCategoryClick({
                            id: `nocopyright_${idx}`,
                            title: creator.name,
                            description: creator.subtitle,
                            query: creator.query,
                        })}
                        className="p-3 cursor-pointer hover:bg-accent transition-all group flex flex-col items-center text-center gap-2 border-none bg-secondary/50"
                    >
                        {/* Circular DP */}
                        <div className="relative aspect-square w-full max-w-[80px] rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                            {images[idx] ? (
                                <img
                                    src={images[idx]}
                                    alt={creator.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&size=200&background=${creator.fallbackColor}&color=fff&bold=true`;
                                    }}
                                />
                            ) : (
                                <div
                                    className="w-full h-full animate-pulse rounded-full"
                                    style={{ background: `#${creator.fallbackColor}66` }}
                                />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="h-5 w-5 fill-white text-white" />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold truncate w-full leading-tight">{creator.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate w-full">{creator.subtitle}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
