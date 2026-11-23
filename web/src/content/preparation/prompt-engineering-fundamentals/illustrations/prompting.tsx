import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { GraphDiagramEdge, GraphDiagramNode, ThemeColors } from 'vizmatic'

export const width = 900
export const height = 630
export const alt =
    'The food clause soup delicious contributes to both food sentiment and overall sentiment. The service clause waiter rude contributes only to overall sentiment. The food label is positive and the overall label is mixed.'

const nodes: GraphDiagramNode[] = [
    { id: 'food', x: 0.23, y: 0.1, label: 'Soup delicious', detail: 'food praise', tone: 'green' },
    {
        id: 'service',
        x: 0.77,
        y: 0.1,
        label: 'Waiter rude',
        detail: 'service criticism',
        tone: 'warm',
    },
    {
        id: 'food-task',
        x: 0.23,
        y: 0.58,
        label: 'Food sentiment',
        detail: 'use food evidence',
        tone: 'blue',
    },
    {
        id: 'overall-task',
        x: 0.77,
        y: 0.58,
        label: 'Overall sentiment',
        detail: 'use both clauses',
        tone: 'purple',
    },
    { id: 'positive', x: 0.23, y: 0.9, label: 'positive', tone: 'green' },
    { id: 'mixed', x: 0.77, y: 0.9, label: 'mixed', tone: 'purple' },
]
const edges: GraphDiagramEdge[] = [
    { from: 'food', to: 'food-task', fromSide: 'bottom', toSide: 'top', tone: 'green' },
    { from: 'food', to: 'overall-task', fromSide: 'right', toSide: 'left', tone: 'green' },
    { from: 'service', to: 'overall-task', fromSide: 'bottom', toSide: 'top', tone: 'warm' },
    { from: 'food-task', to: 'positive', fromSide: 'bottom', toSide: 'top', tone: 'blue' },
    { from: 'overall-task', to: 'mixed', fromSide: 'bottom', toSide: 'top', tone: 'purple' },
]
const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.8)
    return (
        <Scene c={c} padding={20} gap={0}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                width={860}
                height={590}
                layout="manual"
                padding={16}
                nodeWidth={230}
                nodeHeight={74}
                arrowSize={7}
                labelFontSize={23}
                detailFontSize={19}
            />
        </Scene>
    )
})
export const create = illustration.create
export default illustration.default
