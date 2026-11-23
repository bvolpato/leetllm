import React from 'react'
import {
    BarChart,
    Comparison,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableColor,
    withDensity,
} from 'vizmatic'

export const width = 780
export const height = 620
export const opaqueBackground = false

export const alt =
    'Comparison between current-turn billed output tokens and next-turn prompt history retention. Turn 1 bills 2,480 output tokens (1,920 hidden reasoning plus 560 visible answer), whereas Turn 2 carries 940 input tokens (380 Turn 1 prompt plus 560 visible answer) because hidden CoT is discarded.'

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
                        title: 'Turn 1 Output',
                        subtitle: '2,480 billed output',
                        tone: 'warm',
                        children: (
                            <BarChart
                                c={c}
                                width={315}
                                height={290}
                                min={0}
                                max={2000}
                                format="integer"
                                data={[
                                    {
                                        label: 'CoT',
                                        value: 1920,
                                        valueLabel: '1,920',
                                        color: getReadableColor('primary', c),
                                    },
                                    {
                                        label: 'Vis',
                                        value: 560,
                                        valueLabel: '560',
                                        color: getReadableColor('positive', c),
                                    },
                                ]}
                            />
                        ),
                        footer: (
                            <TextLabel
                                c={c}
                                text="CoT billed as output"
                                fontSize={23}
                                color={c.textSecondary}
                            />
                        ),
                    },
                    {
                        title: 'Turn 2 History',
                        subtitle: '940 prompt tokens',
                        tone: 'blue',
                        children: (
                            <BarChart
                                c={c}
                                width={315}
                                height={290}
                                min={0}
                                max={2000}
                                format="integer"
                                data={[
                                    {
                                        label: 'In',
                                        value: 380,
                                        valueLabel: '380',
                                        color: getReadableColor('info', c),
                                    },
                                    {
                                        label: 'Vis',
                                        value: 560,
                                        valueLabel: '560',
                                        color: getReadableColor('positive', c),
                                    },
                                    {
                                        label: 'CoT',
                                        value: 0,
                                        valueLabel: '0',
                                        color: getReadableColor('neutral', c),
                                    },
                                ]}
                            />
                        ),
                        footer: (
                            <TextLabel
                                c={c}
                                text="Hidden CoT dropped"
                                fontSize={23}
                                color={c.textSecondary}
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
