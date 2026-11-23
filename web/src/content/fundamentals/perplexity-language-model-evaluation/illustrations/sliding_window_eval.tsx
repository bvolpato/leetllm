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
export const height = 755
export const alt =
    'Three five-token windows over tokens A through J. The first reads A to E and scores B, C, D, and E. The second reads D to H and scores F, G, and H. The third reads F to J and scores I and J. Nine losses appear exactly once each, and A is never scored. They sum to 4.26 nats, the mean is 0.473, and perplexity is 1.61.'

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
    const tokens = [...'ABCDEFGHIJ']
    const windows = [
        { context: [0, 5], score: [1, 5], losses: [0.3, 0.72, 0.51, 0.43] },
        { context: [3, 8], score: [5, 8], losses: [0.27, 0.61, 0.38] },
        { context: [5, 10], score: [8, 10], losses: [0.56, 0.48] },
    ]
    const x = (i: number) => 110 + i * 50
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
                        {windows.flatMap((w, row) =>
                            Array.from({ length: w.context[1] - w.context[0] }, (_, k) => {
                                const i = k + w.context[0],
                                    scored = i >= w.score[0] && i < w.score[1]
                                return (
                                    <rect
                                        key={row + '-' + i}
                                        x={x(i)}
                                        y={205 + row * 120}
                                        width="46"
                                        height="75"
                                        rx="4"
                                        fill={scored ? fill('blue') : c.bgCard}
                                        stroke={scored ? tone('blue') : c.border}
                                        strokeWidth="2"
                                    />
                                )
                            }),
                        )}
                    </svg>
                ),
            }),
            label(c, 'Score each target once across windows', 20, 20, 600, 29, c.textPrimary, 700),
            label(c, 'Five-token context windows · loss in nats', 25, 78, 590, 24, c.textSecondary),
            ...tokens.map((t, i) => label(c, t, x(i), 146, 46, 26, c.textPrimary, 650)),
            ...windows.flatMap((w, row) => [
                label(
                    c,
                    `Win ${row + 1}`,
                    15,
                    225 + row * 120,
                    85,
                    24,
                    c.textSecondary,
                    650,
                    'left',
                ),
                ...w.losses.map((loss, k) =>
                    label(
                        c,
                        loss.toFixed(2).replace(/^0/, ''),
                        x(k + w.score[0]),
                        229 + row * 120,
                        46,
                        24,
                        tone('blue'),
                        650,
                    ),
                ),
            ]),
            label(c, 'Count', 15, 565, 85, 24, c.textSecondary, 650, 'left'),
            ...tokens.map((_, i) =>
                label(
                    c,
                    i === 0 ? '0' : '1',
                    x(i),
                    565,
                    46,
                    25,
                    i === 0 ? c.textMuted : c.textPrimary,
                    650,
                ),
            ),
            label(c, '4.26 nats / 9 targets = 0.473 nats', 25, 644, 590, 27, c.textPrimary, 650),
            label(c, 'PPL = exp(.473) = 1.61', 25, 704, 590, 28, tone('blue'), 650),
        ],
    })
}

export default create()
