import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 780
export const alt =
    'Policy snapshot and rule evaluation diagram: validated JSON compiles an immutable snapshot captured at request start; a threshold check blocks score 0.91 above 0.80 while PII redacts phone strings and deploy rules hold missing approvals, isolating in-flight requests from reloads.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    return Scene({
        c,
        padding: 10,
        gap: 6,
        children: GraphDiagram({
            c,
            width: 640,
            height: 700,
            direction: 'TB',
            nodeWidth: 196,
            nodeHeight: 74,
            labelFontSize: 20,
            detailFontSize: 20,
            arrowSize: 6,
            padding: 6,
            nodeGap: 14,
            rankGap: 28,
            routing: 'dagre',
            nodes: [
                {
                    id: 'load',
                    label: 'Validate Policy JSON',
                    detail: 'Bad reload keeps prior rev',
                    tone: 'blue',
                    icon: 'file',
                },
                {
                    id: 'snap',
                    label: 'Pin Request Snapshot',
                    detail: 'rev-1 locks thresh 0.80',
                    tone: 'purple',
                    icon: 'lock',
                },
                {
                    id: 'inj',
                    label: 'Injection >= 0.80',
                    detail: '0.91: Block input',
                    tone: 'critical',
                    icon: 'firewall',
                },
                {
                    id: 'pii',
                    label: 'Entity == PHONE',
                    detail: 'Redact matched text',
                    tone: 'warm',
                    icon: 'warning',
                },
                {
                    id: 'dep',
                    label: 'Tool == Deploy',
                    detail: 'No approval: hold',
                    tone: 'warm',
                    icon: 'tool',
                },
                {
                    id: 'reload',
                    label: 'Reload rev-2 (0.99)',
                    detail: 'Next request uses rev-2',
                    tone: 'neutral',
                    icon: 'layers',
                },
            ],
            edges: [
                { from: 'load', to: 'snap', tone: 'blue' },
                { from: 'snap', to: 'inj', tone: 'critical' },
                { from: 'snap', to: 'pii', tone: 'warm' },
                { from: 'snap', to: 'dep', tone: 'warm' },
                {
                    from: 'load',
                    to: 'reload',
                    label: 'hot reload',
                    tone: 'neutral',
                    dashed: true,
                },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
