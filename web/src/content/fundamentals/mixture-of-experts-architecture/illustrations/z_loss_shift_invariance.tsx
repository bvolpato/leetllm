import React from 'react'
import {
    BarChart,
    Column,
    DataTable,
    Panel,
    ProgressList,
    Scene,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 740
export const alt =
    'Adding +3 to logits [log(0.75), log(0.25)] = [−0.29, −1.39] yields shifted logits [2.71, 1.61]. Both produce identical softmax probabilities [0.75, 0.25] and select E0, while log Z moves from 0 to 3 and z-loss (log Z)² rises from 0 to 9.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Shift +3 moves logits, keeps softmax [0.75, 0.25]',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    gap: 8,
                    children: [
                        BarChart({
                            c: cd,
                            width: 544,
                            height: 210,
                            title: 'Logits before vs after +3 shift',
                            min: -1.8,
                            max: 3.4,
                            showGrid: true,
                            showValues: true,
                            data: [
                                {
                                    label: 'orig E0',
                                    value: -0.288,
                                    color: blue,
                                    valueLabel: '−0.29',
                                },
                                {
                                    label: 'orig E1',
                                    value: -1.386,
                                    color: blue,
                                    valueLabel: '−1.39',
                                },
                                {
                                    label: '+3 E0',
                                    value: 2.712,
                                    color: warm,
                                    valueLabel: '+2.71',
                                },
                                {
                                    label: '+3 E1',
                                    value: 1.614,
                                    color: warm,
                                    valueLabel: '+1.61',
                                },
                            ],
                        }),
                        ProgressList({
                            c: cd,
                            labelWidth: 180,
                            valueWidth: 160,
                            barHeight: 14,
                            gap: 6,
                            fontSize: 18,
                            rows: [
                                {
                                    label: 'E0 softmax (both)',
                                    value: 0.75,
                                    valueLabel: '0.75 unchanged',
                                    tone: 'purple',
                                },
                                {
                                    label: 'E1 softmax (both)',
                                    value: 0.25,
                                    valueLabel: '0.25 unchanged',
                                    tone: 'blue',
                                },
                            ],
                        }),
                    ],
                }),
                Panel({
                    c: cd,
                    title: 'Z-loss = (log Σ exp(zᵢ))² isolates logit offset',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    children: DataTable({
                        c: cd,
                        width: 544,
                        headerRows: 1,
                        headerCols: 1,
                        cellHeight: 32,
                        gap: 4,
                        fontSize: 18,
                        rows: [
                            ['Quantity', 'Orig [−.29, −1.39]', 'Shifted (+3)'],
                            ['Softmax p', '[0.75, 0.25]', '[0.75, 0.25]'],
                            ['log Z = log Σ e^zᵢ', '0.00', '3.00'],
                            ['z-loss = (log Z)²', '0.00', '9.00'],
                        ],
                    }),
                }),
            ],
        }),
    })
}

export default create('dark')
