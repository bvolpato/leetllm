import { BarChart, Flow, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 760
export const height = 680
export const alt =
    'A split-and-merge flow halves a 5,700-character manual into 16 leaves and 15 merges for 31 calls inside a 512-character window with a 64-character reserve. A bar chart compares 16 leaves and 31 calls at window 512 against 32 leaves and 63 calls at window 256.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.3)
    return Scene({
        c,
        title: 'Recursive Binary Split-and-Merge Baseline',
        subtitle: '5,700-char manual with 64-char reserve: L leaves need L - 1 merges',
        contentWidth: 720,
        gap: 16,
        padding: 16,
        children: [
            Flow({
                c,
                direction: 'horizontal',
                gap: 6,
                connectorLength: 14,
                stages: [
                    { title: '5,700', subtitle: 'Raw manual', tone: 'purple', width: 158 },
                    { title: '4 Splits', subtitle: '448 max', tone: 'blue', width: 156 },
                    { title: '16 Leaves', subtitle: 'Extract JSON', tone: 'green', width: 158 },
                    { title: '15 Merges', subtitle: '31 total calls', tone: 'warm', width: 164 },
                ],
            }),
            Row({
                gap: 16,
                align: 'stretch',
                children: [
                    BarChart({
                        c,
                        width: 458,
                        height: 260,
                        title: 'Calls by Window Size',
                        format: 'integer',
                        showValues: true,
                        showGrid: false,
                        max: 75,
                        data: [
                            { label: '512 leaf', value: 16, color: 'green' },
                            { label: '512 all', value: 31, color: 'blue' },
                            { label: '256 leaf', value: 32, color: '#d97706' },
                            { label: '256 all', value: 63, color: 'critical' },
                        ],
                    }),
                    MetricCard({
                        c,
                        width: 246,
                        label: '64-char window',
                        value: '0 left',
                        detail: '64 - 64 reserve fails upfront',
                        tone: 'critical',
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
