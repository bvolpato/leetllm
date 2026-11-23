import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const preset = 'engineering'
export const opaqueBackground = true

export const alt =
    'Human review priority intake and queue partitioning architecture across three distinct SLA tiers: Restricted (15-minute SLA for prohibited material and legal reporting), Urgent (60-minute SLA for credible physical threats and viral exposure), and Standard (24-hour SLA for ordinary disputes and appeals). Work items are routed by severity and viewer velocity, with age-weighted boost preventing starvation.'

export const numericAnchors = {
    queues: 3,
    restrictedSlaMinutes: 15,
    urgentSlaMinutes: 60,
    standardSlaHours: 24,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const redTone = getReadableToneColor('red', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 12,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem
            x={x}
            y={y}
            width={w}
            height={Math.min(
                height - y,
                Math.ceil(
                    fontSize *
                        1.4 *
                        Math.max(1, Math.ceil((text.length * fontSize * 0.55) / Math.max(w, 1))),
                ),
            )}
        >
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={weight}
            />
        </CanvasItem>
    )

    const queues = [
        {
            title: '1. RESTRICTED QUEUE',
            badge: '< 15 MIN SLA',
            color: redTone,
            bgDark: '#281216',
            bgLight: '#fee2e2',
            trigger: 'Prohibited material & CSAM',
            routing: 'Dedicated specialized team',
            preemption: 'Strict preemptive priority',
        },
        {
            title: '2. URGENT QUEUE',
            badge: '< 60 MIN SLA',
            color: warmTone,
            bgDark: '#261a10',
            bgLight: '#fef3c7',
            trigger: 'Physical threats & viral spikes',
            routing: 'Senior safety operations',
            preemption: 'Velocity boost (> 10k views/h)',
        },
        {
            title: '3. STANDARD QUEUE',
            badge: '< 24 HOUR SLA',
            color: greenTone,
            bgDark: '#102216',
            bgLight: '#f0fdf4',
            trigger: 'Impersonation, spam, appeals',
            routing: 'General moderator pool',
            preemption: 'Age-weighted FIFO queue',
        },
    ]

    const cardWidth = 250
    const cardGap = 16
    const startX = 40
    const cardTop = 82
    const cardHeight = 246

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {queues.map((q, idx) => {
                        const x = startX + idx * (cardWidth + cardGap)
                        return (
                            <g key={idx}>
                                <rect
                                    x={x}
                                    y={cardTop}
                                    width={cardWidth}
                                    height={cardHeight}
                                    rx={8}
                                    fill={theme === 'dark' ? q.bgDark : q.bgLight}
                                    stroke={stroke}
                                    strokeWidth={1}
                                />
                                <rect
                                    x={x}
                                    y={cardTop}
                                    width={cardWidth}
                                    height={5}
                                    rx={2}
                                    fill={q.color}
                                />
                            </g>
                        )
                    })}

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={35}
                        y={344}
                        width={790}
                        height={124}
                        rx={8}
                        fill={theme === 'dark' ? '#111e2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                35,
                20,
                790,
                'Human Review Priority Intake & Queue Partitioning',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                35,
                48,
                790,
                'Triaging flagged items by harm severity, legal reporting deadlines, and viral exposure velocity',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* 3 Queue Cards */}
            {queues.map((q, idx) => {
                const x = startX + idx * (cardWidth + cardGap)
                return (
                    <React.Fragment key={idx}>
                        {label(
                            x + 14,
                            cardTop + 14,
                            cardWidth - 28,
                            q.title,
                            13,
                            c.textPrimary,
                            'left',
                            700,
                        )}
                        {label(
                            x + 14,
                            cardTop + 34,
                            cardWidth - 28,
                            q.badge,
                            10,
                            q.color,
                            'left',
                            700,
                        )}

                        {/* Trigger */}
                        {label(
                            x + 14,
                            cardTop + 66,
                            cardWidth - 28,
                            'ROUTING TRIGGER',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 14,
                            cardTop + 82,
                            cardWidth - 28,
                            q.trigger,
                            11,
                            q.color,
                            'left',
                            600,
                        )}

                        {/* Assignee */}
                        {label(
                            x + 14,
                            cardTop + 116,
                            cardWidth - 28,
                            'ASSIGNED REVIEW POOL',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 14,
                            cardTop + 132,
                            cardWidth - 28,
                            q.routing,
                            11,
                            c.textSecondary,
                            'left',
                            500,
                        )}

                        {/* Priority / Preemption Rule */}
                        {label(
                            x + 14,
                            cardTop + 168,
                            cardWidth - 28,
                            'SCHEDULING DISCIPLINE',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        <CanvasItem x={x + 14} y={cardTop + 184} width={cardWidth - 28} height={42}>
                            <div
                                style={{
                                    fontSize: '10px',
                                    color: c.textSecondary,
                                    lineHeight: '1.3',
                                }}
                            >
                                {q.preemption}
                            </div>
                        </CanvasItem>
                    </React.Fragment>
                )
            })}

            {/* Bottom Invariant Panel */}
            {label(
                52,
                356,
                756,
                'Queue Intake Sizing & Operator Safety Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                380,
                756,
                '1. Escalate viral ambiguous posts (10k views/min). · 2. Never demote regulatory flags. · 3. Dual-audit 5% sample (Kappa >= 0.85).',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
