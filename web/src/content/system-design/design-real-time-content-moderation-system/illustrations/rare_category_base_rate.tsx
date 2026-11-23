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
    'Bayesian base-rate fallacy in content moderation under severe class imbalance. In a population of 100,000 posts with 0.1 percent violation prevalence (100 true violations, 99,900 legitimate posts), a classifier with 95 percent recall and 99 percent specificity generates 95 true positives and 999 false positives. The resulting precision is only 8.68 percent, demonstrating why low-prevalence harms require tiered human review rather than aggressive unilateral auto-blocking.'

export const numericAnchors = {
    totalItems: 100000,
    trueViolations: 100,
    legitimateItems: 99900,
    recallPercent: 95.0,
    falsePositiveRatePercent: 1.0,
    truePositives: 95,
    falsePositives: 999,
    precisionPercent: 8.68,
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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Box */}
                    <rect
                        x={40}
                        y={70}
                        width={375}
                        height={245}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Breakdown mini cards */}
                    <rect
                        x={48}
                        y={100}
                        width={170}
                        height={46}
                        rx={4}
                        fill={theme === 'dark' ? '#102216' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={232}
                        y={100}
                        width={175}
                        height={46}
                        rx={4}
                        fill={theme === 'dark' ? '#281216' : '#fee2e2'}
                        stroke={redTone}
                        strokeWidth={1}
                    />

                    {/* Proportional Flagged Bar: 8.7% Green (30px), 91.3% Red (320px) */}
                    <rect x={52} y={232} width={31} height={16} rx={2} fill={greenTone} />
                    <rect x={85} y={232} width={322} height={16} rx={2} fill={redTone} />

                    {/* Right Box */}
                    <rect
                        x={440}
                        y={70}
                        width={375}
                        height={245}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={40}
                        y={330}
                        width={775}
                        height={138}
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
                'Base-Rate Fallacy in Low-Prevalence Moderation',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Why a 99% specific classifier yields only 8.7% precision when harm prevalence is 0.1%',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: Mathematical Breakdown */}
            {label(
                52,
                82,
                350,
                'POPULATION METRICS: 100,000 POSTS (0.1% BASE RATE)',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* True Positives vs False Positives breakdown */}
            {label(52, 108, 175, 'True Violations: 100', 11, c.textPrimary, 'left', 700)}
            {label(52, 124, 175, 'Recall = 95% → 95 TP, 5 FN', 10, greenTone, 'left', 500)}

            {label(238, 108, 175, 'Legitimate: 99,900', 11, c.textPrimary, 'left', 700)}
            {label(238, 124, 175, 'FPR = 1.0% → 999 False Positives!', 10, redTone, 'left', 600)}

            {/* Flagged Pool Summary */}
            {label(
                52,
                162,
                350,
                'Total Items Flagged: 1,094 (95 TP + 999 FP)',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                52,
                182,
                350,
                'Precision: 95 / 1,094 = 8.68% (Over 91% False Alarms)',
                13,
                redTone,
                'left',
                700,
            )}

            {/* Visual breakdown progress bars */}
            {label(52, 218, 350, 'Flagged Population Composition:', 10, c.textMuted, 'left', 500)}
            {label(52, 252, 80, '95 True (8.7%)', 9, greenTone, 'left', 600)}
            {label(140, 252, 200, '999 False Positives (91.3%)', 9, redTone, 'left', 600)}

            {/* Right Panel: Architecture Implications */}
            {label(
                452,
                82,
                350,
                'SYSTEM DESIGN & OPERATING POINT CHOICES',
                11,
                purpleTone,
                'left',
                700,
            )}

            {label(
                452,
                106,
                350,
                '1. ROC-AUC is Misleading in Imbalanced Domains',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                124,
                350,
                'A 0.99 ROC-AUC sounds near-perfect, but masks hundreds of wrongful account strikes. Engineering teams must evaluate Precision-Recall curves (PR-AUC) and cost-weighted loss.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(452, 174, 350, '2. Never Auto-Block at Low Precision', 12, redTone, 'left', 700)}
            {label(
                452,
                192,
                350,
                'Unilateral auto-blocking at this threshold silences 999 innocent users for every 95 bad actors caught. Severe penalties require extreme confidence (>= 0.99) or human review.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                246,
                350,
                '3. Tiered Triage with Human In the Loop',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                452,
                264,
                350,
                'Flagged items enter the prioritized human review queue. Human moderators filter out the 999 false alarms before irreversible actions (bans, law enforcement escalation) occur.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Panel */}
            {label(
                52,
                342,
                756,
                'Evaluation & Metric Governance Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Offline Prevalence Grounding: Benchmark test sets must mirror true production prevalence (e.g. 0.1%); artificially balanced 50/50 test sets conceal base-rate fallout. · 2. Asymmetric Cost Matrix: Missing a terror threat is catastrophic; falsely banning a news organization causes severe reputational and legal liability. · 3. Active Stratified Sampling: Continuously sample high-confidence allow decisions to estimate and bound the false-negative leakage rate.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
