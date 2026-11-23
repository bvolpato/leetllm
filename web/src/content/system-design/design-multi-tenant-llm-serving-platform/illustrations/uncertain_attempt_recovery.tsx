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
    'Failure recovery and quota reconciliation workflow for uncertain execution attempts. A 700-token quota hold is reserved before generation. When a network timeout occurs mid-generation at token 420, the engine terminates execution, reconciles actual usage by billing 420 tokens, and refunds the remaining 280 tokens. Subsequent retries with the same idempotency key detect terminal status and avoid duplicate billing.'

export const numericAnchors = {
    reservedHold: 700,
    settledTokens: 420,
    refundedTokens: 280,
    retryCharge: 0,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)

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

    const timelineSteps = [
        {
            stage: '1. Quota Hold Placed',
            detail: '700 tokens reserved in Redis prior to engine dispatch',
            color: blueTone,
        },
        {
            stage: '2. Streaming Execution',
            detail: 'Engine generates tokens 1..420 in continuous batch',
            color: purpleTone,
        },
        {
            stage: '3. Network Disconnect',
            detail: 'Client socket closes mid-stream; engine halts decode',
            color: warmTone,
        },
        {
            stage: '4. Usage Reconciliation',
            detail: 'Settle 420 consumed tokens; refund 280 held tokens',
            color: greenTone,
        },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Timeline Panel */}
                    <rect
                        x={40}
                        y={72}
                        width={380}
                        height={235}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Timeline vertical connector */}
                    <line x1={58} y1={118} x2={58} y2={260} stroke={stroke} strokeWidth={2} />

                    {/* Timeline Node Dots */}
                    {timelineSteps.map((step, idx) => {
                        const y = 118 + idx * 46
                        return (
                            <circle
                                key={idx}
                                cx={58}
                                cy={y}
                                r={6}
                                fill={step.color}
                                stroke={theme === 'dark' ? '#121824' : '#ffffff'}
                                strokeWidth={2}
                            />
                        )
                    })}

                    {/* Right Recovery Rules Panel */}
                    <rect
                        x={440}
                        y={72}
                        width={380}
                        height={235}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Divider lines between rules */}
                    <line
                        x1={452}
                        y1={162}
                        x2={808}
                        y2={162}
                        stroke={stroke}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                    />
                    <line
                        x1={452}
                        y1={224}
                        x2={808}
                        y2={224}
                        stroke={stroke}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                    />

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={40}
                        y={320}
                        width={780}
                        height={148}
                        rx={8}
                        fill={theme === 'dark' ? '#102216' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Failure Recovery & Quota Settlement Under Network Uncertainty',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Reconciling partial token usage, clearing quota holds, and preserving idempotent deduplication on timeout',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: Execution & Settlement Timeline */}
            {label(52, 84, 350, 'DISCONNECT LIFECYCLE & SETTLEMENT', 11, blueTone, 'left', 700)}

            {timelineSteps.map((step, idx) => {
                const y = 110 + idx * 46
                return (
                    <React.Fragment key={idx}>
                        {label(72, y, 320, step.stage, 12, step.color, 'left', 700)}
                        {label(72, y + 16, 320, step.detail, 10, c.textSecondary, 'left', 400)}
                    </React.Fragment>
                )
            })}

            {/* Right Panel: Recovery Rules & Idempotency */}
            {label(
                452,
                84,
                350,
                'IDEMPOTENT RETRY & PROTOCOL RECOVERY RULES',
                11,
                purpleTone,
                'left',
                700,
            )}

            {/* Rule 1: Idempotency Key */}
            {label(
                452,
                110,
                350,
                'Idempotency Protection (Same Request ID / Key)',
                12,
                purpleTone,
                'left',
                700,
            )}
            {label(
                452,
                128,
                350,
                'Duplicate delivery inspects settled state. Replays cached 420-token event with $0 additional charge.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Rule 2: Pre-Stream vs Mid-Stream Boundary */}
            {label(
                452,
                172,
                350,
                'Phase 1: Fault Before First Token Emission',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                452,
                190,
                350,
                'Safe for automated gateway retry on backup engine replica. Zero tokens exposed to caller.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                234,
                350,
                'Phase 2: Fault Mid-Stream (Tokens Already Emitted)',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                452,
                252,
                350,
                'Never restart from scratch and append to old prefix. Signal stream interruption; caller must issue explicit continuation.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Panel: System Invariants */}
            {label(
                52,
                332,
                756,
                'Distributed Serving Invariants Under Partial Failure',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                356,
                756,
                '1. Settle or TTL-expire every quota hold. · 2. Free KV pages immediately on cancel. · 3. Meter executed steps only.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
