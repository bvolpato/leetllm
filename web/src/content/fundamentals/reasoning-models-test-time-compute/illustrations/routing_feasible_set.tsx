import React from 'react'
import { QuadrantChart, Scene, defineIllustration, getReadableColor } from 'vizmatic'

export const width = 780
export const height = 520
export const opaqueBackground = false

export const alt =
    'Quadrant chart plotting four inference tiers by p95 latency (seconds) versus solve accuracy, with a 4.5s latency SLO and 80% accuracy floor. Single-pass (0.2s, 56%) and Low Bo4 (1.4s, 74%) fall below quality; Deep PRM (11.5s, 93%) exceeds latency; Med Rev (3.8s, 87%) sits in the feasible Pareto region.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.25} padding={12}>
        <QuadrantChart
            c={c}
            width={720}
            height={440}
            xMin={0}
            xMax={13.5}
            yMin={0.45}
            yMax={1.04}
            xThreshold={4.5}
            yThreshold={0.8}
            xAxisLabel="p95 Latency (s)"
            yAxisLabel="Accuracy"
            formatY="percent"
            regions={{
                topLeft: { label: 'Feasible SLO', color: 'positive', emphasis: true },
                topRight: { label: 'Over Latency', color: 'warning' },
                bottomLeft: { label: 'Under Quality', color: 'critical' },
                bottomRight: { label: 'Suboptimal', color: 'neutral' },
            }}
            points={[
                { x: 0.5, y: 0.56, label: '1-Pass', color: getReadableColor('critical', c) },
                { x: 1.6, y: 0.72, label: 'Bo4', color: getReadableColor('info', c) },
                { x: 3.6, y: 0.87, label: 'Rev', color: getReadableColor('positive', c) },
                { x: 11.5, y: 0.91, label: 'PRM', color: getReadableColor('warning', c) },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
