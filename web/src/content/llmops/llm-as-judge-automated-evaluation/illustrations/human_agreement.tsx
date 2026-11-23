import { BarChart, Column, Heatmap, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 760
export const height = 780
export const alt =
    'Eight-pair calibration sample matrix with human labels in rows and judge labels in columns, paired with a summary bar chart. Six diagonal pairs match and two off-diagonal pairs differ. Observed agreement is 0.750, expected chance agreement is 0.359, and Cohen kappa is 0.610.'

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.25),
        shadow: 'transparent',
    }
}

const illustration = defineIllustration((base) => {
    const c = prepTheme(base)
    const innerW = width - 40
    return Scene({
        c,
        padding: 6,
        gap: 6,
        contentWidth: innerW,
        children: Column({
            width: innerW,
            gap: 10,
            children: [
                Heatmap({
                    c,
                    title: 'Human rows vs. judge columns (N = 8)',
                    xLabels: ['compact', 'stepwise', 'tie'],
                    yLabels: ['compact', 'stepwise', 'tie'],
                    data: [
                        [3, 0, 0],
                        [1, 2, 0],
                        [0, 1, 1],
                    ],
                    colorScale: 'heat',
                    cellWidth: 150,
                    cellHeight: 62,
                    rowLabelWidth: 140,
                    fontSize: 22,
                    ariaLabel:
                        'Confusion matrix of human versus judge outcomes on eight resolved pairs',
                }),
                BarChart({
                    c,
                    title: 'Agreement, chance baseline, and kappa',
                    width: innerW,
                    height: 270,
                    min: 0,
                    max: 1,
                    format: 'decimal',
                    showGrid: true,
                    showValues: true,
                    yAxisLabel: 'Score',
                    data: [
                        { label: 'Observed (6/8)', value: 0.75, color: 'primary' },
                        { label: 'Expected (23/64)', value: 0.359, color: 'neutral' },
                        { label: 'Kappa (25/41)', value: 0.61, color: 'positive' },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
