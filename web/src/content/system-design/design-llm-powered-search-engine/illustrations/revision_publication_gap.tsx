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
    'Freshness invalidation across the ingestion lag gap. When the authoritative registry bumps policy from revision 2 to 3 before the search index re-indexes it, the retrieval gate detects the mismatch, excludes stale revision 2, and withholds publication until current evidence is available.'

export const numericAnchors = {
    initialPolicyRevision: 2,
    updatedPolicyRevision: 3,
    exceptionRevision: 1,
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
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <marker
                            id="gap-arr"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1 L 8 5 L 0 9 z" fill={c.textMuted} />
                        </marker>
                    </defs>

                    {/* Top 3 Phase Cards */}
                    <rect
                        x={40}
                        y={74}
                        width={248}
                        height={146}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={300}
                        y={74}
                        width={248}
                        height={146}
                        rx={8}
                        fill={theme === 'dark' ? '#241b12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={560}
                        y={74}
                        width={260}
                        height={146}
                        rx={8}
                        fill={theme === 'dark' ? '#241417' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1}
                    />

                    {/* Arrows between phases */}
                    <line
                        x1={288}
                        y1={147}
                        x2={300}
                        y2={147}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#gap-arr)"
                    />
                    <line
                        x1={548}
                        y1={147}
                        x2={560}
                        y2={147}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#gap-arr)"
                    />

                    {/* Middle Slot Boxes */}
                    <rect
                        x={40}
                        y={254}
                        width={370}
                        height={100}
                        rx={8}
                        fill={theme === 'dark' ? '#241417' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={450}
                        y={254}
                        width={370}
                        height={100}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />

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
                'Revision Freshness Gap: Ingestion Lag & Authority Invalidation',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Authoritative registries bump document revisions asynchronously; stale index hits must be invalidated before synthesis',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Three Chronological Phases */}
            {/* Phase 1: T1 Synchronized */}
            {label(52, 84, 230, 'PHASE 1: SYNCHRONIZED (T1)', 11, greenTone, 'left', 700)}
            {label(52, 108, 230, 'Registry: policy @ revision 2', 12, c.textPrimary, 'left', 600)}
            {label(52, 128, 230, 'Search Index: policy@2 (Fresh)', 11, greenTone, 'left', 500)}
            {label(
                52,
                150,
                230,
                'Status: ELIGIBLE · Both policy@2 and exception@1 pass verification and publish.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Phase 2: T2 Update in Registry */}
            {label(312, 84, 230, 'PHASE 2: REGISTRY BUMP (T2)', 11, warmTone, 'left', 700)}
            {label(312, 108, 230, 'Registry: policy 2 → revision 3', 12, warmTone, 'left', 600)}
            {label(312, 128, 230, 'Search Index: policy@2 (Lagging)', 11, redTone, 'left', 500)}
            {label(
                312,
                150,
                230,
                'Status: CRAWL LAG · Source database updated; inverted index crawler has not finished indexing @3.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Phase 3: T3 Invalidation Gate */}
            {label(572, 84, 230, 'PHASE 3: PUBLICATION GATE (T3)', 11, redTone, 'left', 700)}
            {label(572, 108, 230, 'Gate Check: rev 2 < required 3', 12, redTone, 'left', 600)}
            {label(572, 128, 230, 'Action: policy@2 WITHHELD', 11, redTone, 'left', 500)}
            {label(
                572,
                150,
                230,
                'Status: INCOMPLETE CONTEXT · Previous answers invalidated. Generator does not emit stale advice.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Middle Section: Slot Availability Comparison */}
            {label(
                40,
                236,
                780,
                'EVIDENCE SLOT OCCUPANCY AT PUBLICATION TIME',
                11,
                c.textMuted,
                'left',
                700,
            )}

            {/* Slot 1: Policy */}
            {label(52, 266, 350, 'Slot 1: Migration Policy', 12, redTone, 'left', 600)}
            {label(
                52,
                286,
                350,
                'Index returned policy@2 → REJECTED (Stale against registry rev 3)',
                11,
                redTone,
                'left',
                500,
            )}
            {label(
                52,
                306,
                350,
                'Slot State: EMPTY (Waiting for ingestion pipeline to surface rev 3)',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Slot 2: Exception */}
            {label(462, 266, 350, 'Slot 2: Security Exception', 12, greenTone, 'left', 600)}
            {label(
                462,
                286,
                350,
                'Index returned exception@1 → ACCEPTED (Matches current registry rev 1)',
                11,
                greenTone,
                'left',
                500,
            )}
            {label(
                462,
                306,
                350,
                'Slot State: FILLED (Intact condition qualifier)',
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
                'Architecture Principle: Decoupled Authority from Index Freshness',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                416,
                756,
                'Indexes lag behind live document updates; online version checks block stale citations during indexing windows.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
