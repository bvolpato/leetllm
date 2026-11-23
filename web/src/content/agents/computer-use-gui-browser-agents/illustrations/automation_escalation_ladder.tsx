import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 710
export const height = 780
export const alt =
    'Control surface ladder routing agent requests to the narrowest deterministic interface: first typed REST or RPC APIs, next structured DOM selectors when no API exists, and sandboxed pixel GUI control only when no accessible target exists.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.15)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'task',
            label: 'Agent Step Goal',
            detail: 'Match control surface',
            tone: 'blue',
            icon: 'agent',
        },
        {
            id: 'route',
            label: 'Route Narrowest',
            detail: 'Escalate if missing',
            tone: 'blue',
            icon: 'load-balancer',
        },
        {
            id: 'api',
            label: '1. Typed Tool API',
            detail: 'Schema JSON & IDs',
            tone: 'green',
            icon: 'code',
        },
        {
            id: 'dom',
            label: '2. DOM Selector',
            detail: 'ARIA roles & locators',
            tone: 'warm',
            icon: 'browser',
        },
        {
            id: 'gui',
            label: '3. Pixel GUI',
            detail: 'Sandboxed fallback',
            tone: 'critical',
            icon: 'monitor',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'task',
            to: 'route',
            label: 'check surface',
            kind: 'sync',
            tone: 'blue',
            emphasis: true,
        },
        {
            from: 'route',
            to: 'api',
            label: 'has API',
            kind: 'event',
            tone: 'green',
        },
        { from: 'route', to: 'dom', label: 'web DOM', kind: 'async', tone: 'warm' },
        {
            from: 'route',
            to: 'gui',
            label: 'GUI only',
            kind: 'association',
            tone: 'critical',
            style: 'dashed',
        },
    ]

    return (
        <Scene c={c} density={2.15} padding={6} gap={4}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                direction="TB"
                routing="dagre"
                arrowSize={6}
                padding={4}
                nodeWidth={224}
                nodeHeight={54}
                nodeGap={10}
                rankGap={16}
                edgeGap={10}
                labelFontSize={22}
                detailFontSize={21}
                ariaLabel="Ladder from typed APIs to DOM selectors to pixel GUI control"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
