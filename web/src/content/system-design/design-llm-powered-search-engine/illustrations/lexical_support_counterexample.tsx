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
    'Counterexample illustrating why lexical keyword containment fails verification. The claim "Security approval is required" matches 80 percent of tokens in "Security approval is not required" yet is contradicted. Conversely, the valid paraphrase "Authorization from the security team is mandatory" fails token overlap despite semantic entailment.'

export const numericAnchors = {
    claim: 'Security approval is required',
    negatedSource: 'Security approval is not required',
    paraphraseSource: 'Authorization from the security team is mandatory',
    negatedTokenOverlap: 0.8,
    paraphraseTokenOverlap: 0.2,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const redTone = getReadableToneColor('critical', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const blueTone = getReadableToneColor('blue', c, c.bg)
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
                    {/* Top Claim Card */}
                    <rect
                        x={40}
                        y={74}
                        width={780}
                        height={60}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1.5}
                    />

                    {/* Left Card (Negation) */}
                    <rect
                        x={40}
                        y={148}
                        width={370}
                        height={206}
                        rx={8}
                        fill={theme === 'dark' ? '#1c1214' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    {/* Highlight box for "not" */}
                    <rect
                        x={186}
                        y={194}
                        width={32}
                        height={20}
                        rx={3}
                        fill={redTone}
                        opacity={0.3}
                    />

                    {/* Right Card (Paraphrase) */}
                    <rect
                        x={450}
                        y={148}
                        width={370}
                        height={206}
                        rx={8}
                        fill={theme === 'dark' ? '#1e1c12' : '#fefce8'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />

                    {/* Bottom NLI Card */}
                    <rect
                        x={40}
                        y={372}
                        width={780}
                        height={88}
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
                'Why Lexical Overlap Fails Verification: Entailment vs Surface Words',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Surface token containment produces catastrophic false positives on negation and false negatives on paraphrases',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Top Anchor: Generated Model Claim */}
            {label(52, 82, 756, 'GENERATED MODEL CLAIM TO VERIFY', 11, blueTone, 'left', 700)}
            {label(52, 102, 756, '"Security approval is required"', 15, c.textPrimary, 'left', 700)}

            {/* Left Card: Negation Failure */}
            {label(52, 158, 350, 'HAZARD A: NEGATION (FALSE POSITIVE)', 11, redTone, 'left', 700)}
            {label(52, 180, 350, 'Source Text in Index:', 11, c.textMuted, 'left', 500)}
            {label(
                52,
                198,
                350,
                '"Security approval is not required"',
                13,
                c.textPrimary,
                'left',
                600,
            )}

            {label(
                52,
                230,
                350,
                'Lexical Word Match: 80% (4 / 5 tokens overlap)',
                11,
                warmTone,
                'left',
                500,
            )}
            {label(
                52,
                250,
                350,
                'Lexical Decision: PASS (Disaster: False Positive)',
                12,
                redTone,
                'left',
                700,
            )}
            {label(
                52,
                274,
                350,
                'Semantic Reality: Direct Contradiction! Word "not" completely flips the assertion.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Card: Paraphrase Failure */}
            {label(
                462,
                158,
                350,
                'HAZARD B: PARAPHRASE (FALSE NEGATIVE)',
                11,
                warmTone,
                'left',
                700,
            )}
            {label(462, 180, 350, 'Source Text in Index:', 11, c.textMuted, 'left', 500)}
            {label(
                462,
                198,
                350,
                '"Authorization from security is mandatory"',
                13,
                c.textPrimary,
                'left',
                600,
            )}

            {label(
                462,
                230,
                350,
                'Lexical Word Match: 20% (1 / 5 tokens overlap)',
                11,
                warmTone,
                'left',
                500,
            )}
            {label(
                462,
                250,
                350,
                'Lexical Decision: FAIL (False Negative Rejection)',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                462,
                274,
                350,
                'Semantic Reality: Complete Entailment! Exact same meaning expressed in distinct words.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                386,
                756,
                'Architecture Principle: Learned Natural Language Inference (NLI)',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                406,
                756,
                'Search citation verifiers cannot rely on regex, BM25, or Jaccard token overlap. Grounded verification requires a dedicated cross-encoder NLI classifier (Premise + Hypothesis → Entailment / Contradiction / Neutral) or specialized verifier LLM.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
