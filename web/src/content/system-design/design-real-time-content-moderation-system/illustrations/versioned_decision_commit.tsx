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
    'Content moderation versioned decision commit and optimistic concurrency control architecture. Evaluating incoming decisions against current entity revision and status prevents race conditions with concurrent user edits. A conditional compare-and-swap query ensures decisions commit only if revision matches and status remains pending, emitting transactional outbox events while guaranteeing idempotent replay.'

export const numericAnchors = {
    targetRevision: 8,
    policyRevision: 44,
    outcomes: 3,
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

                    {/* SQL query container */}
                    <rect
                        x={48}
                        y={166}
                        width={359}
                        height={58}
                        rx={4}
                        fill={theme === 'dark' ? '#1a1828' : '#faf5ff'}
                        stroke={purpleTone}
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
                'Versioned Decision Commit & Optimistic Concurrency',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Preventing race conditions between concurrent user edits and asynchronous moderation evaluations',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: Conditional CAS Commit */}
            {label(52, 82, 350, '1. CONDITIONAL COMPARE-AND-SWAP (CAS)', 11, blueTone, 'left', 700)}

            {/* Current State Card */}
            {label(52, 106, 350, 'Current Content Record State:', 11, c.textPrimary, 'left', 600)}
            {label(
                52,
                124,
                350,
                'content_id: 123 · revision: 8 · status: PENDING',
                10,
                blueTone,
                'left',
                600,
            )}

            {/* Atomic Query Box */}
            {label(52, 154, 350, 'Atomic SQL / Spanner Mutation:', 11, purpleTone, 'left', 700)}
            {label(
                52,
                172,
                350,
                "UPDATE content_items · SET status = 'BLOCKED', decision_id = 'd1' · WHERE id = 123 AND revision = 8 AND status = 'PENDING';",
                10,
                c.textPrimary,
                'left',
                500,
            )}

            {label(52, 234, 350, 'Transactional Outbox Pattern:', 11, greenTone, 'left', 700)}
            {label(
                52,
                252,
                350,
                'Commits decision and writes Kafka event in the same ACID transaction to guarantee at-least-once downstream delivery.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Panel: Concurrency & Idempotency Outcomes */}
            {label(
                452,
                82,
                350,
                '2. CONCURRENCY & IDEMPOTENCY HANDLING',
                11,
                greenTone,
                'left',
                700,
            )}

            {label(452, 106, 350, 'Outcome A: Stale Revision Rejection', 12, warmTone, 'left', 700)}
            {label(
                452,
                124,
                350,
                'Concurrent edit to revision 9 makes CAS update 0 rows; stale verdict drops and revision 9 triggers a fresh scan.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                174,
                350,
                'Outcome B: Idempotent Delivery Replay',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                452,
                192,
                350,
                'Network retries delivering decision_id "d1" find existing matching record. Returns HTTP 200 OK without re-executing enforcement actions or duplicating audit logs.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(452, 246, 350, 'Outcome C: Conflicting Decision Trap', 12, redTone, 'left', 700)}
            {label(
                452,
                264,
                350,
                'If a replayed message with decision_id "d1" asserts ALLOW when record is BLOCKED, the system rejects it as an integrity violation.',
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
                'Distributed State & Consistency Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. CAS version checks avoid lock contention. · 2. Classifiers cannot auto-revert BLOCKED items. · 3. Hash-chain append-only logs.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
