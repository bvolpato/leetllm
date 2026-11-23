import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 660
export const height = 680
export const alt =
    'Diagram showing trusted system policy, user prompt, and untrusted retrieved document converging into one causal attention buffer before causing direct or indirect tool hijacks.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    return Scene({
        c,
        padding: 16,
        gap: 10,
        children: GraphDiagram({
            c,
            width: 628,
            height: 640,
            direction: 'TB',
            nodeWidth: 196,
            nodeHeight: 86,
            labelFontSize: 22,
            detailFontSize: 20,
            arrowSize: 6,
            padding: 10,
            nodeGap: 16,
            rankGap: 52,
            routing: 'orthogonal',
            nodes: [
                {
                    id: 'sys',
                    label: 'System policy',
                    detail: 'trusted rules',
                    tone: 'green',
                    icon: 'lock',
                },
                {
                    id: 'user',
                    label: 'User prompt',
                    detail: 'direct channel',
                    tone: 'blue',
                    icon: 'user',
                },
                {
                    id: 'rag',
                    label: 'Retrieved text',
                    detail: 'hidden directive',
                    tone: 'critical',
                    icon: 'file',
                },
                {
                    id: 'ctx',
                    label: 'Unified token buffer',
                    detail: 'instructions and data share self-attention',
                    tone: 'purple',
                    icon: 'layers',
                    width: 440,
                },
                {
                    id: 'direct',
                    label: 'Direct hijack',
                    detail: 'user steers policy',
                    tone: 'warm',
                    icon: 'warning',
                    width: 220,
                },
                {
                    id: 'indirect',
                    label: 'Indirect hijack',
                    detail: 'doc triggers tool call',
                    tone: 'critical',
                    icon: 'tool',
                    width: 220,
                },
            ],
            edges: [
                { from: 'sys', to: 'ctx', tone: 'green' },
                { from: 'user', to: 'ctx', tone: 'blue' },
                { from: 'rag', to: 'ctx', tone: 'critical', emphasis: true },
                { from: 'ctx', to: 'direct', label: 'override', tone: 'warm' },
                {
                    from: 'ctx',
                    to: 'indirect',
                    label: 'exfil tool',
                    tone: 'critical',
                    emphasis: true,
                },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
