import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 700
export const height = 780
export const alt =
    'Dual-LLM quarantine diagram separating a privileged planner using symbolic variable handles from a toolless quarantined reader storing tainted JSON checked by a deterministic host monitor.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.08)
    return Scene({
        c,
        padding: 10,
        gap: 6,
        children: GraphDiagram({
            c,
            width: 676,
            height: 740,
            direction: 'TB',
            nodeWidth: 286,
            nodeHeight: 50,
            labelFontSize: 21,
            detailFontSize: 20,
            arrowSize: 6,
            padding: 6,
            nodeGap: 34,
            rankGap: 48,
            edgeGap: 18,
            routing: 'dagre',
            nodes: [
                {
                    id: 'doc',
                    label: 'External doc',
                    detail: 'email or web',
                    tone: 'critical',
                    icon: 'globe',
                },
                {
                    id: 'reader',
                    label: 'Quarantined LLM',
                    detail: '0 tools, tainted',
                    tone: 'warm',
                    icon: 'firewall',
                },
                {
                    id: 'user',
                    label: 'Trusted goal',
                    detail: 'user task',
                    tone: 'blue',
                    icon: 'user',
                },
                {
                    id: 'planner',
                    label: 'Privileged LLM',
                    detail: 'plans via $var',
                    tone: 'blue',
                    icon: 'agent',
                },
                {
                    id: 'monitor',
                    label: 'Policy monitor',
                    detail: 'taint + scope',
                    tone: 'green',
                    icon: 'lock',
                },
                {
                    id: 'sink',
                    label: 'Scoped sink',
                    detail: 'scoped calls',
                    tone: 'green',
                    icon: 'tool',
                },
            ],
            edges: [
                { from: 'doc', to: 'reader', label: 'raw data', tone: 'critical', emphasis: true },
                { from: 'user', to: 'planner', label: 'policy', tone: 'blue' },
                {
                    from: 'reader',
                    to: 'monitor',
                    label: 'taint + json',
                    tone: 'warm',
                    dashed: true,
                },
                { from: 'planner', to: 'monitor', label: 'plan ($var)', tone: 'blue' },
                {
                    from: 'monitor',
                    to: 'sink',
                    label: 'allow / deny',
                    tone: 'green',
                    emphasis: true,
                },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
