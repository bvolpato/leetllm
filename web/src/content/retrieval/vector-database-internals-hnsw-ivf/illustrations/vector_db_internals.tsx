import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    FlowArrow,
    GraphDiagram,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 680
export const height = 760
export const preset = 'engineering'
export const alt =
    'Two constructed index mechanisms narrow a query’s scoring work. In HNSW, a search follows graph links from an entry through closer neighbors and expands a base-layer neighborhood. In IVF, query q at x=4.9 lies in List 0, whose members are v0, v1, and v2; List 1 contains v3 and v4. Both methods send only their candidate pool to the same metric-scoring and top-k step.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    labelWidth: number,
    fontSize = 24,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 650,
) {
    return (
        <CanvasItem x={x} y={y} width={labelWidth} height={Math.ceil(fontSize * 1.45)}>
            <TextLabel
                c={c}
                text={text}
                width="100%"
                fontSize={fontSize}
                fontWeight={weight}
                color={color}
                align={align}
            />
        </CanvasItem>
    )
}

const illustration = defineIllustration((colors) => {
    const c = { ...colors, shadow: 'transparent' }
    const graph = getReadableToneColor('purple', c)
    const partition = getReadableToneColor('blue', c)
    const exact = getReadableToneColor('green', c)
    const boundary = getReadableToneColor('critical', c)
    const query = getReadableToneColor('cyan', c)

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                {label(
                    c,
                    'An index narrows which vectors get scored',
                    22,
                    12,
                    636,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'Same ranking goal; different candidate paths.',
                    22,
                    54,
                    636,
                    23,
                    c.textSecondary,
                )}

                {label(c, 'HNSW · follow graph neighbors', 24, 104, 632, 25, graph, 'left', 800)}
                <CanvasItem x={24} y={142} width={632} height={200}>
                    <GraphDiagram
                        c={c}
                        width={632}
                        height={200}
                        layout="manual"
                        nodeWidth={126}
                        nodeHeight={66}
                        labelFontSize={24}
                        arrowSize={5}
                        padding={18}
                        nodes={[
                            { id: 'entry', label: 'entry v₇', x: 0.12, y: 0.5, tone: 'neutral' },
                            { id: 'hop', label: 'v₄', x: 0.42, y: 0.5, tone: 'purple' },
                            { id: 'near', label: 'v₆', x: 0.7, y: 0.5, tone: 'purple' },
                            { id: 'branch-a', label: 'v₈', x: 0.92, y: 0.24, tone: 'green' },
                            { id: 'branch-b', label: 'v₃', x: 0.92, y: 0.76, tone: 'green' },
                        ]}
                        edges={[
                            { from: 'entry', to: 'hop', tone: 'purple' },
                            { from: 'hop', to: 'near', tone: 'purple' },
                            { from: 'near', to: 'branch-a', tone: 'green' },
                            { from: 'near', to: 'branch-b', tone: 'green' },
                        ]}
                        ariaLabel="Constructed HNSW graph: search follows links from an entry through closer neighbors, then expands two layer-zero neighbors."
                    />
                </CanvasItem>
                {label(
                    c,
                    'Upper layers guide; layer 0 explores neighbors.',
                    24,
                    346,
                    632,
                    23,
                    c.textSecondary,
                )}

                {label(
                    c,
                    'IVF · choose a partition, then scan its list',
                    24,
                    396,
                    632,
                    25,
                    partition,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'One-dimensional partition view · boundary x = 5',
                    24,
                    432,
                    632,
                    22,
                    c.textSecondary,
                )}
                <CanvasItem x={34} y={462} width={612} height={116}>
                    <AxisPlot
                        c={c}
                        width={612}
                        height={116}
                        xMin={-0.5}
                        xMax={10.5}
                        yMin={-1}
                        yMax={1}
                        padding={0}
                        showFrame={false}
                        showAxes={false}
                        showGrid={false}
                        paths={[
                            {
                                points: [
                                    { x: 0, y: 0 },
                                    { x: 10, y: 0 },
                                ],
                                tone: 'neutral',
                                strokeWidth: 3,
                            },
                            {
                                points: [
                                    { x: 5, y: -0.82 },
                                    { x: 5, y: 0.82 },
                                ],
                                color: boundary,
                                strokeWidth: 3,
                                dashed: true,
                            },
                        ]}
                        points={[
                            { x: 0, y: 0, tone: 'purple', r: 9, stroke: c.bg, strokeWidth: 2 },
                            { x: 4.9, y: 0, fill: query, r: 8, stroke: c.bg, strokeWidth: 2 },
                            { x: 10, y: 0, tone: 'warm', r: 9, stroke: c.bg, strokeWidth: 2 },
                        ]}
                    />
                </CanvasItem>
                {label(c, 'C₀', 28, 575, 68, 22, graph, 'center', 750)}
                {label(c, 'q = 4.9 · boundary x = 5', 184, 575, 312, 22, query, 'center', 750)}
                {label(c, 'C₁', 580, 575, 68, 22, partition, 'center', 750)}

                {label(c, 'List 0 · v₀  v₁  v₂', 24, 616, 302, 24, graph, 'center', 750)}
                {label(c, 'List 1 · v₃  v₄', 354, 616, 302, 24, partition, 'center', 750)}
                {label(c, 'Candidate pool', 26, 684, 226, 25, c.textPrimary, 'center', 750)}
                <CanvasItem x={266} y={676} width={54} height={42}>
                    <FlowArrow c={c} direction="right" length={42} tone="neutral" />
                </CanvasItem>
                {label(c, 'exact metric scores → top-k', 332, 684, 324, 25, exact, 'center', 750)}
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
