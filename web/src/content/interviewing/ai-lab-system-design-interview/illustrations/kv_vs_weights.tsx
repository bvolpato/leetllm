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
export const height = 620
export const alt =
    'HBM bar chart on a 0 to 20 GB axis for a Llama 3 8B-shaped model at batch 16 and 2048 tokens. BF16 weights sit at 16.0 GB. Multi-head attention KV cache is 17.2 GB, taller than the weights. Grouped-query attention with 8 key/value heads cuts KV to 4.3 GB.'

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
        { label: 'Weights', value: 16, t: 'purple' as const },
        { label: 'KV · MHA', value: 17.2, t: 'critical' as const },
        { label: 'KV · GQA', value: 4.3, t: 'green' as const },
    ]
    const x = (gb: number) => 190 + (gb / 20) * 410
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
                        {[0, 5, 10, 15, 20].map((v) => (
                            <line
                                key={v}
                                x1={x(v)}
                                x2={x(v)}
                                y1="205"
                                y2="500"
                                stroke={c.border}
                                strokeWidth="1"
                            />
                        ))}
                        {data.map((d, i) => (
                            <rect
                                key={d.label}
                                x="190"
                                y={225 + i * 100}
                                width={x(d.value) - 190}
                                height="48"
                                rx="4"
                                fill={tone(d.t)}
                            />
                        ))}
                    </svg>
                ),
            }),
            label(c, 'KV cache can rival the weights', 20, 20, 600, 30, c.textPrimary, 700),
            label(c, 'Llama 3 8B shape · BF16 · B=16 · S=2048', 25, 78, 590, 24, c.textSecondary),
            label(
                c,
                '32 layers · head dimension 128 · GQA 8 KV heads',
                25,
                121,
                590,
                23,
                c.textSecondary,
            ),
            ...data.flatMap((d, i) => [
                label(c, d.label, 25, 233 + i * 100, 155, 26, c.textPrimary, 650, 'left'),
                label(
                    c,
                    d.value.toFixed(1),
                    x(d.value) - 85,
                    234 + i * 100,
                    75,
                    26,
                    c.bg,
                    700,
                    'right',
                ),
            ]),
            ...[0, 5, 10, 15, 20].map((v) =>
                label(c, String(v), x(v) - 30, 513, 60, 24, c.textSecondary),
            ),
            label(c, 'HBM payload (GB) · shared scale', 150, 566, 470, 25, c.textSecondary),
        ],
    })
}

export default create()
