import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    getToneFill,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 640
export const height = 780
export const alt =
    'Per-sequence KV-cache bars on one zero-based scale: 16.8 GB at 128K tokens and eight KV heads, 65.5 GB at 500K, 131.1 GB at 1M, and 524.3 GB at 1M with 32 KV heads. All use 32 full-history layers, head dimension 128, and two-byte values; weights and overhead are excluded.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    size = 24,
    color = c.textPrimary,
    weight = 500,
    align: 'left' | 'center' | 'right' = 'center',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * 1.6,
        children: (
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={size}
                fontWeight={weight}
                color={color}
                align={align}
            />
        ),
    })
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)
    const data = [
        { label: '128K tokens · 8 heads', v: 16.777216 },
        { label: '500K tokens · 8 heads', v: 65.536 },
        { label: '1M tokens · 8 heads', v: 131.072 },
        { label: '1M tokens · 32 heads', v: 524.288 },
    ]
    const x = (gb: number) => 40 + (gb / 560) * 450
    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {data.map((d, i) => (
                            <rect
                                key={d.label}
                                x="40"
                                y={250 + i * 105}
                                width={x(d.v) - 40}
                                height="33"
                                rx="4"
                                fill={tone(i === 3 ? 'warm' : 'purple')}
                            />
                        ))}
                        <line
                            x1="40"
                            x2="490"
                            y1="620"
                            y2="620"
                            stroke={c.textSecondary}
                            strokeWidth="2"
                        />
                        {[0, 100, 200, 300, 400, 500].map((v) => (
                            <line
                                key={v}
                                x1={x(v)}
                                x2={x(v)}
                                y1="614"
                                y2="627"
                                stroke={c.textSecondary}
                                strokeWidth="2"
                            />
                        ))}
                    </svg>
                ),
            }),
            label(c, 'Long prompts keep more KV state alive', 20, 20, 600, 29, c.textPrimary, 700),
            label(
                c,
                '32 full-history layers · head dimension 128',
                25,
                77,
                590,
                24,
                c.textSecondary,
            ),
            label(c, '2 bytes per value · one sequence', 25, 119, 590, 24, c.textSecondary),
            ...data.flatMap((d, i) => [
                label(c, d.label, 25, 201 + i * 105, 590, 26, c.textPrimary, 650, 'left'),
                label(
                    c,
                    d.v.toFixed(1),
                    505,
                    247 + i * 105,
                    110,
                    26,
                    tone(i === 3 ? 'warm' : 'purple'),
                    650,
                    'right',
                ),
            ]),
            ...[0, 100, 200, 300, 400, 500].map((v) =>
                label(c, String(v), x(v) - 30, 637, 60, 24, c.textSecondary),
            ),
            label(c, 'KV payload (GB) · zero-based scale', 25, 685, 590, 25, c.textSecondary),
            label(c, 'Weights and allocator overhead excluded', 25, 735, 590, 23, c.textMuted),
        ],
    })
}

export default create()
