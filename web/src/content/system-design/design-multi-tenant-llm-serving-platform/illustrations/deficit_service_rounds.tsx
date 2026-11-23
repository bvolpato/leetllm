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
    'Deficit Round Robin (DRR) token scheduling across three rounds. Tenant A receives 4 credits per round with 3-token chunks; Tenant B receives 2 credits with 1-token chunks. Across three rounds, Tenant A serves 3, 3, and 6 tokens (carrying over 1, 2, and 0 credits), while Tenant B serves 2 tokens each round. Cumulative work is exactly 2:1 (12 to 6 tokens), proving fair-share allocation despite different chunk sizes.'

export const numericAnchors = {
    quantumA: 4,
    quantumB: 2,
    chunkA: 3,
    chunkB: 1,
    rounds: [
        { round: 1, aCredits: 4, aServed: 3, aCarry: 1, bCredits: 2, bServed: 2, bCarry: 0 },
        { round: 2, aCredits: 5, aServed: 3, aCarry: 2, bCredits: 2, bServed: 2, bCarry: 0 },
        { round: 3, aCredits: 6, aServed: 6, aCarry: 0, bCredits: 2, bServed: 2, bCarry: 0 },
    ],
    totalTokensA: 12,
    totalTokensB: 6,
    totalChunksA: 4,
    totalChunksB: 6,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
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

    const rounds = [
        {
            round: 'Round 1',
            aCredits: '4 credits',
            aServed: 'Serves 1 chunk (3 tokens)',
            aCarry: 'Carries +1',
            bServed: 'Serves 2 chunks (2 tokens)',
            bCarry: 'Carries 0',
        },
        {
            round: 'Round 2',
            aCredits: '1 + 4 = 5 credits',
            aServed: 'Serves 1 chunk (3 tokens)',
            aCarry: 'Carries +2',
            bServed: 'Serves 2 chunks (2 tokens)',
            bCarry: 'Carries 0',
        },
        {
            round: 'Round 3',
            aCredits: '2 + 4 = 6 credits',
            aServed: 'Serves 2 chunks (6 tokens)',
            aCarry: 'Carries 0',
            bServed: 'Serves 2 chunks (2 tokens)',
            bCarry: 'Carries 0',
        },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Top SLA Card */}
                    <rect
                        x={40}
                        y={74}
                        width={780}
                        height={60}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <line x1={420} y1={84} x2={420} y2={124} stroke={stroke} strokeWidth={1} />

                    {/* 3 Round Cards */}
                    {[0, 1, 2].map((i) => {
                        const rx = 40 + i * 266
                        return (
                            <g key={`round-card-${i}`}>
                                <rect
                                    x={rx}
                                    y={148}
                                    width={248}
                                    height={206}
                                    rx={8}
                                    fill={theme === 'dark' ? '#141720' : '#ffffff'}
                                    stroke={stroke}
                                    strokeWidth={1}
                                />
                                <line
                                    x1={rx + 12}
                                    y1={258}
                                    x2={rx + 236}
                                    y2={258}
                                    stroke={stroke}
                                    strokeWidth={1}
                                    strokeDasharray="3 2"
                                />
                            </g>
                        )
                    })}

                    {/* Cumulative Totals Box */}
                    <rect
                        x={40}
                        y={372}
                        width={780}
                        height={90}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Deficit Round Robin (DRR): Fair-Share Token Scheduling',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Deficit quantum guarantees proportional token throughput without penalizing large prefill chunks',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* SLA Configuration Bar */}
            {label(
                52,
                82,
                756,
                'SLA WEIGHTED QUANTUM ALLOCATION: 2 : 1 RATIO',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                102,
                350,
                'Tenant A: +4 credits / round (Chunk size = 3 tokens)',
                12,
                blueTone,
                'left',
                600,
            )}
            {label(
                440,
                102,
                350,
                'Tenant B: +2 credits / round (Chunk size = 1 token)',
                12,
                purpleTone,
                'left',
                600,
            )}

            {/* 3 Sequential Rounds */}
            {rounds.map((r, i) => {
                const rx = 40 + i * 266
                return (
                    <React.Fragment key={`round-col-${i}`}>
                        {label(rx + 12, 156, 230, r.round, 13, c.textPrimary, 'left', 700)}
                        {/* Tenant A state */}
                        {label(rx + 12, 182, 230, 'Tenant A (Weight 4)', 11, blueTone, 'left', 600)}
                        {label(rx + 12, 200, 230, r.aCredits, 11, c.textSecondary, 'left', 400)}
                        {label(rx + 12, 218, 230, r.aServed, 11, c.textPrimary, 'left', 500)}
                        {label(rx + 12, 236, 230, r.aCarry, 11, warmTone, 'left', 600)}

                        {/* Divider */}
                        {/* Tenant B state */}
                        {label(
                            rx + 12,
                            268,
                            230,
                            'Tenant B (Weight 2)',
                            11,
                            purpleTone,
                            'left',
                            600,
                        )}
                        {label(
                            rx + 12,
                            286,
                            230,
                            '+2 credits available',
                            11,
                            c.textSecondary,
                            'left',
                            400,
                        )}
                        {label(rx + 12, 304, 230, r.bServed, 11, c.textPrimary, 'left', 500)}
                        {label(rx + 12, 322, 230, r.bCarry, 11, c.textMuted, 'left', 400)}
                    </React.Fragment>
                )
            })}

            {/* Cumulative Totals Footer Card */}
            {label(
                52,
                386,
                756,
                'Cumulative Totals Across 3 Rounds: Work Units vs Request Counts',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                408,
                350,
                'Token Work Done: Tenant A = 12 tokens | Tenant B = 6 tokens',
                13,
                greenTone,
                'left',
                700,
            )}
            {label(
                440,
                408,
                350,
                'Exact 2 : 1 Ratio (Conforms to SLA weights)',
                12,
                greenTone,
                'left',
                600,
            )}
            {label(
                52,
                432,
                756,
                'Completed chunks: Tenant A = 4, Tenant B = 6 (2:3). Token-weighted DRR preserves fair GPU share across variable lengths.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
