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
    'Atomic quota admission and idempotency under concurrent requests. Two competing requests each attempt to reserve 700 tokens from a 1,000-token tenant ledger. The first wins and holds 700 tokens, leaving 300 available; the second is rejected for insufficient quota. An identical retry of request 1 returns the existing reservation without double-deduction.'

export const numericAnchors = {
    totalLimit: 1000,
    requestTokens: 700,
    reservedTokens: 700,
    remainingTokens: 300,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const redTone = getReadableToneColor('critical', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)

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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Top Pool Bar */}
                    <rect
                        x={40}
                        y={74}
                        width={780}
                        height={60}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <line x1={420} y1={84} x2={420} y2={124} stroke={stroke} strokeWidth={1} />

                    {/* Middle Left Card (Granted) */}
                    <rect
                        x={40}
                        y={150}
                        width={370}
                        height={110}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />

                    {/* Middle Right Card (Rejected) */}
                    <rect
                        x={450}
                        y={150}
                        width={370}
                        height={110}
                        rx={8}
                        fill={theme === 'dark' ? '#241417' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1.5}
                    />

                    {/* Idempotency Retry Card */}
                    <rect
                        x={40}
                        y={272}
                        width={780}
                        height={92}
                        rx={8}
                        fill={theme === 'dark' ? '#141722' : '#ffffff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <line x1={420} y1={286} x2={420} y2={352} stroke={stroke} strokeWidth={1} />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={40}
                        y={382}
                        width={780}
                        height={78}
                        rx={8}
                        fill={theme === 'dark' ? '#111e2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Atomic Quota Admission & Idempotent Replay Handling',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Preventing over-allocation under concurrent requests while ensuring idempotent retry safety',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Top Bar: Initial Tenant Allowance (1,000 tokens) */}
            {label(
                52,
                82,
                756,
                'TENANT QUOTA POOL: 1,000 TOKENS AVAILABLE',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(52, 102, 350, 'Contender 1: Requests 700 tokens', 12, blueTone, 'left', 600)}
            {label(
                440,
                102,
                350,
                'Contender 2: Requests 700 tokens (Concurrent race)',
                12,
                warmTone,
                'left',
                600,
            )}

            {/* Middle Section: Atomic Admission Decisions */}
            {/* Left Card: Winner */}
            {label(52, 160, 350, 'CONTENDER 1: ADMISSION GRANTED', 11, greenTone, 'left', 700)}
            {label(
                52,
                184,
                350,
                'Status: Lock acquired; 700 tokens held',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                204,
                350,
                'Ledger Balance: 1,000 − 700 = 300 remaining',
                11,
                greenTone,
                'left',
                600,
            )}
            {label(
                52,
                226,
                350,
                'Action: Dispatched to GPU worker queue',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Card: Loser */}
            {label(
                462,
                160,
                350,
                'CONTENDER 2: ADMISSION REJECTED (429)',
                11,
                redTone,
                'left',
                700,
            )}
            {label(
                462,
                184,
                350,
                'Status: Available quota (300) < requested (700)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                462,
                204,
                350,
                'Decision: 429 Too Many Requests (Quota Exceeded)',
                11,
                redTone,
                'left',
                600,
            )}
            {label(
                462,
                226,
                350,
                'Action: Zero balance deducted; request fails fast',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Replay Scenarios Box */}
            {label(
                52,
                280,
                756,
                'IDEMPOTENT RETRY ENGINE (IDEMPOTENCY-KEY SAFETY)',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(52, 306, 350, 'Identical Fingerprint Retry:', 12, c.textPrimary, 'left', 600)}
            {label(
                52,
                324,
                350,
                'Returns existing reservation (700 held). Zero double-deduction.',
                11,
                greenTone,
                'left',
                500,
            )}

            {label(440, 306, 350, 'Conflicting Payload Retry:', 12, c.textPrimary, 'left', 600)}
            {label(
                440,
                324,
                350,
                'Key re-used with altered prompt → 409 Conflict. Balance untouched.',
                11,
                redTone,
                'left',
                500,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                396,
                756,
                'Architecture Principle: Dual-Resource Isolation (Logical vs Physical)',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                416,
                756,
                '1. Reserve quota atomically in Redis. · 2. Allocate KV pages after reservation. · 3. Expire orphaned holds via TTL.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
