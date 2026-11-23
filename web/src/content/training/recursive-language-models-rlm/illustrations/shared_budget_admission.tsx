import { BarChart, Flow, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 760
export const height = 680
export const alt =
    'A pipeline filters 12 manual slices in the Python REPL down to 4 matching spans, reserves sub-call slots atomically against a shared 6-call ceiling, fans out workers concurrently, and merges hits in NumPy. A bar chart shows stale snapshot checks overshooting to 12 calls while atomic reservation stays at 6.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.3)
    return Scene({
        c,
        title: 'REPL Decomposition and Shared Sub-Call Fan-Out',
        subtitle: 'Filter slices before calling models; reserve shared call slots atomically',
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
                    { title: '12 Slices', subtitle: 'NumPy TF-IDF', tone: 'purple', width: 162 },
                    { title: '4 Kept', subtitle: 'Score >= 2', tone: 'blue', width: 152 },
                    { title: 'Slot Lock', subtitle: 'Cap = 6 calls', tone: 'cyan', width: 156 },
                    { title: 'Merge', subtitle: 'Merged JSON', tone: 'green', width: 166 },
                ],
            }),
            Row({
                gap: 16,
                align: 'stretch',
                children: [
                    BarChart({
                        c,
                        width: 458,
                        height: 255,
                        title: 'Dispatched Calls Across Parallel Workers',
                        format: 'integer',
                        showValues: true,
                        showGrid: false,
                        max: 15,
                        data: [
                            { label: 'Shared cap', value: 6, color: 'blue' },
                            { label: 'Atomic lock', value: 6, color: 'green' },
                            { label: 'Stale read', value: 12, color: 'critical' },
                        ],
                    }),
                    MetricCard({
                        c,
                        width: 246,
                        label: 'Uncapped 4-way tree',
                        value: '715',
                        detail: '85 nodes: 21 x 31 + 64 leaves',
                        tone: 'warm',
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
