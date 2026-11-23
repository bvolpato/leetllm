import React from 'react'
import { LineChart, Scene, defineIllustration, getReadableColor } from 'vizmatic'

export const width = 760
export const height = 460
export const opaqueBackground = false

export const alt =
    'Line chart of Goodhart over-optimization in Best-of-N selection from N=1 to N=64. The noisy proxy verifier score rises monotonically from 61% to 95%, while true problem solve rate peaks at 76% around N=8 and drops to 60% by N=64.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={12}>
        <LineChart
            c={c}
            width={710}
            height={390}
            labels={['1', '4', '8', '16', '32', '64']}
            min={0.5}
            max={1}
            format="percent"
            directLabels
            yAxisLabel="Score"
            series={[
                {
                    name: 'Proxy max',
                    points: [0.61, 0.76, 0.83, 0.88, 0.92, 0.95],
                    color: getReadableColor('warning', c),
                },
                {
                    name: 'True accuracy',
                    points: [0.58, 0.71, 0.76, 0.73, 0.67, 0.6],
                    color: getReadableColor('positive', c),
                },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
