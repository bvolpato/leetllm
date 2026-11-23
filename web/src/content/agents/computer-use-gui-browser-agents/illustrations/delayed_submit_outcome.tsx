import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 660
export const height = 780
export const alt =
    'Recovery fork when an async submit click leaves the UI unchanged: polling wait state confirms pending job N1 safely once, whereas blindly re-clicking fires duplicate submission N1 plus N2.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.95)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'click',
            label: 'Async Click Sent',
            detail: 'Queues job N1',
            tone: 'blue',
            icon: 'play',
        },
        {
            id: 'unchanged',
            label: 'Screen Still Idle',
            detail: 'Reply delayed 400ms',
            tone: 'warm',
            icon: 'monitor',
        },
        {
            id: 'reclick',
            label: 'Blind Re-Click',
            detail: 'Duplicate N1 + N2',
            tone: 'critical',
            icon: 'warning',
        },
        {
            id: 'poll',
            label: 'Wait & Re-Read',
            detail: 'Single clean N1',
            tone: 'green',
            icon: 'check',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'click',
            to: 'unchanged',
            label: 'screenshot early',
            kind: 'sync',
            tone: 'warm',
            emphasis: true,
        },
        {
            from: 'unchanged',
            to: 'reclick',
            label: 'retry click',
            kind: 'association',
            tone: 'critical',
            style: 'dashed',
        },
        {
            from: 'unchanged',
            to: 'poll',
            label: 'poll state',
            kind: 'event',
            tone: 'green',
        },
    ]

    return (
        <Scene c={c} density={1.95} padding={6} gap={4}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                direction="TB"
                routing="dagre"
                arrowSize={6}
                padding={6}
                nodeWidth={245}
                nodeHeight={54}
                nodeGap={16}
                rankGap={18}
                edgeGap={10}
                labelFontSize={21}
                detailFontSize={19}
                ariaLabel="Delayed async submit click duplicate risk vs polling wait check"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
