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
    'Reciprocal Rank Fusion (RRF) at k = 60 combining lexical and dense vector search results. Both branches contribute exactly one reciprocal rank term per document identity. Lexical rank 1 and vector rank 2 for policy revision 2 yield 1/61 plus 1/62 (score 0.03252), tied with exception revision 1. Repeated passages within a single branch are deduplicated before scoring.'

export const numericAnchors = {
    k: 60,
    lexicalRanks: { 'policy@2': 1, 'exception@1': 2 },
    vectorRanks: { 'exception@1': 1, 'policy@2': 2 },
    policyScore: 1 / 61 + 1 / 62,
    exceptionScore: 1 / 62 + 1 / 61,
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

    // Scaling: 0 to 0.04 score maps to 400px bar
    const maxScore = 0.04
    const barW = (score: number) => Math.round((score / maxScore) * 400)

    const scoreTerm = (rank: number) => 1 / (60 + rank)
    const term1W = barW(scoreTerm(1))
    const term2W = barW(scoreTerm(2))

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Top Branch 1 Card */}
                    <rect
                        x={40}
                        y={76}
                        width={370}
                        height={80}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    {/* Top Branch 2 Card */}
                    <rect
                        x={450}
                        y={76}
                        width={370}
                        height={80}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />

                    {/* Policy Bar Track (y=210) */}
                    <rect
                        x={220}
                        y={212}
                        width={400}
                        height={24}
                        rx={4}
                        fill={theme === 'dark' ? '#181b22' : '#f1f5f9'}
                    />
                    <rect x={220} y={212} width={term1W} height={24} rx={4} fill={blueTone} />
                    <rect
                        x={220 + term1W}
                        y={212}
                        width={term2W}
                        height={24}
                        rx={4}
                        fill={greenTone}
                    />

                    {/* Exception Bar Track (y=280) */}
                    <rect
                        x={220}
                        y={282}
                        width={400}
                        height={24}
                        rx={4}
                        fill={theme === 'dark' ? '#181b22' : '#f1f5f9'}
                    />
                    <rect x={220} y={282} width={term2W} height={24} rx={4} fill={blueTone} />
                    <rect
                        x={220 + term2W}
                        y={282}
                        width={term1W}
                        height={24}
                        rx={4}
                        fill={greenTone}
                    />

                    {/* Legend Indicators */}
                    <rect x={204} y={346} width={12} height={12} rx={2} fill={blueTone} />
                    <rect x={404} y={346} width={12} height={12} rx={2} fill={greenTone} />

                    {/* Footer Guardrail Box */}
                    <rect
                        x={40}
                        y={374}
                        width={780}
                        height={96}
                        rx={8}
                        fill={theme === 'dark' ? '#241b12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Reciprocal Rank Fusion (RRF) & Identity Deduplication',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Formula: RRF(d) = sum 1 / (60 + r_m(d)); each document receives exactly one term per search branch',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Top Row: Two Input Branches */}
            {/* Branch 1 */}
            {label(
                52,
                84,
                350,
                'BRANCH 1: LEXICAL BM25 (TOKEN MATCHES)',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                108,
                350,
                'Rank #1: policy@2  (r = 1 → term = 1/61 ≈ 0.01639)',
                12,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                52,
                128,
                350,
                'Rank #2: exception@1 (r = 2 → term = 1/62 ≈ 0.01613)',
                12,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Branch 2 */}
            {label(
                462,
                84,
                350,
                'BRANCH 2: DENSE VECTOR HNSW (SEMANTIC EMBEDDINGS)',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                462,
                108,
                350,
                'Rank #1: exception@1 (r = 1 → term = 1/61 ≈ 0.01639)',
                12,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                462,
                128,
                350,
                'Rank #2: policy@2  (r = 2 → term = 1/62 ≈ 0.01613)',
                12,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Middle Section: Fusion Contribution Bars */}
            {label(
                40,
                176,
                780,
                'RECIPROCAL CONTRIBUTION ACCUMULATION',
                11,
                c.textMuted,
                'left',
                700,
            )}

            {/* Document 1 Row */}
            {label(40, 206, 170, 'policy@2', 13, c.textPrimary, 'left', 700)}
            {label(40, 226, 170, '1/61 (Lex) + 1/62 (Vec)', 11, c.textMuted, 'left', 400)}
            {label(640, 214, 170, 'RRF: 0.03252', 13, blueTone, 'right', 700)}

            {/* Document 2 Row */}
            {label(40, 276, 170, 'exception@1', 13, c.textPrimary, 'left', 700)}
            {label(40, 296, 170, '1/62 (Lex) + 1/61 (Vec)', 11, c.textMuted, 'left', 400)}
            {label(640, 284, 170, 'RRF: 0.03252', 13, greenTone, 'right', 700)}

            {/* Bar Legend */}
            {label(220, 342, 180, 'Lexical RRF Term', 11, blueTone, 'left', 500)}
            {label(420, 342, 180, 'Vector RRF Term', 11, greenTone, 'left', 500)}

            {/* Deduplication & Tie-breaking Footer */}
            {label(
                52,
                386,
                756,
                'Deduplication & Deterministic Tie-Breaking Rules',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                52,
                406,
                756,
                '1. Collapse intra-list document duplicates first. · 2. Break score ties (0.03252) deterministically. · 3. Fuse ordinal ranks only.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
