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
    'Architecture of an LLM-powered search engine showing offline document ingestion with cryptographic span hashing, dual lexical and dense index retrieval, and online grounded synthesis. Before citation publication, an authority gate verifies tenant access, document revision freshness, and verbatim claim support, invalidating stale or revoked sources.'

export const numericAnchors = {
    sourceRevisions: ['policy@2', 'exception@1'],
    spanPolicy: '0-80',
    spanException: '0-101',
    hashPrefixPolicy: '91e45d8e',
    hashPrefixException: '0b7226d8',
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
        fontSize = 13,
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
                            id="llm-arr"
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

                    {/* Column 1 Box */}
                    <rect
                        x={44}
                        y={76}
                        width={230}
                        height={180}
                        rx={10}
                        fill={theme === 'dark' ? '#111827' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={52}
                        y={106}
                        width={214}
                        height={64}
                        rx={6}
                        fill={theme === 'dark' ? '#1f2937' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={52}
                        y={178}
                        width={214}
                        height={68}
                        rx={6}
                        fill={theme === 'dark' ? '#1a2744' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />

                    {/* Column 2 Box */}
                    <rect
                        x={314}
                        y={76}
                        width={230}
                        height={180}
                        rx={10}
                        fill={theme === 'dark' ? '#181324' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={322}
                        y={106}
                        width={214}
                        height={64}
                        rx={6}
                        fill={theme === 'dark' ? '#241a35' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={322}
                        y={178}
                        width={214}
                        height={68}
                        rx={6}
                        fill={theme === 'dark' ? '#2e1c44' : '#fdf4ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Column 3 Box */}
                    <rect
                        x={584}
                        y={76}
                        width={232}
                        height={180}
                        rx={10}
                        fill={theme === 'dark' ? '#0f241a' : '#f0fdf4'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={592}
                        y={106}
                        width={216}
                        height={64}
                        rx={6}
                        fill={theme === 'dark' ? '#2d2212' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={592}
                        y={178}
                        width={216}
                        height={68}
                        rx={6}
                        fill={theme === 'dark' ? '#143522' : '#dcfce7'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />

                    {/* Connector lines between columns */}
                    <line
                        x1={274}
                        y1={166}
                        x2={314}
                        y2={166}
                        stroke={c.textMuted}
                        strokeWidth={2}
                        markerEnd="url(#llm-arr)"
                    />
                    <line
                        x1={544}
                        y1={166}
                        x2={584}
                        y2={166}
                        stroke={c.textMuted}
                        strokeWidth={2}
                        markerEnd="url(#llm-arr)"
                    />

                    {/* Published Citations Box */}
                    <rect
                        x={44}
                        y={272}
                        width={772}
                        height={96}
                        rx={10}
                        fill={theme === 'dark' ? '#111f19' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={56}
                        y={300}
                        width={360}
                        height={56}
                        rx={6}
                        fill={theme === 'dark' ? '#182f25' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={432}
                        y={300}
                        width={372}
                        height={56}
                        rx={6}
                        fill={theme === 'dark' ? '#182f25' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Arrow down to citations */}
                    <line
                        x1={700}
                        y1={256}
                        x2={700}
                        y2={272}
                        stroke={greenTone}
                        strokeWidth={2}
                        markerEnd="url(#llm-arr)"
                    />

                    {/* Invalidation Alert Footer */}
                    <rect
                        x={44}
                        y={384}
                        width={772}
                        height={82}
                        rx={10}
                        fill={theme === 'dark' ? '#241a12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Grounded LLM Search Architecture & Evidence Provenance',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Documents travel from ingestion to verified citations through an active authority and freshness gate',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Stage Columns */}
            {/* Column 1: Ingestion & Normalization */}
            {label(44, 84, 230, '1. INGESTION & HASHING', 11, blueTone, 'left', 700)}
            {label(56, 114, 206, 'Source Documents', 13, c.textPrimary, 'left', 600)}
            {label(
                56,
                134,
                206,
                'policy@2 (spans 0-80) · exception@1 (spans 0-101)',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(56, 186, 206, 'Content Addressing', 13, blueTone, 'left', 600)}
            {label(
                56,
                206,
                206,
                'SHA-256 span digests: · 91e45d8e… / 0b7226d8…',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Column 2: Dual Retrieval & Fusion */}
            {label(314, 84, 230, '2. HYBRID RETRIEVAL & FUSION', 11, purpleTone, 'left', 700)}
            {label(326, 114, 206, 'Multi-Index Search', 13, c.textPrimary, 'left', 600)}
            {label(
                326,
                134,
                206,
                'Lexical BM25 + Dense HNSW · Tenant scope: workspace-a',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(326, 186, 206, 'Rerank & Pack', 13, purpleTone, 'left', 600)}
            {label(
                326,
                206,
                206,
                'Cross-encoder scoring · Top-k context window pack',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Column 3: Authority Gate & Synthesis */}
            {label(584, 84, 230, '3. VERIFICATION & CITATION', 11, greenTone, 'left', 700)}
            {label(596, 114, 206, 'Online Authority Gate', 13, warmTone, 'left', 600)}
            {label(
                596,
                134,
                206,
                'Access control re-check · Revision freshness check',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(596, 186, 206, 'Streaming Synthesis', 13, greenTone, 'left', 600)}
            {label(
                596,
                206,
                206,
                'Verbatim span alignment · Exact citation publishing',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Published Citations Card (Bottom Center) */}
            {label(52, 280, 756, 'PUBLISHED CITATION ARTIFACTS', 12, greenTone, 'left', 700)}
            {label(64, 308, 350, 'Citation 1: policy@2 [0-80]', 12, c.textPrimary, 'left', 600)}
            {label(
                64,
                328,
                350,
                'Hash: 91e45d8e... | RBAC: workspace-a authorized',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                440,
                308,
                360,
                'Citation 2: exception@1 [0-101]',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                440,
                328,
                360,
                'Hash: 0b7226d8... | Condition: security approval',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Registry Invalidation Notice (Bottom) */}
            {label(52, 396, 756, 'Freshness Invalidation Guarantee', 12, warmTone, 'left', 700)}
            {label(
                52,
                416,
                756,
                'Cached answers and active streams re-validate document revisions and RBAC grants before surfacing citations.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
