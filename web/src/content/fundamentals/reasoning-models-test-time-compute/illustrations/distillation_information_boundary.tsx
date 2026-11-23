import React from 'react'
import { BarChart, Scene, defineIllustration, getReadableColor } from 'vizmatic'

export const width = 760
export const height = 460
export const opaqueBackground = false

export const alt =
    'Bar chart of published AIME 2024 accuracy for distilled Qwen models from DeepSeek-R1: Qwen-1.5B reaches 28.9%, Qwen-7B reaches 55.5%, Qwen-32B reaches 72.6%, and full 671B DeepSeek-R1 reaches 79.8%.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={12}>
        <BarChart
            c={c}
            width={700}
            height={390}
            min={0}
            max={1}
            format="percent"
            yAxisLabel="AIME 2024"
            showValues
            data={[
                {
                    label: 'Qwen-1.5B',
                    value: 0.289,
                    valueLabel: '28.9%',
                    color: getReadableColor('secondary', c),
                },
                {
                    label: 'Qwen-7B',
                    value: 0.555,
                    valueLabel: '55.5%',
                    color: getReadableColor('info', c),
                },
                {
                    label: 'Qwen-32B',
                    value: 0.726,
                    valueLabel: '72.6%',
                    color: getReadableColor('positive', c),
                },
                {
                    label: 'R1 (671B)',
                    value: 0.798,
                    valueLabel: '79.8%',
                    color: getReadableColor('primary', c),
                },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
