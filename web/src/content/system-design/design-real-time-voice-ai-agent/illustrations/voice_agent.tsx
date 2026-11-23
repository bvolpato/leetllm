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
    'The voice hot path runs microphone, media edge, turn detection and STT, LLM and tools, then TTS and playout across a streaming pipeline. A separate local-VAD lane mutes and cancels speech with a p95 target under 100 ms. A confirmed-playout ledger records client acknowledgments so only heard audio enters the conversation history.'

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

    const stages = [
        { title: 'Microphone', detail: 'AEC + frames', tone: 'warm' as const },
        { title: 'Media edge', detail: 'live packets', tone: 'cyan' as const },
        { title: 'Turn + STT', detail: 'stable words', tone: 'purple' as const },
        { title: 'LLM + tools', detail: 'first clause', tone: 'blue' as const },
        { title: 'Speak', detail: 'TTS + playout', tone: 'green' as const },
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
                        {/* Background panel for hot path */}
                        <rect
                            x="24"
                            y="52"
                            width="812"
                            height="156"
                            rx="12"
                            fill={c.bgCard}
                            stroke={c.border}
                            strokeWidth="1.5"
                        />

                        {/* 5 Streaming stages */}
                        {stages.map((s, i) => {
                            const x = 36 + i * 160
                            return (
                                <g key={s.title}>
                                    <rect
                                        x={x}
                                        y={86}
                                        width="134"
                                        height="86"
                                        rx="8"
                                        fill={fill(s.tone)}
                                        stroke={tone(s.tone)}
                                        strokeWidth="2"
                                    />
                                    {i < 4 && (
                                        <VectorArrow
                                            x1={x + 134}
                                            y1={129}
                                            x2={x + 160}
                                            y2={129}
                                            color={c.textMuted}
                                            strokeWidth={2}
                                            arrowSize={4}
                                        />
                                    )}
                                </g>
                            )
                        })}

                        {/* Barge-in box */}
                        <rect
                            x="24"
                            y="230"
                            width="396"
                            height="240"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('critical')}
                            strokeWidth="1.5"
                            strokeOpacity={0.5}
                        />
                        <rect
                            x="42"
                            y="310"
                            width="160"
                            height="96"
                            rx="8"
                            fill={fill('warm')}
                            stroke={tone('warm')}
                            strokeWidth="2"
                        />
                        <VectorArrow
                            x1={202}
                            y1={358}
                            x2={238}
                            y2={358}
                            color={tone('critical')}
                            strokeWidth={2}
                            arrowSize={5}
                        />
                        <rect
                            x="238"
                            y="310"
                            width="164"
                            height="96"
                            rx="8"
                            fill={fill('critical')}
                            stroke={tone('critical')}
                            strokeWidth="2"
                        />

                        {/* Confirmed playout ledger box */}
                        <rect
                            x="440"
                            y="230"
                            width="396"
                            height="240"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('purple')}
                            strokeWidth="1.5"
                            strokeOpacity={0.5}
                        />
                        {[
                            { x: 456, w: 106, title: 'Playout ACK', sub: 'cursor' },
                            { x: 580, w: 114, title: 'Heard ledger', sub: 'spans' },
                            { x: 712, w: 108, title: 'Next turn', sub: 'safe context' },
                        ].map((b, i) => (
                            <g key={b.title}>
                                <rect
                                    x={b.x}
                                    y={310}
                                    width={b.w}
                                    height="96"
                                    rx="8"
                                    fill={fill('purple')}
                                    stroke={tone('purple')}
                                    strokeWidth="2"
                                />
                                {i < 2 && (
                                    <VectorArrow
                                        x1={b.x + b.w}
                                        y1={358}
                                        x2={b.x + b.w + 18}
                                        y2={358}
                                        color={tone('purple')}
                                        strokeWidth={2}
                                        arrowSize={4}
                                    />
                                )}
                            </g>
                        ))}
                    </svg>
                ),
            }),
            label(
                c,
                'Speech and control run beside each other',
                24,
                14,
                812,
                24,
                c.textPrimary,
                700,
                'left',
            ),

            // Hot path labels
            label(
                c,
                'Hot path: streaming speech pipeline',
                40,
                58,
                400,
                18,
                tone('blue'),
                650,
                'left',
            ),
            ...stages.flatMap((s, i) => [
                label(c, s.title, 40 + i * 160, 98, 126, 20, tone(s.tone), 650),
                label(c, s.detail, 40 + i * 160, 134, 126, 17, c.textSecondary),
            ]),

            // Barge-in labels
            label(c, 'Barge-in cancellation', 40, 242, 220, 20, tone('critical'), 700, 'left'),
            label(c, 'p95 mute target <100 ms', 220, 244, 184, 17, c.textSecondary, 500, 'right'),
            label(c, 'Speech onset', 46, 326, 152, 20, tone('warm'), 650),
            label(c, 'local VAD', 46, 360, 152, 17, c.textSecondary),
            label(c, 'Mute + cancel', 242, 326, 156, 20, tone('critical'), 650),
            label(c, 'stop queued TTS', 242, 360, 156, 17, c.textSecondary),
            label(
                c,
                'Immediate local cutoff stops acoustic echo and user overlap',
                42,
                426,
                360,
                16,
                c.textMuted,
                500,
                'left',
            ),

            // Confirmed playout labels
            label(c, 'Confirmed playout ledger', 456, 242, 220, 20, tone('purple'), 700, 'left'),
            label(c, 'client synchronization', 676, 244, 144, 17, c.textSecondary, 500, 'right'),
            label(c, 'Playout ACK', 458, 326, 102, 18, tone('purple'), 650),
            label(c, 'client cursor', 458, 360, 102, 16, c.textSecondary),
            label(c, 'Heard ledger', 582, 326, 110, 18, tone('purple'), 650),
            label(c, 'confirmed spans', 582, 360, 110, 16, c.textSecondary),
            label(c, 'Next turn', 714, 326, 104, 18, tone('purple'), 650),
            label(c, 'safe context', 714, 360, 104, 16, c.textSecondary),
            label(
                c,
                'Only client-acknowledged words commit to conversation memory',
                456,
                426,
                364,
                16,
                c.textMuted,
                500,
                'left',
            ),
        ],
    })
}

export default create()
