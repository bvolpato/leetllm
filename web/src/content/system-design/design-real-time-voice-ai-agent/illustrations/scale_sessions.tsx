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
    'Voice session packets hash to one sticky media worker that owns DTLS and media state. Its audio, turn, and text requests fan out to independently scalable STT, LLM, and TTS pools.'

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

    const pools = [
        {
            y: 64,
            name: 'STT worker pool',
            detail: 'Audio chunks → text tokens',
            metric: 'Scales on speech audio load',
            color: 'cyan' as const,
        },
        {
            y: 180,
            name: 'LLM inference pool',
            detail: 'Continuous batching / vLLM',
            metric: 'Scales on active token generation',
            color: 'blue' as const,
        },
        {
            y: 296,
            name: 'TTS synthesis pool',
            detail: 'Streaming speech waveform',
            metric: 'Scales on playout clause queue',
            color: 'green' as const,
        },
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
                        {/* Step 1: Caller packets */}
                        <rect
                            x="24"
                            y="120"
                            width="156"
                            height="210"
                            rx="10"
                            fill={fill('warm')}
                            stroke={tone('warm')}
                            strokeWidth="2"
                        />
                        <VectorArrow
                            x1={180}
                            y1={225}
                            x2={218}
                            y2={225}
                            color={tone('warm')}
                            strokeWidth={2}
                            arrowSize={5}
                        />

                        {/* Step 2: Sticky Media Gateway */}
                        <rect
                            x="218"
                            y="90"
                            width="234"
                            height="270"
                            rx="12"
                            fill={fill('purple')}
                            stroke={tone('purple')}
                            strokeWidth="2"
                        />

                        {/* Fan out branch lines */}
                        <path
                            d="M 452 165 H 480 V 110 H 500"
                            fill="none"
                            stroke={tone('cyan')}
                            strokeWidth="2"
                        />
                        <VectorArrow
                            x1={494}
                            y1={110}
                            x2={508}
                            y2={110}
                            color={tone('cyan')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        <path
                            d="M 452 225 H 508"
                            fill="none"
                            stroke={tone('blue')}
                            strokeWidth="2"
                        />
                        <VectorArrow
                            x1={494}
                            y1={225}
                            x2={508}
                            y2={225}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        <path
                            d="M 452 285 H 480 V 342 H 500"
                            fill="none"
                            stroke={tone('green')}
                            strokeWidth="2"
                        />
                        <VectorArrow
                            x1={494}
                            y1={342}
                            x2={508}
                            y2={342}
                            color={tone('green')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Step 3: Independent pools */}
                        {pools.map((p) => (
                            <rect
                                key={p.name}
                                x="508"
                                y={p.y}
                                width="328"
                                height="98"
                                rx="10"
                                fill={fill(p.color)}
                                stroke={tone(p.color)}
                                strokeWidth="2"
                            />
                        ))}

                        {/* Bottom summary bar */}
                        <rect
                            x="24"
                            y="414"
                            width="812"
                            height="64"
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
                'Pin media state, scale inference pools',
                24,
                14,
                812,
                24,
                c.textPrimary,
                700,
                'left',
            ),

            // Caller Packets
            label(c, 'Caller session', 32, 140, 140, 18, tone('warm'), 700),
            label(c, 'Consistent session hash', 32, 172, 140, 14, c.textPrimary),
            label(c, 'DTLS / SRTP packets', 32, 198, 140, 14, c.textSecondary),
            label(c, '20 ms audio frames', 32, 224, 140, 14, c.textMuted),
            label(c, 'Routed by 5-tuple', 32, 250, 140, 14, c.textMuted),

            // Sticky Media Gateway
            label(c, 'media-worker-04', 230, 108, 210, 19, tone('purple'), 700),
            label(c, 'Sticky stateful media worker', 230, 136, 210, 15, c.textSecondary),
            label(c, '• Terminates DTLS encryption', 230, 170, 210, 14, c.textPrimary, 500, 'left'),
            label(
                c,
                '• Adaptive jitter buffer & PLC',
                230,
                198,
                210,
                14,
                c.textPrimary,
                500,
                'left',
            ),
            label(c, '• Playout ACK cursor ledger', 230, 226, 210, 14, c.textPrimary, 500, 'left'),
            label(c, '• Session cancellation bus', 230, 254, 210, 14, c.textPrimary, 500, 'left'),
            label(c, '• WebRTC ICE keep-alive', 230, 282, 210, 14, c.textSecondary, 500, 'left'),

            // Pools
            ...pools.flatMap((p) => [
                label(c, p.name, 524, p.y + 12, 296, 18, tone(p.color), 700, 'left'),
                label(c, p.detail, 524, p.y + 40, 296, 15, c.textPrimary, 500, 'left'),
                label(c, p.metric, 524, p.y + 66, 296, 14, c.textSecondary, 500, 'left'),
            ]),

            // Bottom bar
            label(c, 'Scaling principle:', 40, 428, 150, 16, tone('blue'), 700, 'left'),
            label(
                c,
                'Media gateways pin stateful WebRTC sessions, while STT, LLM, and TTS workers autoscale stateless micro-batches.',
                196,
                424,
                620,
                15,
                c.textSecondary,
                500,
                'left',
            ),
        ],
    })
}

export default create()
