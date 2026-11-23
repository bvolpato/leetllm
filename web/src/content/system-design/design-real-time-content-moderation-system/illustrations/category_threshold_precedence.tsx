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
    'Multi-category moderation thresholding and precedence aggregation. Six independent safety categories (hate speech, violence, sexual content, self-harm, spam, and misinformation) define distinct review and block cutoff thresholds. For an evaluated message with violence score 0.94 and spam score 0.86, violence triggers the block band while spam triggers the review band. The aggregation precedence rule escalates to an immediate block while retaining both labels in the audit record.'

export const numericAnchors = {
    categories: 6,
    violenceScore: 0.94,
    violenceBlockCutoff: 0.9,
    spamScore: 0.86,
    spamReviewCutoff: 0.8,
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

    const categories = [
        { name: 'Violence / Threats', review: 0.6, block: 0.9, score: 0.94, tag: 'BLOCK' },
        { name: 'Hate & Harassment', review: 0.65, block: 0.95, score: 0.32, tag: 'ALLOW' },
        { name: 'Self-Harm / Suicide', review: 0.5, block: 0.85, score: 0.15, tag: 'ALLOW' },
        { name: 'Sexual Content', review: 0.7, block: 0.95, score: 0.28, tag: 'ALLOW' },
        { name: 'Spam & Phishing', review: 0.8, block: 0.98, score: 0.86, tag: 'REVIEW' },
        { name: 'Misinformation', review: 0.75, block: 0.95, score: 0.4, tag: 'ALLOW' },
    ]

    const meterStartX = 170
    const meterWidth = 320

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Bars & Framework */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Meters Container */}
                    <rect
                        x={35}
                        y={72}
                        width={520}
                        height={286}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* 6 Category Meters */}
                    {categories.map((cat, idx) => {
                        const y = 106 + idx * 38
                        const rWidth = cat.review * meterWidth
                        const bWidth = (cat.block - cat.review) * meterWidth
                        const blkWidth = (1 - cat.block) * meterWidth
                        const scoreX = meterStartX + cat.score * meterWidth
                        const tagColor =
                            cat.tag === 'BLOCK'
                                ? redTone
                                : cat.tag === 'REVIEW'
                                  ? warmTone
                                  : greenTone

                        return (
                            <g key={idx}>
                                {/* Allow Band (Green tint) */}
                                <rect
                                    x={meterStartX}
                                    y={y}
                                    width={rWidth}
                                    height={20}
                                    fill={theme === 'dark' ? '#0d2818' : '#dcfce7'}
                                    stroke={stroke}
                                    strokeWidth={0.5}
                                />
                                {/* Review Band (Amber tint) */}
                                <rect
                                    x={meterStartX + rWidth}
                                    y={y}
                                    width={bWidth}
                                    height={20}
                                    fill={theme === 'dark' ? '#2e200e' : '#fef3c7'}
                                    stroke={stroke}
                                    strokeWidth={0.5}
                                />
                                {/* Block Band (Red tint) */}
                                <rect
                                    x={meterStartX + rWidth + bWidth}
                                    y={y}
                                    width={blkWidth}
                                    height={20}
                                    fill={theme === 'dark' ? '#331214' : '#fee2e2'}
                                    stroke={stroke}
                                    strokeWidth={0.5}
                                />
                                {/* Current Score Pin */}
                                <line
                                    x1={scoreX}
                                    y1={y - 3}
                                    x2={scoreX}
                                    y2={y + 23}
                                    stroke={tagColor}
                                    strokeWidth={3}
                                />
                                <circle cx={scoreX} cy={y + 10} r={4} fill={tagColor} />
                            </g>
                        )
                    })}

                    {/* Scale axis line */}
                    <line
                        x1={meterStartX}
                        y1={330}
                        x2={meterStartX + meterWidth}
                        y2={330}
                        stroke={c.textMuted}
                        strokeWidth={1}
                    />
                    <line
                        x1={meterStartX}
                        y1={326}
                        x2={meterStartX}
                        y2={334}
                        stroke={c.textMuted}
                        strokeWidth={1}
                    />
                    <line
                        x1={meterStartX + meterWidth * 0.5}
                        y1={326}
                        x2={meterStartX + meterWidth * 0.5}
                        y2={334}
                        stroke={c.textMuted}
                        strokeWidth={1}
                    />
                    <line
                        x1={meterStartX + meterWidth}
                        y1={326}
                        x2={meterStartX + meterWidth}
                        y2={334}
                        stroke={c.textMuted}
                        strokeWidth={1}
                    />

                    {/* Right Aggregator Box */}
                    <rect
                        x={565}
                        y={72}
                        width={260}
                        height={286}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={35}
                        y={370}
                        width={790}
                        height={108}
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
                'Per-Category Threshold Cutoffs & Aggregation Precedence',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                35,
                48,
                790,
                'Independent category risk cutoffs with conservative precedence escalation across multi-label score vectors',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Section Header */}
            {label(
                40,
                82,
                480,
                'MULTI-LABEL CLASSIFIER SCORE BANDS (0.0 TO 1.0)',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* 6 Category Score Bars */}
            {categories.map((cat, idx) => {
                const y = 108 + idx * 38
                const scoreX = meterStartX + cat.score * meterWidth
                const tagColor =
                    cat.tag === 'BLOCK' ? redTone : cat.tag === 'REVIEW' ? warmTone : greenTone

                return (
                    <React.Fragment key={idx}>
                        {label(40, y + 2, 125, cat.name, 11, c.textPrimary, 'left', 600)}
                        {label(500, y + 2, 50, cat.score.toFixed(2), 11, tagColor, 'left', 700)}
                    </React.Fragment>
                )
            })}

            {/* Scale Axis Labels below meters */}
            {label(meterStartX - 10, 336, 40, '0.0', 10, c.textMuted, 'center', 500)}
            {label(
                meterStartX + meterWidth * 0.5 - 20,
                336,
                40,
                '0.5',
                10,
                c.textMuted,
                'center',
                500,
            )}
            {label(meterStartX + meterWidth - 10, 336, 40, '1.0', 10, c.textMuted, 'center', 500)}

            {/* Right Panel: Precedence Aggregator Card */}
            {label(572, 82, 240, 'PRECEDENCE DECISION ENGINE', 11, purpleTone, 'left', 700)}

            {/* Outcome Box */}
            {label(572, 110, 240, '1. Highest Severity Precedence', 12, c.textPrimary, 'left', 700)}
            {label(572, 128, 240, 'Violence (BLOCK) > Spam (REVIEW)', 11, redTone, 'left', 600)}
            {label(572, 144, 240, 'Final Action: IMMEDIATE BLOCK', 13, redTone, 'left', 700)}

            {label(
                572,
                180,
                240,
                '2. Multi-Label Audit Preservation',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                572,
                198,
                240,
                'Record retains both triggered tags: {violence: 0.94, spam: 0.86}. Ensures full context during appeal review.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(572, 248, 240, '3. Fail-Safe Data Validation', 12, c.textPrimary, 'left', 700)}
            {label(
                572,
                266,
                240,
                'Missing categories, NaN, or non-finite values automatically route to HUMAN REVIEW queue.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Panel */}
            {label(
                52,
                382,
                756,
                'Operating Cutoff Calibration & Multi-Label Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                404,
                756,
                '1. Lower thresholds on severe harms (0.50 vs 0.80 spam). · 2. Log all multi-label hits. · 3. Recalibrate PR curves per checkpoint.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
