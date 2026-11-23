import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { GraphDiagramEdge, GraphDiagramNode, ThemeColors } from 'vizmatic'

export const width = 820
export const height = 420
export const alt =
    'A message about being charged twice receives a billing probability of 0.71. A threshold of 0.55 separates automatic routing from human review. The model prediction is computed before the routing decision.'

const nodes: GraphDiagramNode[] = [
    { id: 'in', x: 0.13, y: 0.5, label: 'Message', detail: 'charged twice', tone: 'blue' },
    { id: 'ml', x: 0.46, y: 0.5, label: 'Model score', detail: 'billing: 0.71', tone: 'purple' },
    { id: 'auto', x: 0.84, y: 0.24, label: 'Automatic', detail: 'score ≥ 0.55', tone: 'green' },
    { id: 'review', x: 0.84, y: 0.76, label: 'Review', detail: 'score < 0.55', tone: 'warm' },
]

const edges: GraphDiagramEdge[] = [
    { from: 'in', to: 'ml', fromSide: 'right', toSide: 'left', tone: 'blue' },
    { from: 'ml', to: 'auto', fromSide: 'right', toSide: 'left', tone: 'green' },
    {
        from: 'ml',
        to: 'review',
        fromSide: 'bottom',
        toSide: 'left',
        tone: 'warm',
        dashed: true,
    },
]

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.0)
    return (
        <Scene c={c} padding={14} gap={0}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                width={792}
                height={392}
                layout="manual"
                padding={18}
                nodeWidth={176}
                nodeHeight={84}
                arrowSize={5}
                labelFontSize={22}
                detailFontSize={20}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
