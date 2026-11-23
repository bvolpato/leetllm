import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { GraphDiagramEdge, GraphDiagramNode, ThemeColors } from 'vizmatic'

export const width = 960
export const height = 520
export const alt =
    'Food instructions and review text feed a model. The model produces a candidate answer. Application checks receive the candidate and the original review to compare IDs, allowed labels, and exact evidence quotes.'

const nodes: GraphDiagramNode[] = [
    {
        id: 'rules',
        x: 0.1,
        y: 0.15,
        label: 'Food rubric',
        detail: 'task instructions',
        tone: 'blue',
    },
    { id: 'review', x: 0.1, y: 0.85, label: 'Original review', detail: 'id + text', tone: 'warm' },
    { id: 'model', x: 0.53, y: 0.15, label: 'Model', detail: 'generate answer', tone: 'purple' },
    {
        id: 'candidate',
        x: 0.9,
        y: 0.15,
        label: 'Candidate',
        detail: 'JSON response',
        tone: 'purple',
    },
    {
        id: 'check',
        x: 0.53,
        y: 0.85,
        label: 'App checks',
        detail: 'id · label · quote',
        tone: 'green',
    },
]
const edges: GraphDiagramEdge[] = [
    { from: 'rules', to: 'model', fromSide: 'right', toSide: 'left', tone: 'blue' },
    { from: 'review', to: 'model', fromSide: 'top', toSide: 'bottom', tone: 'warm' },
    { from: 'model', to: 'candidate', fromSide: 'right', toSide: 'left', tone: 'purple' },
    {
        from: 'review',
        to: 'check',
        fromSide: 'right',
        toSide: 'left',
        tone: 'warm',
        label: 'original',
    },
    {
        from: 'candidate',
        to: 'check',
        fromSide: 'bottom',
        toSide: 'right',
        tone: 'purple',
        label: 'compare',
    },
]
const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.8)
    return (
        <Scene c={c} padding={20} gap={0}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                width={920}
                height={480}
                layout="manual"
                padding={16}
                nodeWidth={190}
                nodeHeight={76}
                arrowSize={7}
                labelFontSize={22}
                detailFontSize={18}
            />
        </Scene>
    )
})
export const create = illustration.create
export default illustration.default
