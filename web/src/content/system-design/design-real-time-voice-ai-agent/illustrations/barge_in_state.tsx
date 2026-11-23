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
    'The client confirms playout only through 520 ms. Barge-in arrives at 650 ms, while generated output extends to 1120 ms. History retains the confirmed span "Incident is open", and discards the unconfirmed remainder "because the database failover is still running."'

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

    const x = (ms: number) => 60 + (ms / 1120) * 740

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
                        {/* Upper Timeline Panel */}
                        <rect
                            x="24"
                            y="54"
                            width="812"
                            height="190"
                            rx="12"
                            fill={c.bgCard}
                            stroke={c.border}
                            strokeWidth="1.5"
                        />

                        {/* Confirmed Audio Bar */}
                        <rect
                            x={x(0)}
                            y="130"
                            width={x(520) - x(0)}
                            height="50"
                            rx="6"
                            fill={fill('green')}
                            stroke={tone('green')}
                            strokeWidth="2"
                        />

                        {/* Unconfirmed Discarded Audio Bar */}
                        <rect
                            x={x(520)}
                            y="130"
                            width={x(1120) - x(520)}
                            height="50"
                            rx="6"
                            fill={fill('critical')}
                            stroke={tone('critical')}
                            strokeWidth="2"
                        />

                        {/* Client ACK Marker at 520 ms */}
                        <line
                            x1={x(520)}
                            x2={x(520)}
                            y1="80"
                            y2="205"
                            stroke={tone('green')}
                            strokeWidth="2"
                            strokeDasharray="4 4"
                        />

                        {/* User Speech Marker at 650 ms */}
                        <line
                            x1={x(650)}
                            x2={x(650)}
                            y1="95"
                            y2="205"
                            stroke={tone('warm')}
                            strokeWidth="2"
                            strokeDasharray="4 4"
                        />

                        {/* Axis base line */}
                        <line
                            x1={x(0)}
                            x2={x(1120)}
                            y1="205"
                            y2="205"
                            stroke={c.textMuted}
                            strokeWidth="1.5"
                        />

                        {/* Left Card: Retained in History */}
                        <rect
                            x="24"
                            y="260"
                            width="396"
                            height="216"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />

                        {/* Right Card: Discarded Audio */}
                        <rect
                            x="440"
                            y="260"
                            width="396"
                            height="216"
                            rx="12"
                            fill={c.bgCard}
                            stroke={tone('critical')}
                            strokeWidth="1.5"
                            strokeOpacity={0.6}
                        />
                    </svg>
                ),
            }),
            label(
                c,
                'History follows confirmed playout',
                24,
                14,
                812,
                24,
                c.textPrimary,
                700,
                'left',
            ),

            // Timeline badges
            label(c, 'Playout ACK: 520 ms', x(520) - 90, 64, 180, 16, tone('green'), 700),
            label(c, 'Speech onset: 650 ms', x(650) - 20, 78, 170, 15, tone('warm'), 650),

            label(
                c,
                'Confirmed heard audio (0–520 ms)',
                x(0) + 12,
                144,
                320,
                16,
                tone('green'),
                700,
                'left',
            ),
            label(
                c,
                'Unconfirmed audio (520–1120 ms)',
                x(520) + 12,
                144,
                360,
                16,
                tone('critical'),
                700,
                'left',
            ),

            // Time axis marks
            label(c, '0 ms', x(0) - 20, 214, 60, 14, c.textSecondary, 500, 'left'),
            label(c, '520 ms', x(520) - 30, 214, 60, 14, tone('green'), 600),
            label(c, '650 ms', x(650) - 20, 214, 60, 14, tone('warm'), 600),
            label(c, '1120 ms', x(1120) - 40, 214, 60, 14, c.textSecondary, 500, 'right'),

            // Left Card (Keep in history)
            label(
                c,
                'Retained in conversation history',
                44,
                276,
                356,
                18,
                tone('green'),
                700,
                'left',
            ),
            label(c, '“Incident is open”', 44, 310, 356, 20, c.textPrimary, 600, 'left'),
            label(
                c,
                '• Client acknowledged audio playout before interrupt',
                44,
                348,
                356,
                15,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Confirmed span commits to conversation context',
                44,
                376,
                356,
                15,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Next LLM turn knows the user heard this statement',
                44,
                404,
                356,
                15,
                c.textMuted,
                500,
                'left',
            ),

            // Right Card (Discard from history)
            label(
                c,
                'Discarded from conversation history',
                460,
                276,
                356,
                18,
                tone('critical'),
                700,
                'left',
            ),
            label(
                c,
                '“...because the database failover is still running.”',
                460,
                310,
                356,
                17,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Generated by LLM/TTS but stopped prior to playback',
                460,
                348,
                356,
                15,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Audio sink discarded; speech buffer purged',
                460,
                376,
                356,
                15,
                c.textSecondary,
                500,
                'left',
            ),
            label(
                c,
                '• Prevents the LLM from hallucinating user awareness',
                460,
                404,
                356,
                15,
                c.textMuted,
                500,
                'left',
            ),
        ],
    })
}

export default create()
