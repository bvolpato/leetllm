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
    'Query routing and evidence aggregation architecture across static index and live API backends under authenticated workspace scope. Policy queries dispatch to authorized hybrid search, real-time operational status queries dispatch to live APIs, and composite queries fan out to both before unified access and temporal applicability validation.'

export const numericAnchors = {
    workspace: 'workspace-a',
    routes: ['authorized_hybrid_search', 'authorized_live_api'],
    policyQuery: 'Latest parser-v2 migration policy',
    liveQuery: 'Is build-1042 running right now?',
    compositeQuery: 'Build-1042 status and current migration policy',
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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <marker
                            id="route-arr"
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

                    {/* Query Cards */}
                    <rect
                        x={40}
                        y={104}
                        width={248}
                        height={74}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={300}
                        y={104}
                        width={248}
                        height={74}
                        rx={8}
                        fill={theme === 'dark' ? '#271f14' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={560}
                        y={104}
                        width={260}
                        height={74}
                        rx={8}
                        fill={theme === 'dark' ? '#24152e' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Backend Boxes */}
                    <rect
                        x={40}
                        y={218}
                        width={370}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#111827' : '#ffffff'}
                        stroke={blueTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={450}
                        y={218}
                        width={370}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#111827' : '#ffffff'}
                        stroke={warmTone}
                        strokeWidth={1.5}
                    />

                    {/* Connecting arrows from queries to backends */}
                    <line
                        x1={164}
                        y1={178}
                        x2={164}
                        y2={218}
                        stroke={blueTone}
                        strokeWidth={1.5}
                        markerEnd="url(#route-arr)"
                    />
                    <line
                        x1={424}
                        y1={178}
                        x2={520}
                        y2={218}
                        stroke={warmTone}
                        strokeWidth={1.5}
                        markerEnd="url(#route-arr)"
                    />
                    <line
                        x1={690}
                        y1={178}
                        x2={350}
                        y2={218}
                        stroke={purpleTone}
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                        markerEnd="url(#route-arr)"
                    />
                    <line
                        x1={690}
                        y1={178}
                        x2={690}
                        y2={218}
                        stroke={purpleTone}
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                        markerEnd="url(#route-arr)"
                    />

                    {/* Fusion Container */}
                    <rect
                        x={40}
                        y={332}
                        width={780}
                        height={68}
                        rx={8}
                        fill={theme === 'dark' ? '#102419' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />

                    {/* Arrows to Fusion Container */}
                    <line
                        x1={225}
                        y1={294}
                        x2={225}
                        y2={332}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        markerEnd="url(#route-arr)"
                    />
                    <line
                        x1={635}
                        y1={294}
                        x2={635}
                        y2={332}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        markerEnd="url(#route-arr)"
                    />

                    {/* Footer Guardrail Box */}
                    <rect
                        x={40}
                        y={418}
                        width={780}
                        height={52}
                        rx={8}
                        fill={theme === 'dark' ? '#161424' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Query Intent Routing & Multi-Source Evidence Fusion',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Queries route dynamically to index search or live APIs while preserving tenant isolation and revision freshness',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Query Classification Layer */}
            {label(
                40,
                84,
                780,
                'QUERY CLASSIFICATION & INTENT ROUTING (WORKSPACE-A SCOPE)',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* Query 1: Policy */}
            {label(52, 114, 230, 'Policy / Historical Query', 12, blueTone, 'left', 600)}
            {label(52, 132, 230, '"Latest parser-v2 policy"', 11, c.textPrimary, 'left', 500)}
            {label(52, 150, 230, 'Route: authorized_hybrid_search', 10, c.textMuted, 'left', 400)}

            {/* Query 2: Real-time Live */}
            {label(312, 114, 230, 'Live Operational Status', 12, warmTone, 'left', 600)}
            {label(312, 132, 230, '"Is build-1042 running?"', 11, c.textPrimary, 'left', 500)}
            {label(312, 150, 230, 'Route: authorized_live_api', 10, c.textMuted, 'left', 400)}

            {/* Query 3: Composite */}
            {label(572, 114, 230, 'Compound Composite Query', 12, purpleTone, 'left', 600)}
            {label(572, 132, 230, '"Status + migration policy"', 11, c.textPrimary, 'left', 500)}
            {label(572, 150, 230, 'Fanout: hybrid_search + live_api', 10, c.textMuted, 'left', 400)}

            {/* Execution Backends */}
            {label(40, 200, 370, 'ROUTE 1: AUTHORIZED HYBRID SEARCH', 11, blueTone, 'left', 700)}
            {label(
                52,
                226,
                350,
                'Lexical BM25 & Dense HNSW Retrieval',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                246,
                350,
                'Extracts versioned policy documents; requires current_revision=True',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(450, 200, 370, 'ROUTE 2: AUTHORIZED LIVE APIS', 11, warmTone, 'left', 700)}
            {label(
                462,
                226,
                350,
                'Real-time Build & Orchestration Engine',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                462,
                246,
                350,
                'Polls build-1042 state with source-time freshness validation',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Fusion & Access Gate */}
            {label(
                40,
                316,
                780,
                'UNIFIED EVIDENCE FUSION & APPLICABILITY VALIDATION',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                342,
                756,
                'Normalized Evidence Bundle (Revision + Source Timestamp)',
                13,
                greenTone,
                'left',
                600,
            )}
            {label(
                52,
                362,
                756,
                'Joins indexed policy spans (policy@2:0-80) with live build state after verifying RBAC permissions and freshness.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(52, 428, 756, 'Tenant Scope Invariance', 12, purpleTone, 'left', 700)}
            {label(
                52,
                448,
                756,
                'Client input cannot specify arbitrary tenant scopes or bypass document access policies. Both branches execute under cryptographically verified server-derived tokens.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
