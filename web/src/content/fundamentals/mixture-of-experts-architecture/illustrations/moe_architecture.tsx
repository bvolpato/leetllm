import React from 'react'
import {
    Column,
    DataTable,
    GraphDiagram,
    Panel,
    ProgressList,
    Scene,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 780
export const alt =
    'Token x = [1, 0, 0, 0] enters a four-expert top-2 router with probabilities 0.522, 0.170, 0.259, and 0.050. E1 and E3 are selected with renormalized weights 0.668 and 0.332; E2 and E4 remain inactive. E1 outputs [2, 0, 0, 0] and E3 outputs [0, 3, 0, 0], summing to [1.336, 0.995, 0, 0].'

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
                    title: 'Router probabilities (top-2 selected)',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    children: ProgressList({
                        c: cd,
                        labelWidth: 126,
                        valueWidth: 170,
                        barHeight: 16,
                        gap: 8,
                        fontSize: 18,
                        rows: [
                            {
                                label: 'E1 (−0.65)',
                                value: 0.522,
                                valueLabel: '0.522 · w=0.668',
                                tone: 'blue',
                            },
                            {
                                label: 'E3 (−1.35)',
                                value: 0.259,
                                valueLabel: '0.259 · w=0.332',
                                tone: 'green',
                            },
                            {
                                label: 'E2 (−1.77)',
                                value: 0.17,
                                valueLabel: '0.170 (stored)',
                                muted: true,
                            },
                            {
                                label: 'E4 (−3.00)',
                                value: 0.05,
                                valueLabel: '0.050 (stored)',
                                muted: true,
                            },
                        ],
                    }),
                }),
                Panel({
                    c: cd,
                    title: 'Sparse routing graph and blend',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    gap: 8,
                    children: [
                        GraphDiagram({
                            c: cd,
                            width: 536,
                            height: 230,
                            padding: 8,
                            direction: 'TB',
                            nodeGap: 28,
                            rankGap: 22,
                            edgeGap: 8,
                            labelFontSize: 18,
                            detailFontSize: 18,
                            arrowSize: 7,
                            nodes: [
                                { id: 'x', label: 'x', detail: '[1,0,0,0]', tone: 'purple' },
                                { id: 'e1', label: 'E1', detail: '[2,0,0,0]', tone: 'blue' },
                                { id: 'e3', label: 'E3', detail: '[0,3,0,0]', tone: 'green' },
                                { id: 'y', label: 'Sum y', detail: 'k=2 blend', tone: 'warm' },
                            ],
                            edges: [
                                { from: 'x', to: 'e1', label: '0.668', tone: 'blue' },
                                { from: 'x', to: 'e3', label: '0.332', tone: 'green' },
                                { from: 'e1', to: 'y', tone: 'blue' },
                                { from: 'e3', to: 'y', tone: 'green' },
                            ],
                        }),
                        DataTable({
                            c: cd,
                            width: 544,
                            headerRows: 1,
                            headerCols: 1,
                            cellHeight: 30,
                            gap: 4,
                            fontSize: 18,
                            rows: [
                                ['Path', 'Wt × Output', 'Contribution'],
                                ['E1', '0.668 × [2,0,0,0]', '[1.336, 0, 0, 0]'],
                                ['E3', '0.332 × [0,3,0,0]', '[0, 0.995, 0, 0]'],
                                ['Sum y', 'k=2 blend', '[1.336, 0.995, 0, 0]'],
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
