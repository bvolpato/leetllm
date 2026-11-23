import { QuadrantChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const preset = 'engineering'
export const width = 560
export const height = 560
export const alt =
    'Quadrant plot comparing four reasoning strategies by p95 latency (ms) and task accuracy (%). Direct (190ms, 76%) and CoT-1 (360ms, 84%) fall below the 90% accuracy gate. ToT (1840ms, 96%) exceeds the 900ms latency cap. Only Vote-5 (740ms, 94%) enters the passing top-left region.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.75)
    return Scene({
        c,
        padding: 12,
        contentWidth: 536,
        children: QuadrantChart({
            c,
            width: 536,
            height: 520,
            xMin: 0,
            xMax: 2000,
            yMin: 0.6,
            yMax: 1.0,
            xThreshold: 900,
            yThreshold: 0.9,
            xAxisLabel: 'p95 Latency (ms)',
            yAxisLabel: 'Accuracy (%)',
            formatX: (value: number) => `${Math.round(value)}ms`,
            formatY: 'percent',
            showGrid: true,
            showTicks: true,
            regions: {
                topLeft: {
                    label: 'Passes Gate',
                    color: 'green',
                    emphasis: true,
                },
                topRight: { label: 'Too Slow', color: 'purple' },
                bottomLeft: { label: 'Low Acc', color: 'warm' },
                bottomRight: { label: 'Fails Both', color: 'slate' },
            },
            points: [
                { x: 190, y: 0.76, label: 'Direct', color: 'warm' },
                { x: 360, y: 0.84, label: 'CoT-1', color: 'blue' },
                { x: 740, y: 0.94, label: 'Vote-5', color: 'green' },
                { x: 1840, y: 0.96, label: 'ToT', color: 'purple' },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
