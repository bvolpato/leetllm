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
    'Content moderation provider and model migration lifecycle across five controlled states: Active, Shadow, Canary, Drain, and Retired. The candidate model is benchmarked on mirrored shadow traffic without enforcement authority, then advanced to a calibrated canary slice before full drain. A taxonomy adapter maps provider-specific harm categories to normalized internal schemas.'

export const numericAnchors = {
    states: 5,
    canaryTrafficPercent: 5,
    parityF1Requirement: 0.992,
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

    const states = [
        { name: '1. ACTIVE', detail: 'Old model serves 100% live traffic', color: blueTone },
        {
            name: '2. SHADOW',
            detail: 'Mirrored traffic; offline drift & latency eval (0% authority)',
            color: purpleTone,
        },
        {
            name: '3. CANARY',
            detail: '1-5% live slice; human review parity & threshold validation',
            color: greenTone,
        },
        {
            name: '4. DRAIN',
            detail: 'Candidate serves 100%; old model held warm for rollback',
            color: warmTone,
        },
        {
            name: '5. RETIRED',
            detail: 'Decommissioned; credentials revoked; audit logs sealed',
            color: redTone,
        },
    ]

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

                    {/* Timeline connector line */}
                    <line x1={58} y1={112} x2={58} y2={280} stroke={stroke} strokeWidth={2} />

                    {/* 5 State node dots */}
                    {states.map((st, idx) => {
                        const y = 112 + idx * 42
                        return (
                            <circle
                                key={idx}
                                cx={58}
                                cy={y}
                                r={5}
                                fill={st.color}
                                stroke={theme === 'dark' ? '#121824' : '#ffffff'}
                                strokeWidth={2}
                            />
                        )
                    })}

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
                'Model & Provider Migration: Shadow Canary Lifecycle',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Safely updating classification endpoints, taxonomy versions, and third-party moderation APIs',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: 5 States Flow */}
            {label(52, 82, 350, 'CONTROLLED MIGRATION STATE MACHINE', 11, blueTone, 'left', 700)}

            {states.map((st, idx) => {
                const y = 106 + idx * 42
                return (
                    <React.Fragment key={idx}>
                        {label(74, y, 90, st.name, 11, st.color, 'left', 700)}
                        {label(170, y, 230, st.detail, 10, c.textSecondary, 'left', 400)}
                    </React.Fragment>
                )
            })}

            {/* Right Panel: Taxonomy Adapter & Gating */}
            {label(452, 82, 350, 'TAXONOMY ADAPTER & PARITY GATES', 11, purpleTone, 'left', 700)}

            {label(
                452,
                106,
                350,
                '1. Schema & Taxonomy Normalization',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                124,
                350,
                'External provider outputs (e.g. OpenAI "violence/graphic" or Perspective "toxicity") pass through a bidirectional adapter that maps scores to our canonical internal safety taxonomy.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                174,
                350,
                '2. Threshold Recalibration & Isotonic Fit',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                192,
                350,
                'Raw logits and probability densities drift between model architectures. Candidate cutoffs are recalibrated against an immutable benchmark dataset prior to canary promotion.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(452, 246, 350, '3. Automated Rollback Triggers', 12, redTone, 'left', 700)}
            {label(
                452,
                264,
                350,
                'If canary error rate exceeds 0.05% or user appeal rate doubles, routing reverts to the drain baseline automatically within 3 seconds.',
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
                'Provider Rollout & Deprecation Invariants',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Drop shadow traffic first under saturation. · 2. Stamp provider, checkpoint, and taxonomy IDs. · 3. Gate canaries on replay suites.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
