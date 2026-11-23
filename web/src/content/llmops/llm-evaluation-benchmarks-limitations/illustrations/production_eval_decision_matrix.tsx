import { BarChart, Column, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 720
export const height = 780
export const alt =
    'Two stacked bar charts compare three candidate models across specification pass rate and p95 latency with unit cost labels. Fast-small scores 0.91 and fails the 0.98 pass bar despite 420 ms latency and 0.002 dollar cost. Balanced scores 0.99 at 680 ms and 0.008 dollars and passes online gates. Slow-specialist reaches 1.00 but takes 1800 ms at 0.031 dollars.'

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.25),
        shadow: 'transparent',
    }
}

const illustration = defineIllustration((base) => {
    const c = prepTheme(base)
    return Scene({
        c,
        padding: 6,
        gap: 6,
        contentWidth: width - 40,
        children: Column({
            width: width - 40,
            gap: 8,
            children: [
                BarChart({
                    c,
                    width: width - 40,
                    height: 205,
                    min: 0.85,
                    max: 1.02,
                    format: 'decimal',
                    showGrid: true,
                    showValues: true,
                    title: 'Specification pass rate (gate >= 0.98)',
                    data: [
                        { label: 'fast-small', value: 0.91, color: 'critical', valueLabel: '0.91' },
                        { label: 'balanced', value: 0.99, color: 'positive', valueLabel: '0.99' },
                        {
                            label: 'slow-specialist',
                            value: 1.0,
                            color: 'positive',
                            valueLabel: '1.00',
                        },
                    ],
                }),
                BarChart({
                    c,
                    width: width - 40,
                    height: 215,
                    min: 0,
                    max: 2000,
                    format: 'integer',
                    showGrid: true,
                    showValues: true,
                    title: 'p95 latency ms (<= 900) & cost',
                    data: [
                        {
                            label: 'fast-small ($0.002)',
                            value: 420,
                            color: 'positive',
                            valueLabel: '420 ms',
                        },
                        {
                            label: 'balanced ($0.008)',
                            value: 680,
                            color: 'positive',
                            valueLabel: '680 ms',
                        },
                        {
                            label: 'slow-spec ($0.031)',
                            value: 1800,
                            color: 'warning',
                            valueLabel: '1800 ms',
                        },
                    ],
                    footer: 'Only balanced meets quality, latency, and unit cost targets.',
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
