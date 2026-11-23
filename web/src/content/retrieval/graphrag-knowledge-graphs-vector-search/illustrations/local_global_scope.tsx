import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 520
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'Local search ranks mixed graph and text candidates for one entity question, then packs the relationship scored 0.98 and 30 tokens with the text unit scored 0.91 and 55 tokens within a 90-token budget. Global search groups community reports into batches, maps each batch to report-level points, and reduces into top thematic findings.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const local = getReadableToneColor('blue', c, c.bg)
    const selected = getReadableToneColor('green', c, c.bg)
    const limited = getReadableToneColor('warm', c, c.bg)
    const structural = getReadableToneColor('neutral', c, c.bg)
    const global = getReadableToneColor('purple', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 20,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
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
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Panel backgrounds */}
                    <SvgFrame
                        c={c}
                        x={20}
                        y={70}
                        width={395}
                        height={400}
                        rx={10}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.2}
                    />
                    <SvgFrame
                        c={c}
                        x={445}
                        y={70}
                        width={395}
                        height={400}
                        rx={10}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.2}
                    />

                    {/* Local search cards */}
                    <SvgFrame
                        c={c}
                        x={36}
                        y={150}
                        width={363}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={selected}
                        strokeWidth={1.4}
                    />
                    <SvgFrame
                        c={c}
                        x={36}
                        y={212}
                        width={363}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={selected}
                        strokeWidth={1.4}
                    />
                    <SvgFrame
                        c={c}
                        x={36}
                        y={274}
                        width={363}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={limited}
                        strokeWidth={1.4}
                    />

                    {/* Global search batch containers */}
                    <rect
                        x={460}
                        y={150}
                        width={175}
                        height={60}
                        rx={6}
                        fill="none"
                        stroke={structural}
                        strokeWidth={1.2}
                        strokeDasharray="4 4"
                    />
                    <rect
                        x={650}
                        y={150}
                        width={175}
                        height={60}
                        rx={6}
                        fill="none"
                        stroke={structural}
                        strokeWidth={1.2}
                        strokeDasharray="4 4"
                    />

                    {/* Map step box */}
                    <SvgFrame
                        c={c}
                        x={530}
                        y={250}
                        width={225}
                        height={58}
                        rx={8}
                        fill={c.bgCardAlt}
                        stroke={global}
                        strokeWidth={1.6}
                    />

                    {/* Reduce step box */}
                    <SvgFrame
                        c={c}
                        x={500}
                        y={350}
                        width={285}
                        height={66}
                        rx={8}
                        fill={c.bgCardAlt}
                        stroke={selected}
                        strokeWidth={1.6}
                    />

                    {/* Arrows for Global search */}
                    <VectorArrow
                        x1={547}
                        y1={212}
                        x2={600}
                        y2={248}
                        color={global}
                        strokeWidth={2}
                        arrowSize={4}
                    />
                    <VectorArrow
                        x1={737}
                        y1={212}
                        x2={684}
                        y2={248}
                        color={global}
                        strokeWidth={2}
                        arrowSize={4}
                    />
                    <VectorArrow
                        x1={642}
                        y1={310}
                        x2={642}
                        y2={348}
                        color={selected}
                        strokeWidth={2}
                        arrowSize={4}
                    />
                </svg>
            </CanvasItem>

            {/* Title header */}
            {label(20, 14, 820, 'Two scopes, two context builders', 24, c.textPrimary, 'left', 700)}
            {label(
                20,
                42,
                820,
                'Local ranks a neighborhood · Global reduces community reports',
                17,
                c.textSecondary,
            )}

            {/* Left Panel: Local Search */}
            {label(36, 84, 363, 'LOCAL SEARCH · Entity-focused', 19, local, 'left', 700)}
            {label(
                36,
                114,
                363,
                'Query: inference-api latency · Budget 90 tokens',
                15,
                c.textSecondary,
                'left',
                500,
            )}

            {label(48, 164, 150, 'depends_on · 1842', 16, c.textPrimary, 'left', 600)}
            {label(200, 164, 55, '0.98', 16, selected, 'center', 700)}
            {label(260, 164, 55, '30 tok', 15, c.textSecondary, 'center', 500)}
            {label(320, 164, 65, 'packed', 15, selected, 'right', 700)}

            {label(48, 226, 150, 'maxmemory · 2031', 16, c.textPrimary, 'left', 600)}
            {label(200, 226, 55, '0.91', 16, selected, 'center', 700)}
            {label(260, 226, 55, '55 tok', 15, c.textSecondary, 'center', 500)}
            {label(320, 226, 65, 'packed', 15, selected, 'right', 700)}

            {label(48, 288, 150, 'report · comm-7', 16, c.textPrimary, 'left', 600)}
            {label(200, 288, 55, '0.62', 16, limited, 'center', 700)}
            {label(260, 288, 55, '80 tok', 15, c.textSecondary, 'center', 500)}
            {label(320, 288, 65, 'no room', 15, limited, 'right', 700)}

            {label(
                36,
                344,
                363,
                'Context: 30 + 55 = 85 / 90 tokens used',
                16,
                selected,
                'left',
                700,
            )}
            {label(
                36,
                376,
                363,
                'Entity extraction seeds 2-hop neighborhood expansion',
                14,
                c.textMuted,
                'left',
                500,
            )}

            {/* Right Panel: Global Search */}
            {label(460, 84, 365, 'GLOBAL SEARCH · Corpus-wide themes', 19, global, 'left', 700)}
            {label(
                460,
                114,
                365,
                'Query: recurring latency themes across services',
                15,
                c.textSecondary,
                'left',
                500,
            )}

            {label(465, 158, 165, 'BATCH A', 14, global, 'center', 700)}
            {label(465, 180, 165, 'cache · queue reports', 14, c.textPrimary, 'center', 500)}

            {label(655, 158, 165, 'BATCH B', 14, global, 'center', 700)}
            {label(655, 180, 165, 'eval · config reports', 14, c.textPrimary, 'center', 500)}

            {label(540, 260, 205, 'MAP × 2 BATCHES', 16, global, 'center', 700)}
            {label(
                540,
                282,
                205,
                'intermediate point summaries',
                14,
                c.textSecondary,
                'center',
                500,
            )}

            {label(510, 360, 265, 'REDUCE · TOP THEMATIC FINDINGS', 15, selected, 'center', 700)}
            {label(
                510,
                384,
                265,
                'Cache eviction · Queue wait · Pool config',
                14,
                c.textPrimary,
                'center',
                600,
            )}

            {label(
                460,
                436,
                365,
                'Map-reduce aggregation over hierarchical communities',
                14,
                c.textMuted,
                'center',
                500,
            )}

            {/* Footer */}
            {label(
                20,
                484,
                820,
                'Local search optimizes precision on entity queries · Global search enables corpus-wide synthesis',
                14,
                c.textMuted,
                'center',
                500,
            )}
        </Board>
    )
}

export default create('dark')
