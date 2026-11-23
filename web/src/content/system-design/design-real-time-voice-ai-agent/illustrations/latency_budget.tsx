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
    'A synthetic voice schedule starts at acoustic speech end. Turn commit spans 0–60 ms, STT finalization 0–100 ms, the LLM clause 60–240 ms, the TTS chunk 210–345 ms, and playout 345–380 ms. First audio plays 380 ms from speech end and 320 ms from turn commit because STT streams concurrently during user speech.'

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

    const x = (t: number) => 210 + (t / 500) * 580
    const stages = ['Turn commit', 'STT tail', 'LLM clause', 'TTS chunk', 'Playout']
    const colors = ['warm', 'blue', 'purple', 'green', 'cyan'] as const
    const spans = [
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
                        {/* Background panel for Gantt chart */}
                        <rect
                            x="24"
                            y="60"
                            width="812"
                            height="330"
                            rx="12"
                            fill={c.bgCard}
                            stroke={c.border}
                            strokeWidth="1.5"
                        />

                        {/* Grid lines */}
                        {[0, 100, 200, 300, 400, 500].map((t) => (
                            <line
                                key={t}
                                x1={x(t)}
                                x2={x(t)}
                                y1="80"
                                y2="340"
                                stroke={c.border}
                                strokeWidth="1"
                                strokeDasharray={t === 0 ? undefined : '4 4'}
                            />
                        ))}

                        {/* Horizontal span bars */}
                        {spans.map(([a, b], i) => (
                            <g key={i}>
                                <rect
                                    x={x(a)}
                                    y={100 + i * 46}
                                    width={Math.max(4, x(b) - x(a))}
                                    height="28"
                                    rx="5"
                                    fill={fill(colors[i])}
                                    stroke={tone(colors[i])}
                                    strokeWidth="1.5"
                                />
                            </g>
                        ))}

                        {/* 380 ms dashed marker */}
                        <line
                            x1={x(380)}
                            x2={x(380)}
                            y1="80"
                            y2="345"
                            stroke={tone('green')}
                            strokeWidth="2"
                            strokeDasharray="5 4"
                        />

                        {/* Axis base line */}
                        <line
                            x1={x(0)}
                            x2={x(500)}
                            y1="340"
                            y2="340"
                            stroke={c.textMuted}
                            strokeWidth="1.5"
                        />

                        {/* Bottom summary cards */}
                        <rect
                            x="24"
                            y="410"
                            width="256"
                            height="66"
                            rx="8"
                            fill={c.bgCard}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                        />
                        <rect
                            x="302"
                            y="410"
                            width="256"
                            height="66"
                            rx="8"
                            fill={c.bgCard}
                            stroke={tone('blue')}
                            strokeWidth="1.5"
                        />
                        <rect
                            x="580"
                            y="410"
                            width="256"
                            height="66"
                            rx="8"
                            fill={c.bgCard}
                            stroke={tone('purple')}
                            strokeWidth="1.5"
                        />
                    </svg>
                ),
            }),
            label(
                c,
                'Overlap sets first audio at 380 ms',
                24,
                14,
                812,
                24,
                c.textPrimary,
                700,
                'left',
            ),
            label(
                c,
                'Synthetic schedule · STT streams during user speech',
                24,
                40,
                600,
                16,
                c.textSecondary,
                500,
                'left',
            ),

            // Stage labels on the left
            ...stages.map((s, i) =>
                label(c, s, 36, 104 + i * 46, 160, 18, c.textPrimary, 600, 'left'),
            ),

            // Span duration badges
            ...spans.map(([a, b], i) =>
                label(
                    c,
                    `${a}–${b} ms (${b - a} ms)`,
                    x(b) + 10,
                    106 + i * 46,
                    160,
                    15,
                    tone(colors[i]),
                    600,
                    'left',
                ),
            ),

            // Time axis ticks
            ...[0, 100, 200, 300, 400, 500].map((t) =>
                label(c, `${t} ms`, x(t) - 30, 350, 60, 15, c.textSecondary),
            ),
            label(c, 'Time after acoustic speech end', 210, 372, 580, 14, c.textMuted),

            // Bottom metric cards
            label(c, 'Speech end → First audio', 36, 420, 232, 15, c.textSecondary),
            label(c, '380 ms total latency', 36, 444, 232, 19, tone('green'), 700),

            label(c, 'Turn commit → First audio', 314, 420, 232, 15, c.textSecondary),
            label(c, '320 ms response delay', 314, 444, 232, 19, tone('blue'), 700),

            label(c, 'Streaming savings', 592, 420, 232, 15, c.textSecondary),
            label(c, '130 ms faster than serial', 592, 444, 232, 19, tone('purple'), 700),
        ],
    })
}

export default create()
