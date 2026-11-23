import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { GraphDiagramEdge, GraphDiagramNode, ThemeColors } from 'vizmatic'

export const width = 840
export const height = 600
export const alt =
    'Server-side LLM wrapper architecture: Client UI sends validated ticket text to an API Wrapper holding the secret key and latency budget, calls the Hosted LLM with strict JSON schema, validates output structure and evidence IDs at Schema Gate, runs an idempotent queue write, and records a redacted telemetry span.'

const nodes: GraphDiagramNode[] = [
    { id: 'client', x: 0.15, y: 0.2, label: 'Client UI', detail: 'session token', tone: 'blue' },
    { id: 'proxy', x: 0.5, y: 0.2, label: 'API Wrapper', detail: 'key + budget', tone: 'purple' },
    { id: 'llm', x: 0.85, y: 0.2, label: 'Hosted LLM', detail: 'json_schema', tone: 'warm' },
    { id: 'gate', x: 0.85, y: 0.8, label: 'Schema Gate', detail: 'Pydantic + KB', tone: 'green' },
    { id: 'action', x: 0.5, y: 0.8, label: 'Queue Write', detail: 'idempotent key', tone: 'blue' },
    { id: 'obs', x: 0.15, y: 0.8, label: 'OTel Trace', detail: 'tokens + HMAC', tone: 'neutral' },
]

const edges: GraphDiagramEdge[] = [
    { from: 'client', to: 'proxy', fromSide: 'right', toSide: 'left', label: 'auth', tone: 'blue' },
    { from: 'proxy', to: 'llm', fromSide: 'right', toSide: 'left', label: '20s', tone: 'warm' },
    { from: 'llm', to: 'gate', fromSide: 'bottom', toSide: 'top', label: 'json', tone: 'green' },
    { from: 'gate', to: 'action', fromSide: 'left', toSide: 'right', label: 'ok', tone: 'green' },
    {
        from: 'action',
        to: 'obs',
        fromSide: 'left',
        toSide: 'right',
        label: 'span',
        tone: 'neutral',
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
                nodeWidth={138}
                nodeHeight={56}
                arrowSize={7}
                labelFontSize={23}
                detailFontSize={20}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
