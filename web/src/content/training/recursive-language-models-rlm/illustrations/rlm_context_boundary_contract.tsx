import { Flow, LineChart, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 740
export const height = 560
export const alt =
    'A flow shows a 409-character REPL return trimmed to a 40-character preview made of 26 prefix characters and a 14-character truncation marker. A line chart across 20 returns shows full history reaching 8,180 characters while preview history stays at 800 characters.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.2)
    return Scene({
        c,
        title: 'REPL Output Truncation Keeps Root History Compact',
        subtitle: '409-char slice per turn stored outside prompt; 40-char preview logged',
        contentWidth: 700,
        gap: 16,
        padding: 20,
        children: [
            Flow({
                c,
                direction: 'horizontal',
                gap: 8,
                connectorLength: 26,
                stages: [
                    {
                        title: 'REPL Slice',
                        subtitle: '409 chars external',
                        tone: 'purple',
                        width: 196,
                    },
                    { title: 'Truncate', subtitle: '26 + 14 marker', tone: 'blue', width: 196 },
                    { title: 'Root Log', subtitle: '40 chars per turn', tone: 'green', width: 196 },
                ],
            }),
            Row({
                gap: 16,
                align: 'center',
                children: [
                    LineChart({
                        c,
                        width: 470,
                        height: 270,
                        labels: ['0', '5', '10', '15', '20'],
                        yAxisLabel: 'Chars',
                        min: 0,
                        max: 9000,
                        format: 'integer',
                        showGrid: true,
                        showPoints: true,
                        directLabels: true,
                        series: [
                            {
                                name: 'Full 409/turn',
                                points: [0, 2045, 4090, 6135, 8180],
                                color: 'critical',
                            },
                            {
                                name: 'Preview 40/turn',
                                points: [0, 200, 400, 600, 800],
                                color: 'green',
                            },
                        ],
                    }),
                    MetricCard({
                        c,
                        width: 214,
                        label: 'Turn 20 Ratio',
                        value: '10.2x',
                        detail: '8,180 vs 800 chars',
                        tone: 'green',
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
