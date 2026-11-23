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

export const width = 560
export const height = 690
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'For the query inference-api latency SLO, lexical search counts three matching terms in record 3155, two in 1842, and none in 2031, so top-two retrieval selects 3155 and 1842. Following the graph path inference-api to Redis Cache to Old Maxmemory Policy adds 2031. Annotated recall rises from 2/3 to 3/3; evaluate dense retrieval and causal attribution separately.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const lexical = getReadableToneColor('blue', c, c.bg)
    const retrieved = getReadableToneColor('green', c, c.bg)
    const added = getReadableToneColor('purple', c, c.bg)
    const omitted = getReadableToneColor('critical', c, c.bg)
    const muted = getReadableToneColor('neutral', c, c.bg)
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
                    <SvgFrame
                        c={c}
                        x={20}
                        y={130}
                        width={520}
                        height={42}
                        rx={6}
                        fill={c.bgCard}
                        stroke={muted}
                        strokeWidth={1.2}
                    />
                    <SvgFrame
                        c={c}
                        x={20}
                        y={178}
                        width={520}
                        height={42}
                        rx={6}
                        fill={c.bgCard}
                        stroke={muted}
                        strokeWidth={1.2}
                    />
                    <SvgFrame
                        c={c}
                        x={20}
                        y={226}
                        width={520}
                        height={42}
                        rx={6}
                        fill={c.bgCard}
                        stroke={muted}
                        strokeWidth={1.2}
                    />
                    <rect x={122} y={144} width={120} height={12} rx={6} fill={c.border} />
                    <rect x={122} y={144} width={120} height={12} rx={6} fill={lexical} />
                    <rect x={122} y={192} width={120} height={12} rx={6} fill={c.border} />
                    <rect x={122} y={192} width={80} height={12} rx={6} fill={lexical} />
                    <rect x={122} y={240} width={120} height={12} rx={6} fill={c.border} />

                    <line x1={20} y1={288} x2={540} y2={288} stroke={c.border} strokeWidth={1.5} />
                    <SvgFrame
                        c={c}
                        x={8}
                        y={328}
                        width={148}
                        height={64}
                        rx={8}
                        fill={c.bgCard}
                        stroke={lexical}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={206}
                        y={328}
                        width={148}
                        height={64}
                        rx={8}
                        fill={c.bgCard}
                        stroke={retrieved}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={404}
                        y={328}
                        width={148}
                        height={64}
                        rx={8}
                        fill={c.bgCard}
                        stroke={added}
                        strokeWidth={2}
                    />
                    <VectorArrow
                        x1={159}
                        y1={360}
                        x2={201}
                        y2={360}
                        color={retrieved}
                        strokeWidth={2.2}
                        arrowSize={4}
                    />
                    <VectorArrow
                        x1={357}
                        y1={360}
                        x2={399}
                        y2={360}
                        color={added}
                        strokeWidth={2.2}
                        arrowSize={4}
                    />

                    <line x1={20} y1={430} x2={540} y2={430} stroke={c.border} strokeWidth={1.5} />
                    <SvgFrame
                        c={c}
                        x={208}
                        y={530}
                        width={54}
                        height={28}
                        rx={14}
                        fill={retrieved}
                        stroke={retrieved}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={274}
                        y={530}
                        width={54}
                        height={28}
                        rx={14}
                        fill={c.bgCard}
                        stroke={omitted}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={340}
                        y={530}
                        width={54}
                        height={28}
                        rx={14}
                        fill={retrieved}
                        stroke={retrieved}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={208}
                        y={606}
                        width={54}
                        height={28}
                        rx={14}
                        fill={retrieved}
                        stroke={retrieved}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={274}
                        y={606}
                        width={54}
                        height={28}
                        rx={14}
                        fill={retrieved}
                        stroke={retrieved}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={340}
                        y={606}
                        width={54}
                        height={28}
                        rx={14}
                        fill={retrieved}
                        stroke={retrieved}
                        strokeWidth={2}
                    />
                </svg>
            </CanvasItem>

            {label(
                20,
                10,
                520,
                'Graph expansion adds the missed record',
                26,
                c.textPrimary,
                'left',
                700,
            )}
            {label(20, 52, 520, 'Query · inference-api latency SLO', 20, c.textSecondary)}
            {label(
                20,
                93,
                520,
                'Lexical overlap · top two records are retrieved',
                20,
                lexical,
                'left',
                650,
            )}

            {label(28, 137, 84, '3155', 20, c.textPrimary, 'left', 650)}
            {label(252, 137, 112, '3 terms', 20, c.textPrimary, 'left', 600)}
            {label(390, 137, 136, 'in top two', 20, retrieved, 'right', 650)}
            {label(28, 185, 84, '1842', 20, c.textPrimary, 'left', 650)}
            {label(252, 185, 112, '2 terms', 20, c.textPrimary, 'left', 600)}
            {label(390, 185, 136, 'in top two', 20, retrieved, 'right', 650)}
            {label(28, 233, 84, '2031', 20, c.textPrimary, 'left', 650)}
            {label(252, 233, 112, '0 terms', 20, c.textSecondary, 'left', 600)}
            {label(390, 233, 136, 'omitted', 20, omitted, 'right', 650)}

            {label(20, 296, 520, 'Supplied, directed path', 20, c.textSecondary, 'left', 600)}
            {label(12, 341, 140, 'inference-api', 20, c.textPrimary, 'center', 650)}
            {label(210, 341, 140, 'Redis Cache', 20, c.textPrimary, 'center', 650)}
            {label(408, 336, 140, 'maxmemory', 20, c.textPrimary, 'center', 650)}
            {label(408, 362, 140, 'policy', 20, c.textPrimary, 'center', 650)}
            {label(20, 397, 185, 'depends_on · 1842', 20, lexical, 'center', 600)}
            {label(210, 397, 190, 'uses_policy · 2031', 20, added, 'center', 600)}
            {label(
                20,
                439,
                520,
                'Annotated evidence recall · baseline vs graph',
                20,
                c.textPrimary,
                'left',
                650,
            )}
            {label(20, 474, 170, 'Lexical top two', 20, c.textSecondary)}
            {label(20, 572, 170, 'After expansion', 20, c.textSecondary)}
            {label(408, 474, 120, '2 / 3', 20, omitted, 'right', 700)}
            {label(408, 572, 120, '3 / 3', 20, retrieved, 'right', 700)}
            {label(205, 502, 60, '1842', 20, c.textSecondary, 'center', 600)}
            {label(271, 502, 60, '2031', 20, c.textSecondary, 'center', 600)}
            {label(337, 502, 60, '3155', 20, c.textSecondary, 'center', 600)}
            {label(
                20,
                650,
                520,
                'Evaluation view · lexical ranking + graph expansion',
                19,
                c.textSecondary,
            )}
        </Board>
    )
}

export default create('dark')
