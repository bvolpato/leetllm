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
    'Side-by-side bar charts of output token usage under a 2,000-token max_output_tokens limit. Left: a completed turn uses 920 hidden reasoning tokens and 360 visible tokens, leaving 720 unused. Right: an incomplete turn spends all 2,000 tokens on reasoning and emits 0 visible tokens.'

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
                        title: 'Completed Turn',
                        subtitle: 'status: completed',
                        tone: 'green',
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
                                        value: 920,
                                        valueLabel: '920',
                                        color: getReadableColor('primary', c),
                                    },
                                    {
                                        label: 'Vis',
                                        value: 360,
                                        valueLabel: '360',
                                        color: getReadableColor('positive', c),
                                    },
                                    {
                                        label: 'Free',
                                        value: 720,
                                        valueLabel: '720',
                                        color: getReadableColor('neutral', c),
                                    },
                                ]}
                            />
                        ),
                        footer: (
                            <TextLabel
                                c={c}
                                text="Fits inside 2k cap"
                                fontSize={23}
                                color={c.textSecondary}
                            />
                        ),
                    },
                    {
                        title: 'Truncated Turn',
                        subtitle: 'status: incomplete',
                        tone: 'critical',
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
                                        value: 2000,
                                        valueLabel: '2000',
                                        color: getReadableColor('critical', c),
                                    },
                                    {
                                        label: 'Vis',
                                        value: 0,
                                        valueLabel: '0',
                                        color: getReadableColor('positive', c),
                                    },
                                    {
                                        label: 'Free',
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
                                text="Empty visible answer"
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
