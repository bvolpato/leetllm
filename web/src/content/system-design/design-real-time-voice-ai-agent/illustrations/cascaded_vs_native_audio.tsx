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
    'Cascaded audio passes through STT, LLM, and TTS, allowing inline transcript inspection and independent component tuning. A native speech model emits audio directly with lower latency, handling transcripts and tool authorization via side channels. Both architectures require local VAD, barge-in cancellation, and a confirmed playout cursor.'

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

    const cascadedStages = [
        { title: 'Audio', tone: 'warm' as const },
        { title: 'STT', tone: 'purple' as const },
        { title: 'LLM', tone: 'blue' as const },
        { title: 'TTS', tone: 'green' as const },
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
                        {/* Cascaded panel */}
                        <rect
                            x="24"
                            y="54"
                            width="396"
                            height="346"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('blue')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />
                        {cascadedStages.map((s, i) => {
                            const x = 44 + i * 90
                            return (
                                <g key={s.title}>
                                    <rect
                                        x={x}
                                        y="110"
                                        width="72"
                                        height="50"
                                        rx="7"
                                        fill={fill(s.tone)}
                                        stroke={tone(s.tone)}
                                        strokeWidth="1.5"
                                    />
                                    {i < 3 && (
                                        <VectorArrow
                                            x1={x + 72}
                                            y1={135}
                                            x2={x + 90}
                                            y2={135}
                                            color={c.textMuted}
                                            strokeWidth={2}
                                            arrowSize={3}
                                        />
                                    )}
                                </g>
                            )
                        })}

                        {/* Native panel */}
                        <rect
                            x="440"
                            y="54"
                            width="396"
                            height="346"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />
                        <rect
                            x="460"
                            y="110"
                            width="80"
                            height="50"
                            rx="7"
                            fill={fill('warm')}
                            stroke={tone('warm')}
                            strokeWidth="1.5"
                        />
                        <VectorArrow
                            x1={540}
                            y1={135}
                            x2={565}
                            y2={135}
                            color={c.textMuted}
                            strokeWidth={2}
                            arrowSize={3}
                        />
                        <rect
                            x="565"
                            y="110"
                            width="146"
                            height="50"
                            rx="7"
                            fill={fill('green')}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                        />
                        <VectorArrow
                            x1={711}
                            y1={135}
                            x2={736}
                            y2={135}
                            color={c.textMuted}
                            strokeWidth={2}
                            arrowSize={3}
                        />
                        <rect
                            x="736"
                            y="110"
                            width="80"
                            height="50"
                            rx="7"
                            fill={fill('cyan')}
                            stroke={tone('cyan')}
                            strokeWidth="1.5"
                        />

                        {/* Side channels branch */}
                        <VectorArrow
                            x1={638}
                            y1={160}
                            x2={638}
                            y2={196}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <rect
                            x="480"
                            y="196"
                            width="316"
                            height="44"
                            rx="6"
                            fill={fill('purple')}
                            stroke={tone('purple')}
                            strokeWidth="1.5"
                        />

                        {/* Universal requirements bottom bar */}
                        <rect
                            x="24"
                            y="416"
                            width="812"
                            height="66"
                            rx="10"
                            fill={c.bgCard}
                            stroke={c.border}
                            strokeWidth="1.5"
                        />
                    </svg>
                ),
            }),
            label(
                c,
                'Place checkpoints on each audio path',
                24,
                14,
                812,
                24,
                c.textPrimary,
                700,
                'left',
            ),

            // Cascaded labels
            label(
                c,
                'Cascaded · inline text checkpoints',
                44,
                68,
                356,
                19,
                tone('blue'),
                700,
                'left',
            ),
            ...cascadedStages.map((s, i) =>
                label(c, s.title, 44 + i * 90, 124, 72, 18, tone(s.tone), 650),
            ),
            label(
                c,
                '• Inspect transcript → authorize tools → speak',
                44,
                184,
                356,
                17,
                c.textPrimary,
                500,
                'left',
            ),
            label(
                c,
                '• Swap STT, LLM, and TTS independently',
                44,
                218,
                356,
                17,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Modularity supports strict content safety gates',
                44,
                252,
                356,
                17,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Latency: sum of stage TTFTs (~380–550 ms)',
                44,
                286,
                356,
                17,
                c.textMuted,
                500,
                'left',
            ),

            // Native labels
            label(
                c,
                'Native audio · direct speech model',
                460,
                68,
                356,
                19,
                tone('green'),
                700,
                'left',
            ),
            label(c, 'Audio in', 460, 124, 80, 18, tone('warm'), 650),
            label(c, 'Speech model', 565, 124, 146, 18, tone('green'), 650),
            label(c, 'Audio out', 736, 124, 80, 18, tone('cyan'), 650),
            label(
                c,
                'Side channels: transcript · tool calls · traces',
                484,
                208,
                308,
                16,
                tone('purple'),
                600,
            ),
            label(
                c,
                '• Retains human vocal nuance, prosody, and emotion',
                460,
                260,
                356,
                17,
                c.textPrimary,
                500,
                'left',
            ),
            label(
                c,
                '• Lower mouth-to-ear latency floor (~200–350 ms)',
                460,
                294,
                356,
                17,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Safety and tool calls evaluate asynchronously',
                460,
                328,
                356,
                17,
                c.textMuted,
                500,
                'left',
            ),

            // Bottom bar labels
            label(c, 'Both architectures require:', 42, 436, 210, 18, tone('warm'), 700, 'left'),
            label(
                c,
                '• Local client VAD for instant mute (<100 ms)',
                256,
                428,
                320,
                16,
                c.textPrimary,
                500,
                'left',
            ),
            label(
                c,
                '• Confirmed playout cursor for memory integrity',
                256,
                452,
                320,
                16,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Real-time jitter buffer & packet loss concealment',
                580,
                438,
                240,
                16,
                c.textSecondary,
                500,
                'left',
            ),
        ],
    })
}

export default create()
