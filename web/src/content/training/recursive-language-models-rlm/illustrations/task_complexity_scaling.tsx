import { LineChart, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 760
export const height = 660
export const alt =
    'A line chart plots normalized work multipliers from 1x to 5x input size for constant O(1) lookup, linear O(N) scans, and quadratic O(N^2) pairwise checks. Metric cards show 12,497,500 unordered pairs at 5,000 items and 49,995,000 pairs at 10,000 items, a 4.00x increase.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.3)
    return Scene({
        c,
        title: 'Task Scaling vs. Corpus Growth',
        subtitle: 'Normalized work multiplier across 1x to 5x record counts',
        contentWidth: 720,
        gap: 16,
        padding: 16,
        children: [
            LineChart({
                c,
                width: 720,
                height: 300,
                labels: ['1x', '2x', '3x', '4x', '5x'],
                yAxisLabel: 'Work multiple',
                min: 0,
                max: 25,
                showGrid: true,
                showPoints: true,
                directLabels: true,
                series: [
                    { name: 'O(N^2) pairs', points: [1, 4, 9, 16, 25], color: 'critical' },
                    { name: 'O(N) scan', points: [1, 2, 3, 4, 5], color: 'blue' },
                    { name: 'O(1) needle', points: [1, 1, 1, 1, 1], color: 'green' },
                ],
            }),
            Row({
                gap: 14,
                align: 'stretch',
                children: [
                    MetricCard({
                        c,
                        label: 'N = 5,000 pairs',
                        value: '12.5M',
                        detail: 'Exact: 12,497,500',
                        tone: 'blue',
                        width: 230,
                    }),
                    MetricCard({
                        c,
                        label: 'N = 10,000 pairs',
                        value: '50.0M',
                        detail: 'Exact: 49,995,000',
                        tone: 'critical',
                        width: 230,
                    }),
                    MetricCard({
                        c,
                        label: '2x item scale',
                        value: '4.00x',
                        detail: 'N(N - 1) / 2 growth',
                        tone: 'warm',
                        width: 230,
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
