import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 800
export const autoSize = false
export const alt =
    'Production agent finite-state architecture: planner proposals enter capability and Pydantic schema validation with duplicate-call loop detection, failing proposals return structured feedback for retry or halt loops, and valid calls pass pre-execution step, token, and latency budgets before executing tools.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    return Scene({
        c,
        padding: 8,
        gap: 4,
        contentWidth: 660,
        children: GraphDiagram({
            c,
            width: 660,
            height: 740,
            direction: 'TB',
            routing: 'dagre',
            nodeWidth: 225,
            nodeHeight: 56,
            rankGap: 18,
            nodeGap: 20,
            labelFontSize: 22,
            detailFontSize: 20,
            nodes: [
                {
                    id: 'plan',
                    label: 'Planner Call',
                    detail: 'Tool + JSON args',
                    tone: 'warm',
                },
                {
                    id: 'gate',
                    label: 'Schema Gate',
                    detail: 'Pydantic + dup sig',
                    tone: 'blue',
                },
                {
                    id: 'retry',
                    label: 'Reject / Retry',
                    detail: 'Err msg or halt',
                    tone: 'red',
                },
                {
                    id: 'budget',
                    label: 'Budget Gate',
                    detail: '5 steps / 900 tok',
                    tone: 'cyan',
                },
                {
                    id: 'exec',
                    label: 'Run + Cite',
                    detail: 'Docs, stats, taint',
                    tone: 'green',
                },
                {
                    id: 'abort',
                    label: 'Safe Halt',
                    detail: 'Over cap / taint',
                    tone: 'red',
                },
            ],
            edges: [
                {
                    from: 'plan',
                    to: 'gate',
                    label: 'check',
                    kind: 'sync',
                    tone: 'blue',
                },
                { from: 'gate', to: 'retry', label: 'bad', kind: 'event', tone: 'red' },
                {
                    from: 'gate',
                    to: 'budget',
                    label: 'ok',
                    kind: 'sync',
                    tone: 'green',
                },
                {
                    from: 'budget',
                    to: 'abort',
                    label: 'over',
                    kind: 'event',
                    tone: 'red',
                },
                {
                    from: 'budget',
                    to: 'exec',
                    label: 'pass',
                    kind: 'sync',
                    tone: 'green',
                },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
