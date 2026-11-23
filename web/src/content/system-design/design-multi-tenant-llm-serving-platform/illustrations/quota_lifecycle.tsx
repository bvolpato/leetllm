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
    'Three-phase multi-tenant token quota lifecycle. Initially 1,000 tokens are available. Admission holds 700 tokens (300 prompt plus 400 max output tokens), leaving 300 available. When generation finishes with 120 output tokens, 420 tokens are permanently settled and 280 unspent tokens are refunded, restoring available quota to 580 tokens.'

export const numericAnchors = {
    initialQuota: 1000,
    promptTokens: 300,
    maxTokens: 400,
    reservedTokens: 700,
    outputTokens: 120,
    settledTokens: 420,
    refundedTokens: 280,
    finalAvailable: 580,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)

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

    // Ledger bar scale: 0 to 1,000 tokens mapped to 600px width (X: 180 -> 780)
    const barScale = (tok: number) => Math.round((tok / 1000) * 600)

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Bar 1 Track & Fill */}
                    <rect
                        x={180}
                        y={80}
                        width={600}
                        height={20}
                        rx={4}
                        fill={theme === 'dark' ? '#181b22' : '#f1f5f9'}
                    />
                    <rect
                        x={180}
                        y={80}
                        width={barScale(1000)}
                        height={20}
                        rx={4}
                        fill={greenTone}
                        opacity={0.8}
                    />

                    {/* Bar 2 Track & Fills */}
                    <rect
                        x={180}
                        y={120}
                        width={600}
                        height={20}
                        rx={4}
                        fill={theme === 'dark' ? '#181b22' : '#f1f5f9'}
                    />
                    <rect
                        x={180}
                        y={120}
                        width={barScale(700)}
                        height={20}
                        rx={4}
                        fill={warmTone}
                    />
                    <rect
                        x={180 + barScale(700)}
                        y={120}
                        width={barScale(300)}
                        height={20}
                        rx={4}
                        fill={greenTone}
                        opacity={0.6}
                    />

                    {/* Bar 3 Track & Fills */}
                    <rect
                        x={180}
                        y={160}
                        width={600}
                        height={20}
                        rx={4}
                        fill={theme === 'dark' ? '#181b22' : '#f1f5f9'}
                    />
                    <rect
                        x={180}
                        y={160}
                        width={barScale(420)}
                        height={20}
                        rx={4}
                        fill={blueTone}
                    />
                    <rect
                        x={180 + barScale(420)}
                        y={160}
                        width={barScale(280)}
                        height={20}
                        rx={4}
                        fill={greenTone}
                    />
                    <rect
                        x={180 + barScale(700)}
                        y={160}
                        width={barScale(300)}
                        height={20}
                        rx={4}
                        fill={greenTone}
                        opacity={0.4}
                    />

                    {/* 3 Detail Cards */}
                    <rect
                        x={40}
                        y={214}
                        width={248}
                        height={146}
                        rx={8}
                        fill={theme === 'dark' ? '#221c12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={300}
                        y={214}
                        width={248}
                        height={146}
                        rx={8}
                        fill={theme === 'dark' ? '#1c1328' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={560}
                        y={214}
                        width={260}
                        height={146}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />

                    {/* Connectors between cards */}
                    <line
                        x1={288}
                        y1={287}
                        x2={300}
                        y2={287}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                    />
                    <line
                        x1={548}
                        y1={287}
                        x2={560}
                        y2={287}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                    />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={40}
                        y={372}
                        width={780}
                        height={90}
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
                'Multi-Tenant Token Quota Lifecycle: Reserve, Settle, Refund',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Pessimistic admission reservation prevents over-subscription; settlement refunds unspent tokens',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Visual Ledger Bars */}
            {/* Bar 1: Initial */}
            {label(40, 84, 130, '1. Initial State', 11, greenTone, 'left', 700)}
            {label(190, 84, 400, 'Available: 1,000 Tokens (100% Free)', 11, greenTone, 'left', 500)}

            {/* Bar 2: Reserved */}
            {label(40, 124, 130, '2. Admission Hold', 11, warmTone, 'left', 700)}
            {label(190, 124, 300, 'Held: 700 Tokens (300 In + 400 Max)', 11, warmTone, 'left', 500)}
            {label(620, 124, 150, 'Free: 300', 11, c.textMuted, 'right', 500)}

            {/* Bar 3: Settled */}
            {label(40, 164, 130, '3. Reconciled', 11, blueTone, 'left', 700)}
            {label(190, 164, 250, 'Settled: 420 Billed', 11, blueTone, 'left', 500)}
            {label(450, 164, 150, 'Refunded: +280', 11, greenTone, 'left', 500)}
            {label(620, 164, 150, 'Available: 580', 11, greenTone, 'right', 700)}

            {/* 3 Detail Cards Side-by-Side */}
            {/* Card 1: Reservation */}
            {label(52, 226, 230, 'PHASE 1: RESERVATION', 11, warmTone, 'left', 700)}
            {label(
                52,
                248,
                230,
                'Input: 300 tokens · Max Output: 400 tokens · Hold Total: 700 tokens',
                11,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                52,
                302,
                230,
                'Prevents runaway generation from exceeding tenant budget.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Card 2: Actual Execution */}
            {label(312, 226, 230, 'PHASE 2: EXECUTION', 11, purpleTone, 'left', 700)}
            {label(
                312,
                248,
                230,
                'Model generates 120 tokens · Hits <|endoftext|> stop token · Output stopped early',
                11,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                312,
                302,
                230,
                'Actual token work: 300 in + 120 out = 420 tokens.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Card 3: Reconciliation */}
            {label(572, 226, 230, 'PHASE 3: RECONCILIATION', 11, greenTone, 'left', 700)}
            {label(
                572,
                248,
                230,
                'Billed to Tenant: 420 tokens · Unspent Refund: 280 tokens · New Balance: 580 tokens',
                11,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                572,
                302,
                230,
                'Unused reservation immediately returns to tenant pool.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                386,
                756,
                'Distributed Ledger Reconciliation Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                406,
                756,
                '1. Deduplicate settlement keys. · 2. Refund unspent tokens (400 - 50 = 350) on stream abort. · 3. Meter exact engine tokens.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
