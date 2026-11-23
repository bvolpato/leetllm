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
    'Multimodal content moderation fusion architecture and 2D decision plane. Text risk scores on the horizontal axis combine with visual image risk scores on the vertical axis across a calibrated linear decision boundary (0.45 times text score plus 0.55 times image score equals 0.65). Mild combinations fall in the allow region, while synergistic impersonation claims trigger the review region. A separate zero-tolerance signature gate enforces an immediate block regardless of missing or benign text.'

export const numericAnchors = {
    textWeight: 0.45,
    imageWeight: 0.55,
    reviewThreshold: 0.65,
    benignFusedScore: 0.102,
    impersonationFusedScore: 0.694,
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

    // Plot parameters
    const plotLeft = 90
    const plotBottom = 280
    const plotSize = 180

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Plot and Panels */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Plot Box */}
                    <rect
                        x={40}
                        y={70}
                        width={380}
                        height={262}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Plot Background Area */}
                    <rect
                        x={plotLeft}
                        y={plotBottom - plotSize}
                        width={plotSize}
                        height={plotSize}
                        fill={theme === 'dark' ? '#0d1522' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Decision Boundary Line: 0.45*x + 0.55*y = 0.65 */}
                    {/* At x=0.22, y = (0.65 - 0.45*0.22)/0.55 = 1.0 (top edge) -> xPix = 90 + 0.22*180 = 130, yPix = 100 */}
                    {/* At y=0, x = 0.65/0.45 = 1.44 (beyond right edge). At x=1.0, y = (0.65 - 0.45)/0.55 = 0.364 -> xPix = 270, yPix = 280 - 0.364*180 = 214 */}
                    <polygon
                        points={`${130},${100} ${270},${214} ${270},${100}`}
                        fill={theme === 'dark' ? '#332014' : '#fef3c7'}
                        opacity={0.6}
                    />
                    <line
                        x1={130}
                        y1={100}
                        x2={270}
                        y2={214}
                        stroke={warmTone}
                        strokeWidth={2}
                        strokeDasharray="4 3"
                    />

                    {/* Grid lines */}
                    <line
                        x1={plotLeft}
                        y1={plotBottom - plotSize * 0.5}
                        x2={plotLeft + plotSize}
                        y2={plotBottom - plotSize * 0.5}
                        stroke={stroke}
                        strokeWidth={0.5}
                        strokeDasharray="2 2"
                    />
                    <line
                        x1={plotLeft + plotSize * 0.5}
                        y1={plotBottom}
                        x2={plotLeft + plotSize * 0.5}
                        y2={plotBottom - plotSize}
                        stroke={stroke}
                        strokeWidth={0.5}
                        strokeDasharray="2 2"
                    />

                    {/* Point 1: Benign Post (0.08, 0.12) -> xPix = 90 + 14 = 104, yPix = 280 - 22 = 258 */}
                    <circle cx={104} cy={258} r={5} fill={greenTone} />

                    {/* Point 2: Impersonation Post (0.71, 0.68) -> xPix = 90 + 128 = 218, yPix = 280 - 122 = 158 */}
                    <circle cx={218} cy={158} r={5} fill={warmTone} />

                    {/* Right Info Box */}
                    <rect
                        x={440}
                        y={70}
                        width={380}
                        height={262}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Invariant Box */}
                    <rect
                        x={40}
                        y={344}
                        width={780}
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
                40,
                20,
                780,
                'Multimodal Moderation Fusion & Decision Space',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Ensemble combination of text and vision marginals with zero-tolerance perceptual signature overrides',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Plot Header */}
            {label(
                40,
                78,
                380,
                '2D MULTIMODAL SCORE SPACE: 0.45·Text + 0.55·Image',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* Plot Axis Labels */}
            {label(45, 98, 40, '1.0', 10, c.textMuted, 'right', 500)}
            {label(45, 188, 40, '0.5', 10, c.textMuted, 'right', 500)}
            {label(45, 275, 40, '0.0', 10, c.textMuted, 'right', 500)}
            {label(40, 180, 20, 'Image', 10, c.textMuted, 'center', 600)}

            {label(85, 292, 30, '0.0', 10, c.textMuted, 'center', 500)}
            {label(175, 292, 30, '0.5', 10, c.textMuted, 'center', 500)}
            {label(265, 292, 30, '1.0', 10, c.textMuted, 'center', 500)}
            {label(155, 308, 60, 'Text Score', 10, c.textMuted, 'center', 600)}

            {/* Legend & Points description */}
            {label(285, 120, 125, 'Review Boundary', 10, warmTone, 'left', 600)}
            {label(285, 140, 125, 'ALLOW Region', 10, greenTone, 'left', 500)}
            {label(285, 160, 125, 'REVIEW Region', 10, warmTone, 'left', 500)}
            {label(285, 220, 125, '• (0.08, 0.12): Allow', 10, greenTone, 'left', 500)}
            {label(285, 240, 125, '• (0.71, 0.68): Review', 10, warmTone, 'left', 600)}

            {/* Right Panel: Architecture & Override Principles */}
            {label(
                452,
                78,
                360,
                'FUSION STRATEGY & OVERRIDE MECHANICS',
                11,
                purpleTone,
                'left',
                700,
            )}

            {/* Section 1: Contextual Synergy */}
            {label(
                452,
                102,
                360,
                '1. Cross-Modal Impersonation Synergy',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                120,
                360,
                'Benign image + "Message me for official tickets" text combine to cross the 0.65 review threshold (0.694).',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Section 2: Absolute Signature Override */}
            {label(
                452,
                168,
                360,
                '2. Known Prohibited Signature Override',
                12,
                redTone,
                'left',
                700,
            )}
            {label(
                452,
                186,
                360,
                'Matches against verified CSAM or violent extremist image hashes trigger an unconditional BLOCK, bypassing fusion math even if caption text is absent or zero-risk.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Section 3: Partial Inputs & NaN Safety */}
            {label(452, 234, 360, '3. Missing Modality Handling', 12, blueTone, 'left', 700)}
            {label(
                452,
                252,
                360,
                'Text-only or image-only submissions re-normalize weights to 1.0. Any unparseable payload or NaN score automatically routes the item to human triage.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                356,
                756,
                'Multimodal Serving Pipeline Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                380,
                756,
                '1. Run OCR, ASR, and vision encoders in parallel. · 2. Chunk audio in 3s windows. · 3. Escalate borderline posts to joint VLMs.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
