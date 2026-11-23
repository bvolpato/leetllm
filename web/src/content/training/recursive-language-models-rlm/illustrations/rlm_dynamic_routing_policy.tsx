import { BarChart, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 760
export const height = 740
export const alt =
    'Three bar charts evaluate Direct, REPL-only, and Recursive execution routes across recall against 0.90 minimum, p95 cost against $0.30 maximum, and p95 latency against 12s maximum. REPL-only meets every threshold at 0.92 recall, $0.19 cost, and 8.7 seconds.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.3)
    return Scene({
        c,
        title: 'Held-Out Route Selection Under Multi-Metric Thresholds',
        subtitle: 'Thresholds: recall >= 0.90, p95 cost <= $0.30, p95 latency <= 12.0s',
        contentWidth: 720,
        gap: 14,
        padding: 16,
        children: [
            Row({
                gap: 16,
                children: [
                    BarChart({
                        c,
                        width: 352,
                        height: 230,
                        title: 'Min Recall 0.90',
                        format: 'decimal',
                        showValues: true,
                        showGrid: false,
                        max: 1.15,
                        data: [
                            { label: 'Direct', value: 0.73, color: 'critical' },
                            { label: 'REPL', value: 0.92, color: 'green' },
                            { label: 'Recur', value: 0.95, color: 'blue' },
                        ],
                    }),
                    BarChart({
                        c,
                        width: 352,
                        height: 230,
                        title: 'Max p95 Cost $0.30',
                        format: 'decimal',
                        showValues: true,
                        showGrid: false,
                        max: 0.72,
                        data: [
                            { label: 'Direct', value: 0.08, color: 'blue' },
                            { label: 'REPL', value: 0.19, color: 'green' },
                            { label: 'Recur', value: 0.58, color: 'critical' },
                        ],
                    }),
                ],
            }),
            Row({
                gap: 16,
                align: 'stretch',
                children: [
                    BarChart({
                        c,
                        width: 352,
                        height: 230,
                        title: 'Max p95 Latency 12s',
                        format: 'decimal',
                        showValues: true,
                        showGrid: false,
                        max: 30,
                        data: [
                            { label: 'Direct', value: 4.1, color: 'blue' },
                            { label: 'REPL', value: 8.7, color: 'green' },
                            { label: 'Recur', value: 24.0, color: 'critical' },
                        ],
                    }),
                    MetricCard({
                        c,
                        width: 352,
                        label: 'Selected Route',
                        value: 'REPL-only',
                        detail: '0.92 recall, $0.19 cost, 8.7s p95 (lowest cost passing all 3 limits)',
                        tone: 'green',
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
