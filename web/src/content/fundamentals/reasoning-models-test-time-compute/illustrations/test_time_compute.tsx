import React from 'react'
import { LineChart, Scene, defineIllustration, getReadableColor } from 'vizmatic'

export const width = 760
export const height = 460
export const opaqueBackground = false

export const alt =
    'Line chart comparing test-time compute scaling across inference multipliers (1x to 64x FLOPs). PRM-guided tree search on a 14x smaller base model overtakes a large single-pass model baseline as search compute increases.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={12}>
        <LineChart
            c={c}
            width={710}
            height={390}
            labels={['1x', '4x', '16x', '64x']}
            min={0.3}
            max={0.9}
            format="percent"
            directLabels
            yAxisLabel="Accuracy"
            series={[
                {
                    name: 'Small + PRM',
                    points: [0.38, 0.56, 0.72, 0.81],
                    color: getReadableColor('positive', c),
                },
                {
                    name: 'Small + BoN',
                    points: [0.38, 0.49, 0.58, 0.63],
                    color: getReadableColor('primary', c),
                },
                {
                    name: '14x Large 1-pass',
                    points: [0.71, 0.71, 0.71, 0.71],
                    color: getReadableColor('warning', c),
                },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
