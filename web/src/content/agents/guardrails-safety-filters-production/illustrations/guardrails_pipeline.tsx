import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 660
export const height = 700
export const alt =
    'Pipeline diagram for a deploy request: user input passes screening, the model drafts reply text and a tool proposal, text review holds the premature claim, and the host tool gate blocks execution while approval is absent.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    return Scene({
        c,
        padding: 10,
        gap: 6,
        children: GraphDiagram({
            c,
            width: 628,
            height: 640,
            direction: 'TB',
            nodeWidth: 268,
            nodeHeight: 64,
            labelFontSize: 21,
            detailFontSize: 20,
            arrowSize: 6,
            padding: 8,
            nodeGap: 28,
            rankGap: 22,
            routing: 'dagre',
            nodes: [
                {
                    id: 'req',
                    label: '1. Input Screen',
                    detail: 'Req B passes screen',
                    tone: 'blue',
                    icon: 'firewall',
                },
                {
                    id: 'model',
                    label: '2. Model Draft',
                    detail: 'Text claim + deploy call',
                    tone: 'purple',
                    icon: 'agent',
                },
                {
                    id: 'text_gate',
                    label: '3a. Output Text Gate',
                    detail: 'HELD: premature claim',
                    tone: 'warm',
                    icon: 'warning',
                },
                {
                    id: 'tool_gate',
                    label: '3b. Tool Action Gate',
                    detail: 'Schema, actor, approval',
                    tone: 'warm',
                    icon: 'lock',
                },
                {
                    id: 'release',
                    label: '4a. User Channel',
                    detail: 'Safe status reply',
                    tone: 'neutral',
                    icon: 'user',
                },
                {
                    id: 'exec',
                    label: '4b. Prod Executor',
                    detail: 'BLOCKED: no approval',
                    tone: 'critical',
                    icon: 'server',
                },
            ],
            edges: [
                { from: 'req', to: 'model', tone: 'blue' },
                { from: 'model', to: 'text_gate', label: 'text', tone: 'warm' },
                { from: 'model', to: 'tool_gate', label: 'tool', tone: 'warm' },
                { from: 'text_gate', to: 'release', tone: 'neutral' },
                {
                    from: 'tool_gate',
                    to: 'exec',
                    label: 'missing row',
                    tone: 'critical',
                    dashed: true,
                },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
