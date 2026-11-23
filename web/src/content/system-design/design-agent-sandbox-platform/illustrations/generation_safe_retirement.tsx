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
    'The local dictionary model takes A/generation 1 through RESTORED, READY, RUNNING, CANCEL_REQUESTED, RETIRED, and DISPOSED. Missing readiness observations keep it RESTORED and reject admission. Cancellation keeps its private page 1 value 99 and output.csv owned. A retirement notice for A/generation 2 fails identity. Authoritative retirement for A/generation 1 is a trusted model assertion. In the integration boundary, remaining references must also close before disposal and resource reuse. A lost reply or heartbeat keeps ownership uncertain for reconciliation, with no timeout-to-free edge. B/generation 1 continues reading base value 20 with empty scratch. This model does not probe real VMM retirement.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const stateTone = getReadableToneColor('blue', c, c.bg)
    const cancelTone = getReadableToneColor('warm', c, c.bg)
    const retiredTone = getReadableToneColor('purple', c, c.bg)
    const okTone = getReadableToneColor('green', c, c.bg)
    const alertTone = getReadableToneColor('critical', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
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

    const states = [
        { name: 'RESTORED', tone: stateTone },
        { name: 'READY', tone: stateTone },
        { name: 'RUNNING', tone: okTone },
        { name: 'CANCEL_REQ', tone: cancelTone },
        { name: 'RETIRED', tone: retiredTone },
        { name: 'DISPOSED', tone: stroke },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Top Lifecycle Ribbon */}
                    <rect
                        x={24}
                        y={60}
                        width={812}
                        height={110}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {states.map((s, i) => {
                        const sx = 36 + i * 133
                        return (
                            <g key={s.name}>
                                <rect
                                    x={sx}
                                    y={75}
                                    width={115}
                                    height={50}
                                    rx={6}
                                    fill={c.bgCardAlt}
                                    stroke={s.tone}
                                    strokeWidth={1.5}
                                />
                                {i < 5 && (
                                    <line
                                        x1={sx + 115}
                                        y1={100}
                                        x2={sx + 133}
                                        y2={100}
                                        stroke={stroke}
                                        strokeWidth={2}
                                    />
                                )}
                            </g>
                        )
                    })}

                    {/* Bottom Left: Identity & Resource Ownership */}
                    <rect
                        x={24}
                        y={185}
                        width={394}
                        height={290}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={230}
                        width={370}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={cancelTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={350}
                        width={370}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Right: Anti-Pattern vs Safe Protocol */}
                    <rect
                        x={442}
                        y={185}
                        width={394}
                        height={290}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={454}
                        y={230}
                        width={370}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={alertTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={454}
                        y={350}
                        width={370}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={okTone}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Generation-Safe Sandbox Retirement & Memory Recycling',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* State Names */}
            {states.map((s, i) => {
                const sx = 36 + i * 133
                return (
                    <React.Fragment key={s.name}>
                        {label(sx, 88, 115, s.name, 13, s.tone, 'center', 700)}
                    </React.Fragment>
                )
            })}
            {label(36, 138, 120, 'Checks pass', 12, c.textMuted, 'center')}
            {label(169, 138, 120, 'Task start()', 12, c.textMuted, 'center')}
            {label(302, 138, 120, 'Timeout / Cancel', 12, c.textMuted, 'center')}
            {label(435, 138, 120, 'Model confirmed', 12, c.textMuted, 'center')}
            {label(568, 138, 120, 'Handles closed', 12, c.textMuted, 'center')}
            {label(701, 138, 120, 'Memory freed', 12, c.textMuted, 'center')}

            {/* Bottom Left Panel */}
            {label(
                36,
                198,
                370,
                'Exact Generation Identity (A / Gen 1)',
                16,
                cancelTone,
                'left',
                700,
            )}
            {label(48, 240, 346, 'State Held at Cancel Request:', 15, c.textPrimary, 'left', 650)}
            {label(
                48,
                265,
                346,
                '• Private dirty page 1 (value 99) remains pinned',
                13,
                c.textMuted,
            )}
            {label(48, 288, 346, '• Scratch disk output.csv remains mounted', 13, c.textMuted)}
            {label(
                48,
                310,
                346,
                '• Stale Gen 2 retirement notice rejected as mismatch',
                13,
                alertTone,
            )}

            {label(48, 360, 346, 'Concurrent Sandbox Isolation:', 15, c.textPrimary, 'left', 650)}
            {label(
                48,
                385,
                346,
                '• Tenant B / Gen 1 reads base page 1 (value 20)',
                13,
                c.textMuted,
            )}
            {label(
                48,
                408,
                346,
                '• Zero cross-generation data bleeding or leakage',
                13,
                c.textMuted,
            )}
            {label(48, 432, 346, '• Clean scratch space maintained independently', 13, okTone)}

            {/* Bottom Right Panel */}
            {label(
                454,
                198,
                370,
                'Retirement Protocol vs Race Conditions',
                16,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                466,
                240,
                346,
                'Vulnerable Anti-Pattern: Timeout-to-Free',
                15,
                alertTone,
                'left',
                650,
            )}
            {label(
                466,
                265,
                346,
                '• Freeing memory on client timeout causes use-after-free',
                13,
                c.textMuted,
            )}
            {label(
                466,
                288,
                346,
                '• Guest process may still run and write to reused pages',
                13,
                c.textMuted,
            )}
            {label(466, 310, 346, '• Lost heartbeat leaves ownership uncertain', 13, alertTone)}

            {label(
                466,
                360,
                346,
                'Safe Draining Protocol: Two-Phase Disposal',
                15,
                okTone,
                'left',
                650,
            )}
            {label(
                466,
                385,
                346,
                '1. Authoritative model confirms generation retirement',
                13,
                c.textMuted,
            )}
            {label(
                466,
                408,
                346,
                '2. All vsock channels, TAP queues, and references close',
                13,
                c.textMuted,
            )}
            {label(466, 432, 346, '3. Only then is COW backing memory recycled', 13, okTone)}
        </Board>
    )
}

export default create('dark')
