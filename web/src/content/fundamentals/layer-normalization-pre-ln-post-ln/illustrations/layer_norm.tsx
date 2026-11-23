import React from 'react'
import {
    BarChart,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const width = 880
export const height = 560
export const alt =
    'Three side-by-side bar charts track features f1 through f4 on a shared scale from negative three to six. Input x = [3, 1, -1, 5] has mean 2 and variance 5. Subtracting mean 2 gives centered [1, -1, -3, 3] with mean 0 and variance 5. Dividing by sqrt(5) compresses outputs to [0.45, -0.45, -1.34, 1.34] with mean 0 and variance 1.'

const input = [3, 1, -1, 5]
const mean = input.reduce((s, v) => s + v, 0) / input.length
const centered = input.map((v) => v - mean)
const variance = centered.reduce((s, v) => s + v * v, 0) / input.length
const normalized = centered.map((v) => v / Math.sqrt(variance))

const stages = [
    {
        title: '1. Input x',
        stats: 'mean 2, var 5',
        values: input,
        strs: ['3', '1', '-1', '5'],
    },
    {
        title: '2. Center (x - 2)',
        stats: 'mean 0, var 5',
        values: centered,
        strs: ['1', '-1', '-3', '3'],
    },
    {
        title: '3. Scale (/ sqrt 5)',
        stats: 'mean 0, var 1',
        values: normalized,
        strs: ['0.45', '-0.45', '-1.34', '1.34'],
    },
]

const toneList = ['blue', 'purple', 'warm', 'green'] as const

const illustration = defineIllustration((c) => {
    const chartC = withDensity(c, 2.95)
    const featureColors = toneList.map((tone) => getReadableToneColor(tone, c, c.bgCard))

    return (
        <Scene c={c} padding={16} gap={12}>
            <Panel
                c={c}
                title="LayerNorm: center mean to 0, scale variance to 1 ([-3, 6] axis)"
                titleFontSize={26}
                width={848}
                background={c.bgCard}
                borderColor={c.borderSubtle}
                padding={10}
                gap={0}
            />
            <Row gap={6} align="center">
                {stages.map((stage, sIdx) => (
                    <React.Fragment key={stage.title}>
                        {sIdx > 0 && <FlowArrow c={c} direction="right" length={16} />}
                        <Panel
                            c={c}
                            title={stage.title}
                            titleFontSize={26}
                            width={260}
                            background={c.bgCard}
                            borderColor={c.borderSubtle}
                            padding={10}
                            gap={6}
                        >
                            <TextLabel
                                c={c}
                                text={stage.stats}
                                fontSize={26}
                                color={c.textSecondary}
                                math={false}
                            />
                            <BarChart
                                c={chartC}
                                data={stage.values.map((value, idx) => ({
                                    label: String(idx + 1),
                                    value,
                                    color: featureColors[idx],
                                }))}
                                width={238}
                                height={198}
                                min={-3}
                                max={6}
                                showGrid
                                showValues={false}
                            />
                            <Row gap={8} justify="space-between">
                                <TextLabel
                                    c={c}
                                    text={`f1:${stage.strs[0]}`}
                                    fontSize={26}
                                    fontWeight={700}
                                    color={featureColors[0]}
                                    width={115}
                                    math={false}
                                />
                                <TextLabel
                                    c={c}
                                    text={`f2:${stage.strs[1]}`}
                                    fontSize={26}
                                    fontWeight={700}
                                    color={featureColors[1]}
                                    width={115}
                                    math={false}
                                />
                            </Row>
                            <Row gap={8} justify="space-between">
                                <TextLabel
                                    c={c}
                                    text={`f3:${stage.strs[2]}`}
                                    fontSize={26}
                                    fontWeight={700}
                                    color={featureColors[2]}
                                    width={115}
                                    math={false}
                                />
                                <TextLabel
                                    c={c}
                                    text={`f4:${stage.strs[3]}`}
                                    fontSize={26}
                                    fontWeight={700}
                                    color={featureColors[3]}
                                    width={115}
                                    math={false}
                                />
                            </Row>
                        </Panel>
                    </React.Fragment>
                ))}
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
