import { useEffect, useRef } from 'react';

export function MusicBars({ isPlaying, analyser }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const animationRef = useRef(null);
    const prevBarsRef = useRef([]);

    // Keep refs in sync with latest props so the rAF loop is never stale
    const isPlayingRef = useRef(isPlaying);
    const analyserRef = useRef(analyser);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { analyserRef.current = analyser; }, [analyser]);

    const getBarCount = () => {
        const w = window.innerWidth;
        if (w < 640) return 40;
        if (w < 1024) return 70;
        return 120;
    };
    const BAR_GAP = 2;

    // Start/stop the loop based on isPlaying
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Size canvas to physical pixels
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const { width, height } = container.getBoundingClientRect();
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const render = () => {
            const playing = isPlayingRef.current;
            const asr = analyserRef.current;

            const BAR_COUNT = getBarCount();
            if (prevBarsRef.current.length !== BAR_COUNT) {
                prevBarsRef.current = new Array(BAR_COUNT).fill(0);
            }

            const W = container.clientWidth;
            const H = container.clientHeight;
            ctx.clearRect(0, 0, W, H);

            // --- Read frequency data ---
            let dataArray = null;
            if (asr) {
                dataArray = new Uint8Array(asr.frequencyBinCount);
                asr.getByteFrequencyData(dataArray);
                // If all zero (context suspended or CORS) → fall back to sim
                if (!dataArray.some(v => v > 0)) dataArray = null;
            }

            const totalBarW = (W - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;

            for (let i = 0; i < BAR_COUNT; i++) {
                let target = 3;

                if (dataArray) {
                    // Real analyser data — use logarithmic mapping for better sensitivity
                    const binCount = dataArray.length;
                    const minBin = 1;
                    const maxBin = Math.floor(binCount * 0.75);
                    const t = i / BAR_COUNT;
                    const startBin = Math.floor(minBin + (maxBin - minBin) * t);
                    const endBin = Math.max(startBin + 1, Math.floor(minBin + (maxBin - minBin) * ((i + 1) / BAR_COUNT)));

                    let sum = 0, cnt = 0;
                    for (let b = startBin; b < endBin && b < binCount; b++) {
                        sum += dataArray[b];
                        cnt++;
                    }
                    const avg = cnt > 0 ? sum / cnt : 0;
                    // Linear-boosted normalization (not squared — more sensitive to quiet audio)
                    const norm = Math.min(1, (avg / 255) * 1.8);
                    target = norm * H * 0.85;

                } else if (playing) {
                    // Animated simulation — time-based wave, looks musical
                    const t = Date.now() / 500;
                    const wave =
                        Math.sin(i * 0.13 + t) * 0.4 +
                        Math.sin(i * 0.07 - t * 1.3) * 0.3 +
                        Math.cos(i * 0.2 + t * 0.8) * 0.3;
                    const n = (wave + 1) / 2; // 0..1
                    target = Math.pow(n, 1.5) * H * 0.7;
                }

                // Smooth physics (lerp up fast, decay slow)
                const prev = prevBarsRef.current[i] || 3;
                const current = target > prev
                    ? prev + (target - prev) * 0.15
                    : prev * 0.92;
                const clamped = Math.min(H, Math.max(3, current));
                prevBarsRef.current[i] = clamped;

                const x = i * (totalBarW + BAR_GAP);
                const y = H - clamped;

                // Original white fill
                ctx.fillStyle = '#FFFFFF';

                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x, y, totalBarW, clamped, 10);
                else ctx.rect(x, y, totalBarW, clamped);
                ctx.fill();
            }

            // Keep looping as long as playing
            if (isPlayingRef.current) {
                animationRef.current = requestAnimationFrame(render);
            }
        };

        if (isPlaying) {
            // Cancel any existing loop before starting
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            render();
        } else {
            // Draw flat idle bars
            if (animationRef.current) cancelAnimationFrame(animationRef.current);

            const BAR_COUNT = getBarCount();
            const W = container.clientWidth;
            const H = container.clientHeight;
            ctx.clearRect(0, 0, W, H);
            const totalBarW = (W - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;
            for (let i = 0; i < BAR_COUNT; i++) {
                const x = i * (totalBarW + BAR_GAP);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x, H - 3, totalBarW, 3, 10);
                else ctx.rect(x, H - 3, totalBarW, 3);
                ctx.fill();
            }
        }

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying]); // ← only re-run on isPlaying changes; analyser is read via ref live each frame

    return (
        <div ref={containerRef} className="w-full h-16 mb-0">
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}
