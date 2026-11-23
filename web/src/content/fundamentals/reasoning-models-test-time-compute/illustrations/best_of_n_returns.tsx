import React from 'react'
import { LineChart, Scene, defineIllustration, getReadableColor } from 'vizmatic'

export const width = 760
export const height = 460
export const opaqueBackground = false

export const alt =
    'Line chart of pass@N coverage from N=1 to N=64 for single-sample success rates p=0.60, p=0.25, and p=0.05. Easy prompts saturate above 97% by N=4, medium prompts exceed 99% by N=16, and hard prompts climb steadily from 5% to 96.3%.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={12}>
        <LineChart
            c={c}
            width={710}
            height={390}
            labels={['1', '2', '4', '8', '16', '32', '64']}
            min={0}
            max={1}
            format="percent"
            directLabels
            yAxisLabel="pass@N"
            series={[
                {
                    name: 'p = 0.60',
                    points: [0.6, 0.84, 0.974, 0.999, 1, 1, 1],
                    color: getReadableColor('positive', c),
                },
                {
                    name: 'p = 0.25',
                    points: [0.25, 0.438, 0.684, 0.9, 0.99, 1, 1],
                    color: getReadableColor('primary', c),
                },
                {
                    name: 'p = 0.05',
                    points: [0.05, 0.098, 0.185, 0.337, 0.56, 0.806, 0.963],
                    color: getReadableColor('warning', c),
                },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
