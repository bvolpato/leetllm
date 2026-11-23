import React from 'react'
import { Grid, GraphDiagram, Panel, Scene, getThemeColors, withDensity } from 'vizmatic'
import type { GridCell, ThemeMode } from 'vizmatic'

export const width = 940
export const height = 760
export const alt =
    'Top panel shows a reduction tree combining [3, -1, 4, 1, 5, -9, 2, 6] into [2, 5, -4, 8], then [7, 4], then 11. Bottom panel shows aligned 8-column rows for index, input, exclusive prefix [0, 3, 2, 6, 7, 12, 3, 5], and inclusive prefix [3, 2, 6, 7, 12, 3, 5, 11], highlighting index 3 where 6 + 1 = 7.'

const treeNodes = [
    ...[3, -1, 4, 1, 5, -9, 2, 6].map((v, i) => ({
        id: `in${i}`,
        label: String(v),
        x: (i + 0.5) / 8,
        y: 0.08,
        width: 72,
        height: 38,
        tone: 'neutral' as const,
    })),
    ...[2, 5, -4, 8].map((v, i) => ({
        id: `p${i}`,
        label: String(v),
        x: (i * 2 + 1) / 8,
        y: 0.35,
        width: 118,
        height: 38,
        tone: 'blue' as const,
    })),
    {
        id: 'q0',
        label: '7',
        x: 0.25,
        y: 0.63,
        width: 178,
        height: 38,
        tone: 'purple' as const,
    },
    {
        id: 'q1',
        label: '4',
        x: 0.75,
        y: 0.63,
        width: 178,
        height: 38,
        tone: 'purple' as const,
    },
    {
        id: 'root',
        label: '11',
        x: 0.5,
        y: 0.91,
        width: 236,
        height: 40,
        tone: 'green' as const,
    },
]

const treeEdges = [
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
        from: `in${i}`,
        to: `p${Math.floor(i / 2)}`,
    })),
    { from: 'p0', to: 'q0' },
    { from: 'p1', to: 'q0' },
    { from: 'p2', to: 'q1' },
    { from: 'p3', to: 'q1' },
    { from: 'q0', to: 'root' },
    { from: 'q1', to: 'root' },
]

const cell = (label: string, tone?: GridCell['tone']): GridCell => ({
    label,
    tone,
})

const scanRows: Array<Array<string | GridCell>> = [
    ['Idx', '0', '1', '2', cell('3', 'warm'), '4', '5', '6', '7'],
    ['Input', '3', '-1', '4', cell('1', 'blue'), '5', '-9', '2', '6'],
    ['Excl', '0', '3', '2', cell('6', 'warm'), '7', '12', '3', '5'],
    ['Incl', '3', '2', '6', cell('7', 'green'), '12', '3', '5', '11'],
]

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Panel
                c={c}
                width={908}
                padding={14}
                gap={10}
                tone="purple"
                titleFontSize={32}
                title="Reduction: eight inputs fold to 11"
            >
                <GraphDiagram
                    c={c}
                    nodes={treeNodes}
                    edges={treeEdges}
                    layout="manual"
                    direction="TB"
                    routing="dagre"
                    width={876}
                    height={295}
                    arrowSize={4}
                    labelFontSize={28}
                    padding={8}
                />
            </Panel>
            <Panel
                c={c}
                width={908}
                padding={14}
                gap={10}
                tone="blue"
                titleFontSize={32}
                title="Prefix scan: index 3 shows excl 6 + input 1 = incl 7"
            >
                <Grid
                    c={c}
                    rows={scanRows}
                    cellWidth={90}
                    cellHeight={44}
                    gap={6}
                    fontSize={28}
                    headerRows={1}
                    headerCols={1}
                />
            </Panel>
        </Scene>
    )
}

export default create('dark')
