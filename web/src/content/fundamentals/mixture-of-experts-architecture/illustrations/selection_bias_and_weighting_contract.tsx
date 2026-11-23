import React from 'react'
import {
    Column,
    DataTable,
    GraphDiagram,
    Panel,
    Scene,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 760
export const alt =
    'DeepSeek-V3 forks original sigmoid affinities sᵢ into a selection branch (+ bias bᵢ -> top-8 IDs of 256) and a weighting branch (gather original selected sᵢ -> normalize -> routed weighted sum plus 1 shared expert). Contrast table shows Switch top-1 keeps original gate, Mixtral top-2 normalizes selected softmax gates, and DeepSeek-V3 separates biased selection from unbiased normalization.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'DeepSeek-V3: bias steers selection, not output weights',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    children: GraphDiagram({
                        c: cd,
                        width: 536,
                        height: 220,
                        padding: 6,
                        direction: 'TB',
                        nodeGap: 20,
                        rankGap: 14,
                        edgeGap: 8,
                        labelFontSize: 18,
                        detailFontSize: 18,
                        arrowSize: 7,
                        nodes: [
                            { id: 's', label: 'Sigmoid sᵢ (256)', tone: 'purple' },
                            { id: 'sel', label: 'sᵢ + bᵢ -> top-8 IDs', tone: 'warm' },
                            { id: 'val', label: 'Norm raw sᵢ[IDs]', tone: 'blue' },
                            { id: 'out', label: 'Sum + 1 shared', tone: 'green' },
                        ],
                        edges: [
                            { from: 's', to: 'sel', label: '+bias', tone: 'warm' },
                            { from: 's', to: 'val', label: 'raw', tone: 'blue' },
                            { from: 'sel', to: 'val', label: 'IDs', dashed: true, tone: 'warm' },
                            { from: 'val', to: 'out', label: 'blend', tone: 'green' },
                        ],
                    }),
                }),
                Panel({
                    c: cd,
                    title: 'Weighting rules differ across architectures',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    children: DataTable({
                        c: cd,
                        width: 544,
                        headerRows: 1,
                        headerCols: 1,
                        cellHeight: 34,
                        gap: 4,
                        fontSize: 18,
                        rows: [
                            ['Architecture', 'Selection', 'Output Weighting'],
                            ['Switch (k=1)', 'softmax top-1', 'keep raw gate'],
                            ['Mixtral (k=2)', 'softmax top-2', 'renorm top-2'],
                            ['DeepSeek-V3', 'sigmoid + bias', 'norm raw sᵢ'],
                        ],
                    }),
                }),
            ],
        }),
    })
}

export default create('dark')
