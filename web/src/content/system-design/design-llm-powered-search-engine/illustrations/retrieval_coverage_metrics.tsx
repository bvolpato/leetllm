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
    'Information retrieval coverage metrics comparing partial and complete candidate rankings against a gold standard of two documents (policy revision 2 and exception revision 1). A list missing the exception achieves 50 percent recall and 0.6131 nDCG, while retrieving both achieves 1.0 recall and 1.0 nDCG.'

export const numericAnchors = {
    goldDocuments: ['policy@2', 'exception@1'],
    goldCount: 2,
    partialRecall: 0.5,
    partialNdcg: 0.6131,
    completeRecall: 1.0,
    completeNdcg: 1.0,
    idcg: 1.63093,
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
                    {/* Gold standard top banner */}
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

                    {/* Left Column Box */}
                    <rect
                        x={40}
                        y={148}
                        width={370}
                        height={216}
                        rx={8}
                        fill={theme === 'dark' ? '#221c12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                    <line x1={52} y1={224} x2={398} y2={224} stroke={stroke} strokeWidth={1} />

                    {/* Right Column Box */}
                    <rect
                        x={450}
                        y={148}
                        width={370}
                        height={216}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <line x1={462} y1={224} x2={808} y2={224} stroke={stroke} strokeWidth={1} />

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
                'Retrieval Quality Metrics: Recall@K vs Normalized Discounted Cumulative Gain (nDCG@K)',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Measuring candidate recall and rank discounting against multi-document ground truth requirements',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Benchmark Gold Standard Banner */}
            {label(
                52,
                82,
                756,
                'GROUND TRUTH GOLD SET: 2 MANDATORY SOURCE IDENTITIES',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                102,
                350,
                '1. policy@2 (Base Migration Policy)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                440,
                102,
                350,
                '2. exception@1 (Service Account Condition)',
                12,
                c.textPrimary,
                'left',
                600,
            )}

            {/* Comparison Columns */}
            {/* Left Column: Partial Retrieval */}
            {label(
                52,
                160,
                350,
                'SCENARIO A: PARTIAL COVERAGE [policy@2, faq]',
                11,
                warmTone,
                'left',
                700,
            )}
            {label(
                52,
                184,
                350,
                'Rank #1: policy@2 (Relevance = 1 · DCG = 1.0)',
                11,
                greenTone,
                'left',
                500,
            )}
            {label(
                52,
                202,
                350,
                'Rank #2: faq (Relevance = 0 · DCG = 0.0)',
                11,
                c.textMuted,
                'left',
                400,
            )}

            {label(52, 234, 160, 'Recall@2: 0.50 (50%)', 13, warmTone, 'left', 700)}
            {label(
                220,
                234,
                180,
                '1 of 2 required sources found',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(52, 258, 160, 'nDCG@2: 0.6131', 13, warmTone, 'left', 700)}
            {label(220, 258, 180, 'DCG 1.0 / IDCG 1.63093', 11, c.textSecondary, 'left', 400)}

            {label(
                52,
                290,
                350,
                'Impact: Synthesis is missing the 60-day exception! The generated response will cite policy but omit the conditional override.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Column: Complete Retrieval */}
            {label(
                462,
                160,
                350,
                'SCENARIO B: COMPLETE COVERAGE [policy@2, exception@1]',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                462,
                184,
                350,
                'Rank #1: policy@2 (Relevance = 1 · DCG = 1.0)',
                11,
                greenTone,
                'left',
                500,
            )}
            {label(
                462,
                202,
                350,
                'Rank #2: exception@1 (Relevance = 1 · DCG = 0.6309)',
                11,
                greenTone,
                'left',
                500,
            )}

            {label(462, 234, 160, 'Recall@2: 1.00 (100%)', 13, greenTone, 'left', 700)}
            {label(
                630,
                234,
                180,
                'All required sources retrieved',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(462, 258, 160, 'nDCG@2: 1.0000', 13, greenTone, 'left', 700)}
            {label(
                630,
                258,
                180,
                'Ideal ranking position discount',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                462,
                290,
                350,
                'Impact: Synthesis receives full context. Generator can accurately synthesize both the 30-day baseline and 60-day approval exception.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                396,
                756,
                'Deduplication and Evaluation Guardrails',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                416,
                756,
                '1. Document-Level Deduplication: multiple chunks from policy@2 cannot claim multiple slots in the gold set. · 2. Gold Denominator Non-Zero: queries without relevant documents return N/A rather than 0%. · 3. Metric Independence: High nDCG proves retrieval rank ordering, but does not guarantee LLM synthesis faithfulness.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
