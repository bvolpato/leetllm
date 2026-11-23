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
    'Audio splits into local voice activity detection, which mutes playback without waiting for network round-trips, and server endpointing, which commits a stable transcript boundary. A decision trace records speech onset and turn endpoint separately by device class.'

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
                        {/* Audio Source Card */}
                        <rect
                            x="24"
                            y="140"
                            width="160"
                            height="180"
                            rx="10"
                            fill={fill('warm')}
                            stroke={tone('warm')}
                            strokeWidth="2"
                        />

                        {/* Split Branch arrows from Audio Source */}
                        <path
                            d="M 184 190 H 210 V 125 H 230"
                            fill="none"
                            stroke={tone('blue')}
                            strokeWidth="2"
                        />
                        <VectorArrow
                            x1={224}
                            y1={125}
                            x2={238}
                            y2={125}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        <path
                            d="M 184 270 H 210 V 325 H 230"
                            fill="none"
                            stroke={tone('purple')}
                            strokeWidth="2"
                        />
                        <VectorArrow
                            x1={224}
                            y1={325}
                            x2={238}
                            y2={325}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Upper track: Client Local VAD Box */}
                        <rect
                            x="220"
                            y="54"
                            width="616"
                            height="150"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('critical')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />
                        <rect
                            x="238"
                            y="92"
                            width="168"
                            height="76"
                            rx="8"
                            fill={fill('blue')}
                            stroke={tone('blue')}
                            strokeWidth="1.5"
                        />
                        <VectorArrow
                            x1={406}
                            y1={130}
                            x2={438}
                            y2={130}
                            color={tone('critical')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <rect
                            x="438"
                            y="92"
                            width="174"
                            height="76"
                            rx="8"
                            fill={fill('critical')}
                            stroke={tone('critical')}
                            strokeWidth="1.5"
                        />
                        <VectorArrow
                            x1={612}
                            y1={130}
                            x2={644}
                            y2={130}
                            color={tone('critical')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <rect
                            x="644"
                            y="92"
                            width="174"
                            height="76"
                            rx="8"
                            fill={fill('critical')}
                            stroke={tone('critical')}
                            strokeWidth="1.5"
                        />

                        {/* Lower track: Server Endpointing Box */}
                        <rect
                            x="220"
                            y="226"
                            width="616"
                            height="160"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />
                        <rect
                            x="238"
                            y="272"
                            width="168"
                            height="76"
                            rx="8"
                            fill={fill('purple')}
                            stroke={tone('purple')}
                            strokeWidth="1.5"
                        />
                        <VectorArrow
                            x1={406}
                            y1={310}
                            x2={438}
                            y2={310}
                            color={tone('green')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <rect
                            x="438"
                            y="272"
                            width="174"
                            height="76"
                            rx="8"
                            fill={fill('green')}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                        />
                        <VectorArrow
                            x1={612}
                            y1={310}
                            x2={644}
                            y2={310}
                            color={tone('green')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <rect
                            x="644"
                            y="272"
                            width="174"
                            height="76"
                            rx="8"
                            fill={fill('cyan')}
                            stroke={tone('cyan')}
                            strokeWidth="1.5"
                        />

                        {/* Bottom takeaway banner */}
                        <rect
                            x="24"
                            y="410"
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
                'Dual-tier voice activity detection topology',
                24,
                14,
                812,
                24,
                c.textPrimary,
                700,
                'left',
            ),

            // Microphone card
            label(c, 'Microphone', 32, 160, 144, 20, tone('warm'), 700),
            label(c, 'Audio capture', 32, 194, 144, 15, c.textPrimary),
            label(c, 'AEC + framing', 32, 222, 144, 14, c.textSecondary),
            label(c, '20 ms Opus packets', 32, 250, 144, 14, c.textMuted),

            // Upper track (Local VAD)
            label(
                c,
                'Client track · Low-latency barge-in (instant mute)',
                238,
                64,
                400,
                17,
                tone('critical'),
                700,
                'left',
            ),
            label(c, 'Target: <100 ms', 690, 64, 130, 15, tone('critical'), 600, 'right'),

            label(c, 'Local VAD', 242, 104, 160, 17, tone('blue'), 700),
            label(c, 'on-device model', 242, 132, 160, 14, c.textSecondary),

            label(c, 'Instant mute', 442, 104, 166, 17, tone('critical'), 700),
            label(c, 'halt speaker audio', 442, 132, 166, 14, c.textSecondary),

            label(c, 'Server interrupt', 648, 104, 166, 17, tone('critical'), 700),
            label(c, 'abort in-flight TTS', 648, 132, 166, 14, c.textSecondary),

            // Lower track (Server Endpointing)
            label(
                c,
                'Server track · Turn detection and STT finalization',
                238,
                238,
                400,
                17,
                tone('green'),
                700,
                'left',
            ),
            label(c, 'Target: 400–800 ms', 690, 238, 130, 15, tone('green'), 600, 'right'),

            label(c, 'Streaming ASR', 242, 284, 160, 17, tone('purple'), 700),
            label(c, 'continuous decode', 242, 312, 160, 14, c.textSecondary),

            label(c, 'Turn endpointing', 442, 284, 166, 17, tone('green'), 700),
            label(c, 'semantic silence wait', 442, 312, 166, 14, c.textSecondary),

            label(c, 'LLM generation', 648, 284, 166, 17, tone('cyan'), 700),
            label(c, 'prompt first clause', 648, 312, 166, 14, c.textSecondary),

            // Bottom banner text
            label(c, 'Architectural benefit:', 40, 424, 170, 17, tone('warm'), 700, 'left'),
            label(
                c,
                'Decouples interrupt latency from network round-trips: the user experiences instant cutoff locally (<100 ms) while the server computes stable linguistic boundaries without premature cutoffs.',
                218,
                420,
                600,
                15,
                c.textSecondary,
                500,
                'left',
            ),
        ],
    })
}

export default create()
