import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { GraphDiagramEdge, GraphDiagramNode, ThemeColors } from 'vizmatic'

export const width = 840
export const height = 600
export const alt =
    'Streaming SSE client state machine: response.created opens an empty draft, text deltas measure TTFT and accumulate buffered preview text, an EOF or error leaves a failed partial draft, whereas response.completed sends the full response through Pydantic schema and KB citation validation.'

const nodes: GraphDiagramNode[] = [
    { id: 'open', x: 0.14, y: 0.2, label: '1. Created', detail: 'buffer = 0', tone: 'blue' },
    { id: 'delta', x: 0.5, y: 0.2, label: '2. Deltas', detail: 'TTFT track', tone: 'purple' },
    { id: 'done', x: 0.86, y: 0.2, label: '3a. Done', detail: 'stop event', tone: 'green' },
    { id: 'eof', x: 0.5, y: 0.8, label: '3b. Drop', detail: 'failed draft', tone: 'critical' },
    { id: 'gate', x: 0.86, y: 0.8, label: '4. Checked', detail: 'Pydantic OK', tone: 'green' },
]

const edges: GraphDiagramEdge[] = [
    { from: 'open', to: 'delta', fromSide: 'right', toSide: 'left', label: 'sse', tone: 'blue' },
    { from: 'delta', to: 'done', fromSide: 'right', toSide: 'left', label: 'term', tone: 'green' },
    {
        from: 'delta',
        to: 'eof',
        fromSide: 'bottom',
        toSide: 'top',
        label: 'eof',
        tone: 'critical',
        dashed: true,
    },
    { from: 'done', to: 'gate', fromSide: 'bottom', toSide: 'top', label: 'parse', tone: 'green' },
]

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.45)
    return (
        <Scene c={c} padding={12} gap={0}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                width={816}
                height={576}
                nodeWidth={142}
                nodeHeight={54}
                arrowSize={7}
                labelFontSize={23}
                detailFontSize={20}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
