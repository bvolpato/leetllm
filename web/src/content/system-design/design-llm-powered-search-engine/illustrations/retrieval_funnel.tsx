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
    'Comparison between post-filtering and pre-filtering in search retrieval. Post-filtering (top-k then eligibility) fills top-2 slots with an unauthorized document from workspace-b and an obsolete policy revision, rejecting both and leaving zero usable passages. Pre-filtering (eligibility then top-k) enforces tenant RBAC and revision freshness first, capturing current policy revision 2 and exception revision 1 into both slots.'

export const numericAnchors = {
    documents: [
        { id: 'roadmap@1', tenant: 'workspace-b', status: 'forbidden' },
        { id: 'policy@1', tenant: 'workspace-a', status: 'obsolete' },
        { id: 'policy@2', tenant: 'workspace-a', status: 'current' },
        { id: 'exception@1', tenant: 'workspace-a', status: 'current' },
    ],
    postFilterUsablePassages: 0,
    preFilterUsablePassages: 2,
    slots: 2,
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
                    <defs>
                        <marker
                            id="funnel-arr"
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

                    {/* Left Column Box (Red Border) */}
                    <rect
                        x={40}
                        y={76}
                        width={370}
                        height={290}
                        rx={10}
                        fill={theme === 'dark' ? '#181214' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    {/* Left Step 1 card */}
                    <rect
                        x={48}
                        y={106}
                        width={354}
                        height={54}
                        rx={6}
                        fill={theme === 'dark' ? '#241417' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    {/* Left Step 2 card */}
                    <rect
                        x={48}
                        y={176}
                        width={354}
                        height={64}
                        rx={6}
                        fill={theme === 'dark' ? '#33161a' : '#fee2e2'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    {/* Left Step 3 result card */}
                    <rect
                        x={48}
                        y={268}
                        width={354}
                        height={64}
                        rx={6}
                        fill={theme === 'dark' ? '#3d1217' : '#fecaca'}
                        stroke={redTone}
                        strokeWidth={1.5}
                    />

                    {/* Left Internal arrows */}
                    <line
                        x1={225}
                        y1={160}
                        x2={225}
                        y2={176}
                        stroke={redTone}
                        strokeWidth={1.5}
                        markerEnd="url(#funnel-arr)"
                    />
                    <line
                        x1={225}
                        y1={240}
                        x2={225}
                        y2={268}
                        stroke={redTone}
                        strokeWidth={1.5}
                        markerEnd="url(#funnel-arr)"
                    />

                    {/* Right Column Box (Green Border) */}
                    <rect
                        x={450}
                        y={76}
                        width={370}
                        height={290}
                        rx={10}
                        fill={theme === 'dark' ? '#101d16' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    {/* Right Step 1 card */}
                    <rect
                        x={458}
                        y={106}
                        width={354}
                        height={54}
                        rx={6}
                        fill={theme === 'dark' ? '#162b1f' : '#ffffff'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    {/* Right Step 2 card */}
                    <rect
                        x={458}
                        y={176}
                        width={354}
                        height={64}
                        rx={6}
                        fill={theme === 'dark' ? '#1b3827' : '#dcfce7'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    {/* Right Step 3 result card */}
                    <rect
                        x={458}
                        y={268}
                        width={354}
                        height={64}
                        rx={6}
                        fill={theme === 'dark' ? '#134024' : '#bbf7d0'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />

                    {/* Right Internal arrows */}
                    <line
                        x1={635}
                        y1={160}
                        x2={635}
                        y2={176}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        markerEnd="url(#funnel-arr)"
                    />
                    <line
                        x1={635}
                        y1={240}
                        x2={635}
                        y2={268}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        markerEnd="url(#funnel-arr)"
                    />

                    {/* Bottom Takeaway Card */}
                    <rect
                        x={40}
                        y={386}
                        width={780}
                        height={74}
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
                'Retrieval Filtering Strategy: Pre-Filter vs Post-Filter Failure',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Applying security and freshness checks after Top-K selection causes context starvation when high-scoring items fail policy',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Column: Post-filtering (Failure) */}
            {label(
                40,
                84,
                370,
                'ANTIPATTERN: TOP-K THEN ELIGIBILITY (POST-FILTER)',
                11,
                redTone,
                'left',
                700,
            )}

            {/* Step 1 Left */}
            {label(52, 114, 350, '1. Raw Top-2 Score Selection', 12, c.textPrimary, 'left', 600)}
            {label(52, 132, 170, '#1: roadmap@1 (high score)', 11, c.textMuted, 'left', 400)}
            {label(228, 132, 170, '#2: policy@1 (high score)', 11, c.textMuted, 'left', 400)}

            {/* Step 2 Left: Evaluation */}
            {label(52, 186, 350, '2. Late Eligibility Check', 12, redTone, 'left', 600)}
            {label(52, 206, 170, 'REJECT: Foreign tenant', 11, redTone, 'left', 500)}
            {label(228, 206, 170, 'REJECT: Stale revision', 11, redTone, 'left', 500)}

            {/* Step 3 Left: Output */}
            {label(
                52,
                278,
                350,
                '3. Prompt Context Ingress: 0 Usable Passages',
                13,
                redTone,
                'left',
                700,
            )}
            {label(
                52,
                300,
                350,
                'Both slots rejected. Generator receives empty context.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Column: Pre-filtering (Success) */}
            {label(
                450,
                84,
                370,
                'CORRECT: ELIGIBILITY THEN TOP-K (PRE-FILTER)',
                11,
                greenTone,
                'left',
                700,
            )}

            {/* Step 1 Right */}
            {label(
                462,
                114,
                350,
                '1. Index RBAC & Revision Partitioning',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(462, 132, 170, 'Drop foreign tenants', 11, greenTone, 'left', 500)}
            {label(638, 132, 170, 'Drop stale revisions', 11, greenTone, 'left', 500)}

            {/* Step 2 Right: Top-K on Eligible Candidates */}
            {label(
                462,
                186,
                350,
                '2. Top-2 Ranked Among Authorized Set',
                12,
                greenTone,
                'left',
                600,
            )}
            {label(462, 206, 170, '#1: policy@2 (current)', 11, greenTone, 'left', 500)}
            {label(638, 206, 170, '#2: exception@1 (current)', 11, greenTone, 'left', 500)}

            {/* Step 3 Right: Output */}
            {label(
                462,
                278,
                350,
                '3. Prompt Context Ingress: 2 Usable Passages',
                13,
                greenTone,
                'left',
                700,
            )}
            {label(
                462,
                300,
                350,
                'Both slots filled with verified, current, authorized evidence.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Insight Box */}
            {label(
                52,
                400,
                756,
                'Architecture Principle: Query-Time Filter Pushdown',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                420,
                756,
                'Push tenant and revision predicates into index scans (pre-filtering) to prevent top-K context starvation and leaks.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
