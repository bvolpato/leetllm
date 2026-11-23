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
export const height = 680
export const opaqueBackground = false

export const alt =
    'Side-by-side latency breakdown comparing standard decoding against hidden reasoning decoding. Standard decoding reaches the first visible token at 0.25s, whereas decoding 1,024 hidden reasoning tokens delays visible TTFT to 12.8s before the 1.8s visible stream.'

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
                        title: 'Standard',
                        subtitle: 'No hidden thinking',
                        tone: 'green',
                        children: (
                            <BarChart
                                c={c}
                                width={315}
                                height={290}
                                min={0}
                                max={15}
                                format="decimal"
                                data={[
                                    {
                                        label: 'TTFT',
                                        value: 0.25,
                                        valueLabel: '0.25s',
                                        color: getReadableColor('positive', c),
                                    },
                                    {
                                        label: 'Total',
                                        value: 2.05,
                                        valueLabel: '2.05s',
                                        color: getReadableColor('primary', c),
                                    },
                                ]}
                            />
                        ),
                        footer: (
                            <TextLabel
                                c={c}
                                text="Visible TTFT = 0.25s"
                                fontSize={23}
                                color={c.textSecondary}
                            />
                        ),
                    },
                    {
                        title: 'Hidden CoT',
                        subtitle: '1k hidden tokens (12.6s)',
                        tone: 'warm',
                        children: (
                            <BarChart
                                c={c}
                                width={315}
                                height={290}
                                min={0}
                                max={15}
                                format="decimal"
                                data={[
                                    {
                                        label: 'TTFT',
                                        value: 12.8,
                                        valueLabel: '12.8s',
                                        color: getReadableColor('warning', c),
                                    },
                                    {
                                        label: 'Total',
                                        value: 14.6,
                                        valueLabel: '14.6s',
                                        color: getReadableColor('critical', c),
                                    },
                                ]}
                            />
                        ),
                        footer: (
                            <TextLabel
                                c={c}
                                text="Visible TTFT = 12.8s"
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
