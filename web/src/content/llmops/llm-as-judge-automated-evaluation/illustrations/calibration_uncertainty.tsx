import { BarChart, Column, LineChart, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 760
export const height = 780
export const opaqueBackground = true
export const alt =
    'A decaying curve and companion bar chart show the one-sided 95 percent upper bound on false acceptance after zero errors across N independent known-bad cases. The bound drops from 5.82 percent at 50 cases to 1.98 percent at 150 cases and 0.997 percent at 299 cases, just below the 1 percent line.'

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.3),
        shadow: 'transparent',
    }
}

const upperPct = (n: number) => Number((100 * (1 - Math.pow(0.05, 1 / n))).toFixed(3))

const sampleCounts = Array.from({ length: 18 }, (_, idx) => 10 + idx * 20)
const curvePoints = sampleCounts.map((n) => upperPct(n))
const thresholdPoints = sampleCounts.map(() => 1.0)
const axisLabels = sampleCounts.map((n) =>
    [10, 50, 110, 150, 210, 290, 350].includes(n) ? String(n) : '',
)

const illustration = defineIllustration((base) => {
    const c = prepTheme(base)
    const innerW = width - 40
    return Scene({
        c,
        background: base.bg,
        padding: 12,
        gap: 6,
        contentWidth: innerW,
        children: Column({
            width: innerW,
            gap: 8,
            children: [
                LineChart({
                    c,
                    title: '95% upper bound after zero false accepts (%)',
                    width: innerW,
                    height: 250,
                    labels: axisLabels,
                    min: 0,
                    max: 28,
                    showGrid: true,
                    showPoints: true,
                    directLabels: false,
                    yAxisLabel: 'Bound (%)',
                    series: [
                        {
                            name: 'Upper bound 1 - 0.05^(1/N)',
                            points: curvePoints,
                            color: 'primary',
                            area: true,
                        },
                        { name: '1% target threshold', points: thresholdPoints, color: 'positive' },
                    ],
                }),
                BarChart({
                    c,
                    title: 'Exact bound at key independent sample sizes',
                    width: innerW,
                    height: 185,
                    min: 0,
                    max: 7,
                    showGrid: true,
                    showValues: true,
                    yAxisLabel: 'Bound (%)',
                    data: [
                        {
                            label: 'N = 50 cases',
                            value: 5.82,
                            color: 'warning',
                            valueLabel: '5.82%',
                        },
                        {
                            label: 'N = 150 cases',
                            value: 1.98,
                            color: 'primary',
                            valueLabel: '1.98%',
                        },
                        {
                            label: 'N = 299 cases',
                            value: 0.997,
                            color: 'positive',
                            valueLabel: '0.997%',
                        },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
