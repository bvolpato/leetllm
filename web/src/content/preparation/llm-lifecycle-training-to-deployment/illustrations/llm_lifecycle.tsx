import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { GraphDiagramEdge, GraphDiagramNode, ThemeColors } from 'vizmatic'

export const width = 880
export const height = 620
export const alt =
    'LLM lifecycle architecture separating weight updates from runtime rules: Model Training (Pre and Post-training) and Quantization (PTQ and AWQ) enter the Eval Gate before promotion to Serving, while Runtime Rules (DOC-V2 8192 tokens) enter Serving directly without changing weights.'

const nodes: GraphDiagramNode[] = [
    { id: 'train', x: 0.12, y: 0.21, label: 'Model Training', detail: 'update W', tone: 'purple' },
    { id: 'compress', x: 0.12, y: 0.79, label: 'Compress', detail: 'PTQ / AWQ 4b', tone: 'cyan' },
    { id: 'eval', x: 0.5, y: 0.21, label: 'Eval Gate', detail: 'frozen bundle', tone: 'blue' },
    { id: 'rules', x: 0.5, y: 0.79, label: 'Runtime Rules', detail: 'DOC-V2 8k', tone: 'warm' },
    { id: 'serve', x: 0.88, y: 0.5, label: 'Serving', detail: 'W frozen + KV', tone: 'green' },
]

const edges: GraphDiagramEdge[] = [
    { from: 'train', to: 'eval', fromSide: 'right', toSide: 'left', label: 'ckpt', tone: 'purple' },
    {
        from: 'compress',
        to: 'eval',
        fromSide: 'right',
        toSide: 'bottom',
        label: '4-bit',
        tone: 'cyan',
    },
    { from: 'eval', to: 'serve', fromSide: 'right', toSide: 'top', label: 'pass', tone: 'green' },
    {
        from: 'rules',
        to: 'serve',
        fromSide: 'right',
        toSide: 'bottom',
        label: 'context',
        tone: 'warm',
    },
]

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.55)
    return (
        <Scene c={c} padding={12} gap={0}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                width={856}
                height={596}
                nodeWidth={136}
                nodeHeight={54}
                arrowSize={7}
                labelFontSize={23}
                detailFontSize={21}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
