import React from 'react'
import { LineChart, Scene, defineIllustration, getReadableColor } from 'vizmatic'

export const width = 760
export const height = 460
export const opaqueBackground = false

export const alt =
    'Line chart of sequential revision accuracy across rounds t0 to t5. Verifier-guided edits improve accuracy from 42% to 83% by round t3 before plateauing, while unverified self-edits peak at 60% at t2 and drift downward to 49% by t5.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={12}>
        <LineChart
            c={c}
            width={710}
            height={390}
            labels={['t0', 't1', 't2', 't3', 't4', 't5']}
            min={0.3}
            max={0.9}
            format="percent"
            directLabels
            yAxisLabel="Accuracy"
            series={[
                {
                    name: 'Guided edit',
                    points: [0.42, 0.68, 0.79, 0.83, 0.84, 0.83],
                    color: getReadableColor('positive', c),
                },
                {
                    name: 'Unverified edit',
                    points: [0.42, 0.56, 0.6, 0.57, 0.53, 0.49],
                    color: getReadableColor('critical', c),
                },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
