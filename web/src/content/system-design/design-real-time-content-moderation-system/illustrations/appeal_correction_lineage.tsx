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
    'Content moderation appeal correction lineage and model retraining feedback loop. An original immutable block decision is linked to a user appeal entity. When human adjudication overturns a decision due to classifier error under the same policy, the item is tagged as a candidate hard negative for model retraining, while an orchestrator coordinates content unblocking, account strike rollback, and cache invalidation.'

export const numericAnchors = {
    lineageStages: 3,
    remediationServices: 4,
    feedbackLoopEnabled: true,
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

                    {/* Step boxes */}
                    <rect
                        x={48}
                        y={100}
                        width={359}
                        height={42}
                        rx={4}
                        fill={theme === 'dark' ? '#281216' : '#fee2e2'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={146}
                        width={359}
                        height={42}
                        rx={4}
                        fill={theme === 'dark' ? '#182438' : '#e0f2fe'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={192}
                        width={359}
                        height={70}
                        rx={4}
                        fill={theme === 'dark' ? '#102216' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />

                    {/* Right Box */}
                    <rect
                        x={440}
                        y={70}
                        width={375}
                        height={245}
                        rx={8}
                        fill={theme === 'dark' ? '#102216' : '#f0fdf4'}
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
                'Appeal Correction Lineage & Retraining Feedback Loop',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Preserving immutable audit trails across user appeals while routing verified false positives into active learning',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: Lineage & Adjudication */}
            {label(52, 82, 350, '1. IMMUTABLE LINEAGE & ADJUDICATION', 11, blueTone, 'left', 700)}

            {/* Original Decision */}
            {label(
                52,
                106,
                350,
                'Original Decision (decision_id: d1) [IMMUTABLE]',
                11,
                redTone,
                'left',
                700,
            )}
            {label(
                52,
                122,
                350,
                'Action: BLOCKED · Policy: v44 (Impersonation)',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Linked Appeal */}
            {label(
                52,
                150,
                350,
                'User Appeal (appeal_id: a1) [LINKED CHILD]',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                166,
                350,
                'Grounds: "Satire account / parody educational content"',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Adjudication Outcome */}
            {label(
                52,
                194,
                350,
                'Senior Reviewer Adjudication: OVERTURNED',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                212,
                350,
                'Root Cause: Classifier False Positive (Parody misclassified as fraud). Decision record d1 preserved; corrective event d2 appended.',
                10,
                c.textPrimary,
                'left',
                400,
            )}

            {/* Right Panel: Remediation & Active Learning */}
            {label(
                452,
                82,
                350,
                '2. REMEDIATION & MODEL RETRAINING LOOP',
                11,
                greenTone,
                'left',
                700,
            )}

            {label(
                452,
                106,
                350,
                'A. Distributed State Remediation',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                124,
                350,
                'Orchestrator restores content in feed/search index, reverses account penalty strikes, evicts stale negative decisions from Redis, and notifies the creator.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                174,
                350,
                'B. Hard Negative Active Learning Tag',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                452,
                192,
                350,
                'Confirmed false positives enter supervised retraining datasets after lead-reviewer validation.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(452, 246, 350, 'C. Policy Evolution Separation', 12, purpleTone, 'left', 700)}
            {label(
                452,
                264,
                350,
                'Appeals granted due to updated policy rules (v44 -> v45) are kept separate from model errors, preventing data contamination in classifier training sets.',
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
                'Appeal Governance & Training Safety Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Vet overturned appeals before retraining. · 2. Append corrective records without mutating history. · 3. Enforce statutory SLA timers.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
