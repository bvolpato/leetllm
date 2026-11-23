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
    'Four 20 ms audio packets illustrate one missing frame. WebRTC conceals the 60 ms gap with packet loss concealment (PLC) and plays the 80 ms packet on time. A TCP WebSocket incurs head-of-line blocking, withholding later segments D and E until missing segment C is retransmitted.'

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

    const webrtcPackets = [
        { time: '20 ms', status: 'play', tone: 'green' as const },
        { time: '40 ms', status: 'play', tone: 'green' as const },
        { time: '60 ms', status: 'lost', tone: 'critical' as const },
        { time: '80 ms', status: 'play', tone: 'green' as const },
    ]

    const tcpSegments = [
        { name: 'Seg A', status: 'delivered', tone: 'green' as const },
        { name: 'Seg B', status: 'delivered', tone: 'green' as const },
        { name: 'Seg C', status: 'missing', tone: 'critical' as const },
        { name: 'Seg D, E', status: 'blocked', tone: 'warm' as const },
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
                        {/* WebRTC Panel */}
                        <rect
                            x="24"
                            y="54"
                            width="396"
                            height="348"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('blue')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />

                        {/* WebSocket TCP Panel */}
                        <rect
                            x="440"
                            y="54"
                            width="396"
                            height="348"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('warm')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />

                        {/* WebRTC Packets */}
                        {webrtcPackets.map((p, i) => {
                            const x = 44 + i * 88
                            return (
                                <rect
                                    key={p.time}
                                    x={x}
                                    y={116}
                                    width="76"
                                    height="62"
                                    rx="8"
                                    fill={fill(p.tone)}
                                    stroke={tone(p.tone)}
                                    strokeWidth="1.5"
                                />
                            )
                        })}

                        {/* WebRTC PLC Bridge */}
                        <path
                            d="M 220 188 V 204 H 308 V 188"
                            fill="none"
                            stroke={tone('green')}
                            strokeWidth="2"
                        />

                        {/* TCP Segments */}
                        {tcpSegments.map((s, i) => {
                            const x = 460 + i * 88
                            return (
                                <rect
                                    key={s.name}
                                    x={x}
                                    y={116}
                                    width="76"
                                    height="62"
                                    rx="8"
                                    fill={fill(s.tone)}
                                    stroke={tone(s.tone)}
                                    strokeWidth="1.5"
                                />
                            )
                        })}

                        {/* TCP HoL Blocking bracket */}
                        <path
                            d="M 636 188 V 204 H 812 V 188"
                            fill="none"
                            stroke={tone('critical')}
                            strokeWidth="2"
                        />

                        {/* Bottom takeaway banner */}
                        <rect
                            x="24"
                            y="418"
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
                'One packet loss, two playout rules',
                24,
                14,
                812,
                24,
                c.textPrimary,
                700,
                'left',
            ),

            // WebRTC Column Labels
            label(
                c,
                'WebRTC (UDP / RTP) · Meet the deadline',
                44,
                68,
                356,
                18,
                tone('blue'),
                700,
                'left',
            ),
            label(
                c,
                'Timeliness prioritized over complete reliability',
                44,
                92,
                356,
                14,
                c.textSecondary,
                500,
                'left',
            ),

            ...webrtcPackets.flatMap((p, i) => [
                label(c, p.time, 44 + i * 88, 126, 76, 16, tone(p.tone), 700),
                label(c, p.status, 44 + i * 88, 150, 76, 14, c.textSecondary),
            ]),

            label(
                c,
                'PLC concealment: synthesizes 60 ms audio waveform',
                44,
                212,
                356,
                15,
                tone('green'),
                600,
            ),
            label(
                c,
                '• Never blocks later packets for missing frames',
                44,
                244,
                356,
                15,
                c.textPrimary,
                500,
                'left',
            ),
            label(
                c,
                '• Jitter buffer bounds delay: 80 ms packet plays on time',
                44,
                272,
                356,
                15,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Total mouth-to-ear latency preserved without spikes',
                44,
                300,
                356,
                15,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Imperceptible 20 ms pitch extrapolation artifact',
                44,
                328,
                356,
                15,
                c.textMuted,
                500,
                'left',
            ),

            // TCP Column Labels
            label(
                c,
                'WebSocket (TCP) · In-order byte delivery',
                460,
                68,
                356,
                18,
                tone('warm'),
                700,
                'left',
            ),
            label(
                c,
                'Lossless byte stream prioritized over latency',
                460,
                92,
                356,
                14,
                c.textSecondary,
                500,
                'left',
            ),

            ...tcpSegments.flatMap((s, i) => [
                label(c, s.name, 460 + i * 88, 126, 76, 16, tone(s.tone), 700),
                label(c, s.status, 460 + i * 88, 150, 76, 14, c.textSecondary),
            ]),

            label(
                c,
                'Head-of-Line blocking: socket holds D and E',
                460,
                212,
                356,
                15,
                tone('critical'),
                600,
            ),
            label(
                c,
                '• Kernel socket buffer holds D & E until C retransmits',
                460,
                244,
                356,
                15,
                c.textPrimary,
                500,
                'left',
            ),
            label(
                c,
                '• Application receives 0 frames during retransmission',
                460,
                272,
                356,
                15,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Glitch duration equals full RTT + timeout (200–800 ms)',
                460,
                300,
                356,
                15,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Causes speaker underrun followed by burst catch-up',
                460,
                328,
                356,
                15,
                c.textMuted,
                500,
                'left',
            ),

            // Bottom bar
            label(c, 'Architectural verdict:', 40, 432, 180, 16, tone('purple'), 700, 'left'),
            label(
                c,
                'Human conversation cannot tolerate TCP retransmission stalls. Real-time voice agents must use WebRTC / UDP with packet loss concealment (PLC) to enforce strict mouth-to-ear latency budgets.',
                220,
                428,
                596,
                15,
                c.textSecondary,
                500,
                'left',
            ),
        ],
    })
}

export default create()
