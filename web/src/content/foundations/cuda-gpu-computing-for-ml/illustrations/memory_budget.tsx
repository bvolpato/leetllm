import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getThemeColors,
    getReadableToneColor,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 800
export const height = 516
export const alt =
    'Three horizontal bars of gigabytes for a 7 billion parameter model, against a vertical line at a 24 GB GPU. Serving at FP16 needs 14 GB of weights and fits, with room for per-request memory. Training with Adam at FP16 needs 14 GB of weights, 14 GB of gradients, and 28 GB of optimizer averages, 56 GB before activations. Training with Adam and FP32 weights doubles each part to 112 GB before activations.'

const label = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    size = 24,
    color = c.textPrimary,
    weight = 500,
    align: 'left' | 'center' | 'right' = 'center',
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: size + 12,
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

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const rows = [
        { name: 'Serve · FP16 weights', parts: [14], sum: 14 },
        { name: 'Train · all FP16', parts: [14, 14, 28], sum: 56 },
        { name: 'Train · FP32 weights', parts: [28, 28, 56], sum: 112 },
    ]
    const x = (gb: number) => 28 + (gb / 130) * 744
    const rowY = (i: number) => 148 + i * 88
    const tones = ['blue', 'purple', 'warm'] as const

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
                        <rect x="28" y="96" width="18" height="18" rx="3" fill={tone('blue')} />
                        <rect x="220" y="96" width="18" height="18" rx="3" fill={tone('purple')} />
                        <rect x="440" y="96" width="18" height="18" rx="3" fill={tone('warm')} />
                        {rows.flatMap((r, i) => {
                            let used = 0
                            return r.parts.map((gb, j) => {
                                const left = x(used)
                                used += gb
                                return (
                                    <rect
                                        key={`${i}-${j}`}
                                        x={left}
                                        y={rowY(i) + 34}
                                        width={x(gb) - 28}
                                        height="34"
                                        fill={tone(tones[j]!)}
                                        stroke={c.bg}
                                        strokeWidth="2"
                                    />
                                )
                            })
                        })}
                        {rows.map((_, i) => (
                            <line
                                key={i}
                                x1={x(24)}
                                x2={x(24)}
                                y1={rowY(i) + 26}
                                y2={rowY(i) + 76}
                                stroke={tone('critical')}
                                strokeWidth="2.5"
                                strokeDasharray="5 4"
                            />
                        ))}
                        <line
                            x1="28"
                            x2="772"
                            y1="414"
                            y2="414"
                            stroke={c.textSecondary}
                            strokeWidth="2"
                        />
                    </svg>
                ),
            }),
            label(
                c,
                'Training state outweighs serving weights',
                28,
                14,
                744,
                29,
                c.textPrimary,
                700,
                'left',
            ),
            label(
                c,
                '7B parameters · 24 GB GPU limit (add activations during training)',
                28,
                52,
                744,
                24,
                c.textSecondary,
                500,
                'left',
            ),
            label(c, 'Weights', 54, 90, 140, 24, tone('blue'), 650, 'left'),
            label(c, 'Gradients', 246, 90, 160, 24, tone('purple'), 650, 'left'),
            label(c, 'Adam averages', 466, 90, 260, 24, tone('warm'), 650, 'left'),
            ...rows.flatMap((r, i) => [
                label(c, r.name, 28, rowY(i), 380, 25, c.textPrimary, 650, 'left'),
                label(
                    c,
                    i === 0 ? '14 GB weights' : `${r.parts.join(' + ')} = ${r.sum} GB`,
                    380,
                    rowY(i),
                    392,
                    24,
                    i === 0 ? tone('green') : tone('critical'),
                    650,
                    'right',
                ),
            ]),
            ...[0, 25, 50, 75, 100, 125].map((v) =>
                label(c, String(v), x(v) - 30, 424, 60, 24, c.textSecondary),
            ),
            label(
                c,
                'Base state before activations (GB) · red dashed line = 24 GB',
                28,
                468,
                744,
                24,
                c.textSecondary,
            ),
        ],
    })
}

export default create()
