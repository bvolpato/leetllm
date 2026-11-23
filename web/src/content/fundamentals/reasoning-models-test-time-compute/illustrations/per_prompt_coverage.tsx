import React from 'react'
import {
    BarChart,
    Comparison,
    Scene,
    defineIllustration,
    getReadableColor,
    withDensity,
} from 'vizmatic'

export const width = 780
export const height = 560
export const opaqueBackground = false

export const alt =
    'Side-by-side bar charts comparing pass@1 and pass@4 before and after mode-sharpening RL. Raising easy prompts (70% to 90%) while narrowing hard prompts (20% to 5%) increases mean pass@1 from 45% to 48% yet drops mean pass@4 from 79% to 59%.'

const illustration = defineIllustration((rawC) => {
    const c = withDensity(rawC, 2.45)
    return (
        <Scene c={c} padding={12}>
            <Comparison
                c={c}
                gap={18}
                sideWidth={355}
                sides={[
                    {
                        title: 'Base Policy',
                        subtitle: 'Mean @1: 45% | @4: 79%',
                        tone: 'blue',
                        children: (
                            <BarChart
                                c={c}
                                width={315}
                                height={300}
                                min={0}
                                max={1}
                                format="percent"
                                data={[
                                    {
                                        label: 'Easy',
                                        value: 0.7,
                                        valueLabel: '70%',
                                        color: getReadableColor('positive', c),
                                    },
                                    {
                                        label: 'Hard',
                                        value: 0.2,
                                        valueLabel: '20%',
                                        color: getReadableColor('warning', c),
                                    },
                                    {
                                        label: '@4',
                                        value: 0.79,
                                        valueLabel: '79%',
                                        color: getReadableColor('primary', c),
                                    },
                                ]}
                            />
                        ),
                    },
                    {
                        title: 'Sharpened RL',
                        subtitle: 'Mean @1: 48% | @4: 59%',
                        tone: 'warm',
                        children: (
                            <BarChart
                                c={c}
                                width={315}
                                height={300}
                                min={0}
                                max={1}
                                format="percent"
                                data={[
                                    {
                                        label: 'Easy',
                                        value: 0.9,
                                        valueLabel: '90%',
                                        color: getReadableColor('positive', c),
                                    },
                                    {
                                        label: 'Hard',
                                        value: 0.05,
                                        valueLabel: '5%',
                                        color: getReadableColor('critical', c),
                                    },
                                    {
                                        label: '@4',
                                        value: 0.59,
                                        valueLabel: '59%',
                                        color: getReadableColor('primary', c),
                                    },
                                ]}
                            />
                        ),
                    },
                ]}
            />
        </Scene>
    )
})

export const { create } = illustration
export default illustration.default
