import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { GraphDiagramEdge, GraphDiagramNode, ThemeColors } from 'vizmatic'

export const width = 840
export const height = 600
export const alt =
    'Three-state circuit breaker transitions: Closed serves primary traffic until k errors trip Open, Open directs traffic to Fallback during cooldown, cooldown transitions to Half-Open with one canary probe, a healthy probe restores Closed, and a failed probe routes back to Fallback and Open.'

const nodes: GraphDiagramNode[] = [
    { id: 'closed', x: 0.16, y: 0.5, label: 'Closed', detail: 'primary live', tone: 'green' },
    { id: 'open', x: 0.5, y: 0.2, label: 'Open', detail: 'primary halted', tone: 'critical' },
    { id: 'fb', x: 0.84, y: 0.5, label: 'Fallback', detail: 'secondary LLM', tone: 'warm' },
    { id: 'half', x: 0.5, y: 0.8, label: 'Half-Open', detail: '1 canary probe', tone: 'purple' },
]

const edges: GraphDiagramEdge[] = [
    {
        from: 'closed',
        to: 'open',
        fromSide: 'top',
        toSide: 'left',
        label: 'k errs',
        tone: 'critical',
    },
    { from: 'open', to: 'fb', fromSide: 'right', toSide: 'top', label: 'block', tone: 'warm' },
    {
        from: 'open',
        to: 'half',
        fromSide: 'bottom',
        toSide: 'top',
        label: 'cooldown',
        tone: 'purple',
    },
    {
        from: 'half',
        to: 'closed',
        fromSide: 'left',
        toSide: 'bottom',
        label: 'probe ok',
        tone: 'green',
    },
    {
        from: 'half',
        to: 'fb',
        fromSide: 'right',
        toSide: 'bottom',
        label: 'fail',
        tone: 'critical',
        dashed: true,
    },
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
