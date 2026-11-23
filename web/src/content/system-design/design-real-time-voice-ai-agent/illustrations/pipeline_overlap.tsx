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

export const width = 860
export const height = 500
export const alt =
    'The same voice pipeline tasks compared on a 0–550 ms timeline. Serial execution spans 0–60, 60–160, 160–340, 340–475, and 475–510 ms, completing at 510 ms. Overlapped streaming spans 0–60, 0–100, 60–240, 210–345, and 345–380 ms, completing at 380 ms and saving 130 ms.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    size = 20,
    color = c.textPrimary,
    weight = 500,
    align: 'left' | 'center' | 'right' = 'center',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * 1.5,
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

    const x = (t: number) => 220 + (t / 550) * 580
    const colors = ['warm', 'blue', 'purple', 'green', 'cyan'] as const

    const serialSpans = [
        [0, 60],
        [60, 160],
        [160, 340],
        [340, 475],
        [475, 510],
    ]

    const overlappedSpans = [
        [0, 60],
        [0, 100],
        [60, 240],
        [210, 345],
        [345, 380],
    ]

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
                        {/* Serial Box */}
                        <rect
                            x="24"
                            y="54"
                            width="812"
                            height="150"
                            rx="10"
                            fill={c.bgCard}
                            stroke={tone('warm')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />

                        {/* Overlapped Box */}
                        <rect
                            x="24"
                            y="218"
                            width="812"
                            height="160"
                            rx="10"
                            fill={c.bgCard}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />

                        {/* Timeline grid lines */}
                        {[0, 100, 200, 300, 400, 500].map((t) => (
                            <line
                                key={t}
                                x1={x(t)}
                                x2={x(t)}
                                y1="64"
                                y2="390"
                                stroke={c.border}
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                        ))}

                        {/* Serial bars */}
                        {serialSpans.map(([a, b], i) => (
                            <rect
                                key={`s-${i}`}
                                x={x(a)}
                                y={88 + i * 20}
                                width={Math.max(4, x(b) - x(a))}
                                height="16"
                                rx="3"
                                fill={fill(colors[i])}
                                stroke={tone(colors[i])}
                                strokeWidth="1.5"
                            />
                        ))}
                        <line
                            x1={x(510)}
                            x2={x(510)}
                            y1="80"
                            y2="195"
                            stroke={tone('warm')}
                            strokeWidth="2"
                            strokeDasharray="4 3"
                        />

                        {/* Overlapped bars */}
                        {overlappedSpans.map(([a, b], i) => (
                            <rect
                                key={`o-${i}`}
                                x={x(a)}
                                y={252 + i * 22}
                                width={Math.max(4, x(b) - x(a))}
                                height="18"
                                rx="3"
                                fill={fill(colors[i])}
                                stroke={tone(colors[i])}
                                strokeWidth="1.5"
                            />
                        ))}
                        <line
                            x1={x(380)}
                            x2={x(380)}
                            y1="240"
                            y2="370"
                            stroke={tone('green')}
                            strokeWidth="2"
                            strokeDasharray="4 3"
                        />

                        {/* Base timeline line */}
                        <line
                            x1={x(0)}
                            x2={x(550)}
                            y1="392"
                            y2="392"
                            stroke={c.textMuted}
                            strokeWidth="1.5"
                        />

                        {/* Bottom takeaway banner */}
                        <rect
                            x="24"
                            y="426"
                            width="812"
                            height="54"
                            rx="8"
                            fill={c.bgCard}
                            stroke={c.border}
                            strokeWidth="1.5"
                        />
                    </svg>
                ),
            }),
            label(
                c,
                'Pipeline overlap cuts latency by 130 ms',
                24,
                14,
                812,
                24,
                c.textPrimary,
                700,
                'left',
            ),

            // Serial labels
            label(c, 'Serial execution', 40, 68, 170, 18, tone('warm'), 700, 'left'),
            label(c, 'Turn → STT → LLM → TTS', 40, 94, 170, 14, c.textSecondary, 500, 'left'),
            label(c, 'Sequential wait', 40, 116, 170, 14, c.textMuted, 500, 'left'),
            label(c, 'Finish: 510 ms', x(510) - 100, 68, 100, 15, tone('warm'), 700, 'right'),

            // Overlapped labels
            label(c, 'Overlapped streaming', 40, 230, 170, 18, tone('green'), 700, 'left'),
            label(
                c,
                'Early STT + first-clause TTS',
                40,
                256,
                170,
                14,
                c.textSecondary,
                500,
                'left',
            ),
            label(c, 'Concurrent execution', 40, 278, 170, 14, c.textMuted, 500, 'left'),
            label(
                c,
                'Finish: 380 ms (–130 ms)',
                x(380) - 160,
                230,
                160,
                16,
                tone('green'),
                700,
                'right',
            ),

            // Timeline ticks
            ...[0, 100, 200, 300, 400, 500].map((t) =>
                label(c, `${t} ms`, x(t) - 30, 400, 60, 14, c.textSecondary),
            ),

            // Bottom banner text
            label(c, 'Key optimization:', 42, 442, 140, 16, tone('purple'), 700, 'left'),
            label(
                c,
                'STT streams during speech · First LLM clause triggers TTS immediately · Cuts total mouth-to-ear latency by 25%',
                186,
                442,
                630,
                15,
                c.textSecondary,
                500,
                'left',
            ),
        ],
    })
}

export default create()
