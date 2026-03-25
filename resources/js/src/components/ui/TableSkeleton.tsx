import React, { useEffect, useRef } from 'react';

interface TableSkeletonProps {
    columns: number;
    rows?: number;
    rowsOnly?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5, rowsOnly = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const BORDER = 2;
        const RADIUS = 12;
        const TAIL = 0.22;
        const SPEED = 0.0002; // much slower

        let progress = 0;
        let lastTime = 0;

        const primaryHsl = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary')?.trim() || '239 84% 67%';
        const primaryColor = `hsl(${primaryHsl})`;

        const resize = () => {
            const { width, height } = wrapper.getBoundingClientRect();
            canvas.width = width * devicePixelRatio;
            canvas.height = height * devicePixelRatio;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        };

        const getPerimeterPoint = (t: number, x: number, y: number, w: number, h: number, r: number) => {
            const segs = [
                w - 2 * r,
                (Math.PI / 2) * r,
                h - 2 * r,
                (Math.PI / 2) * r,
                w - 2 * r,
                (Math.PI / 2) * r,
                h - 2 * r,
                (Math.PI / 2) * r,
            ];
            const total = segs.reduce((s, v) => s + v, 0);
            let dist = ((t % 1) + 1) % 1 * total;

            const corners = [
                { cx: x + w - r, cy: y + r,     startAngle: -Math.PI / 2 },
                { cx: x + w - r, cy: y + h - r, startAngle: 0 },
                { cx: x + r,     cy: y + h - r, startAngle: Math.PI / 2 },
                { cx: x + r,     cy: y + r,     startAngle: Math.PI },
            ];
            const straight = [
                { x1: x + r,     y1: y,         dx: 1,  dy: 0  },
                { x1: x + w,     y1: y + r,     dx: 0,  dy: 1  },
                { x1: x + w - r, y1: y + h,     dx: -1, dy: 0  },
                { x1: x,         y1: y + h - r, dx: 0,  dy: -1 },
            ];

            for (let i = 0; i < 8; i++) {
                const seg = segs[i];
                if (dist <= seg.len || dist <= seg) {
                    const len = typeof seg === 'number' ? seg : seg.len;
                    if (dist <= len) {
                        const frac = dist / len;
                        if (i % 2 === 0) {
                            const s = straight[i / 2];
                            return { px: s.x1 + s.dx * dist, py: s.y1 + s.dy * dist };
                        } else {
                            const c = corners[(i - 1) / 2];
                            const angle = c.startAngle + frac * (Math.PI / 2);
                            return { px: c.cx + Math.cos(angle) * r, py: c.cy + Math.sin(angle) * r };
                        }
                    }
                }
                dist -= (typeof seg === 'number' ? seg : seg.len);
            }
            return { px: x + r, py: y };
        };

        const draw = (timestamp: number) => {
            if (!lastTime) lastTime = timestamp;
            const dt = Math.min(timestamp - lastTime, 32); // cap delta to avoid jumps
            lastTime = timestamp;
            progress = (progress + SPEED * dt) % 1;

            const dpr = devicePixelRatio;
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            const x = BORDER * dpr / 2;
            const y = BORDER * dpr / 2;
            const w = W - BORDER * dpr;
            const h = H - BORDER * dpr;
            const r = RADIUS * dpr;

            // Base border
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y, x + w, y + r, r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(128,128,128,0.15)';
            ctx.lineWidth = BORDER * dpr;
            ctx.stroke();
            ctx.restore();

            // Draw tail as a single smooth gradient stroke
            // Use many points to build a polyline, then stroke each micro-segment
            const STEPS = 220; // dense enough to be fully solid
            for (let i = 0; i < STEPS; i++) {
                const t0 = progress - (i / STEPS) * TAIL;
                const t1 = progress - ((i + 1) / STEPS) * TAIL;
                const p0 = getPerimeterPoint(t0, x, y, w, h, r);
                const p1 = getPerimeterPoint(t1, x, y, w, h, r);

                const headFrac = 1 - i / STEPS; // 1 at head, 0 at tail
                const alpha = Math.pow(headFrac, 1.8);

                ctx.beginPath();
                ctx.moveTo(p0.px, p0.py);
                ctx.lineTo(p1.px, p1.py);
                ctx.strokeStyle = primaryColor;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = BORDER * dpr * (0.5 + headFrac * 0.7);
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            ctx.globalAlpha = 1;

            // Bright head dot
            const head = getPerimeterPoint(progress, x, y, w, h, r);
            ctx.beginPath();
            ctx.arc(head.px, head.py, 2 * dpr, 0, Math.PI * 2);
            ctx.fillStyle = primaryColor;
            ctx.fill();

            rafRef.current = requestAnimationFrame(draw);
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(wrapper);
        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, []);

    const renderRows = () => (
        <>
            {Array.from({ length: rows }).map((_, rIndex) => (
                <tr
                    key={rIndex}
                    className="animate-pulse border-b border-gray-100 dark:border-gray-800 last:border-0"
                    style={{ animationDuration: '2s' }}
                >
                    {Array.from({ length: columns }).map((_, cIndex) => (
                        <td key={cIndex} className="py-4 px-4">
                            <div
                                className="h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full"
                                style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );

    if (rowsOnly) return renderRows();

    return (
        <div ref={wrapperRef} className="relative w-full rounded-xl">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ zIndex: 1 }}
            />
            <div className="relative rounded-xl overflow-hidden bg-white dark:bg-gray-900" style={{ zIndex: 0 }}>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="py-3 px-4">
                                    <div
                                        className="h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full w-2/3 animate-pulse"
                                        style={{ animationDuration: '3s' }}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>{renderRows()}</tbody>
                </table>
            </div>
        </div>
    );
};

export default TableSkeleton;