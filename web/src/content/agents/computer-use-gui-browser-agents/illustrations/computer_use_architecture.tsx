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
    'Coordinate pipeline mapping a model click at (132, 66) through crop origin (-32, -16) to (100, 50), scaling 2x to full screenshot coordinates (200, 100), adding viewport offset +(100, 50) to reach device pixels (300, 150), and dividing by DPR 2 to produce CSS click coordinates (150, 75).'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.95)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'model',
            label: 'Model (132, 66)',
            detail: 'Minus crop (32, 16)',
            tone: 'blue',
            icon: 'image',
        },
        {
            id: 'res',
            label: 'Unscaled (200, 100)',
            detail: '(100, 50) x 2 scale',
            tone: 'warm',
            icon: 'layers',
        },
        {
            id: 'vp',
            label: 'Device (300, 150)',
            detail: 'Add origin +(100, 50)',
            tone: 'blue',
            icon: 'browser',
        },
        {
            id: 'css',
            label: 'CSS Click (150, 75)',
            detail: 'Device / DPR 2',
            tone: 'green',
            icon: 'check',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'model',
            to: 'res',
            label: 'uncrop & scale 2x',
            kind: 'sync',
            tone: 'blue',
            emphasis: true,
        },
        {
            from: 'res',
            to: 'vp',
            label: 'raw pixel target',
            kind: 'async',
            tone: 'blue',
        },
        {
            from: 'res',
            to: 'css',
            label: 'shift + DPR 2',
            kind: 'event',
            tone: 'green',
            emphasis: true,
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
                ariaLabel="Four-space coordinate pipeline from model point to CSS pixel click"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
