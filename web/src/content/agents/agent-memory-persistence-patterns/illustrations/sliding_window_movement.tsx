import React from 'react'
import {
    BadgePill,
    Card,
    Column,
    Heatmap,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
} from 'vizmatic'

export const width = 880
export const height = 390
export const alt =
    'Turn-index sliding window timeline and prompt token layout for window width k equals 3. Left matrix tracks turns t1 through t5 across steps 3, 4, and 5: t1 and t2 are evicted into the rolling summary and archive while turns t3 through t5 occupy the live window. Right stacked token bars compare step 3 and step 5 prompt buffers, highlighting the byte-identical pinned KV-cache prefix boundary before the mutating rolling summary and constant-width k equals 3 live window.'

const illustration = defineIllustration((c) => {
    const cPrefix = getToneColor('green', c)
    const cSummary = getToneColor('purple', c)
    const cLive = getToneColor('blue', c)
    const cHeadroom = c.border

    return (
        <Scene
            c={c}
            title="Sliding Window (k = 3), Rolling Summary, and KV-Cache Prefix Boundary"
            padding={16}
            gap={12}
            contentWidth={848}
        >
            <Row gap={16} align="stretch">
                <Card
                    c={c}
                    width={410}
                    padding={14}
                    gap={12}
                    title="Turn-Index Window Matrix (k = 3)"
                    subtitle="Active window slides right; evicted turns archive"
                >
                    <Column gap={10}>
                        <Heatmap
                            c={c}
                            xLabels={['t1', 't2', 't3', 't4', 't5']}
                            yLabels={['Step 3', 'Step 4', 'Step 5']}
                            data={[
                                [0.92, 0.92, 0.92, 0.06, 0.06],
                                [0.48, 0.92, 0.92, 0.92, 0.06],
                                [0.48, 0.24, 0.92, 0.92, 0.92],
                            ]}
                            labels={[
                                ['Live', 'Live', 'Live', '.', '.'],
                                ['[t1]', 'Live', 'Live', 'Live', '.'],
                                ['[t1]', 'Arch', 'Live', 'Live', 'Live'],
                            ]}
                            cellWidth={60}
                            cellHeight={44}
                            rowLabelWidth={66}
                            colorScale="strength"
                            fontSize={12}
                        />
                        <Row gap={10} justify="space-between" align="center">
                            <TextLabel
                                c={c}
                                text="[t1] KEY anchor pinned"
                                fontSize={12}
                                color={getReadableToneColor('purple', c)}
                                mono
                            />
                            <TextLabel
                                c={c}
                                text="Arch = external log"
                                fontSize={12}
                                color={c.textMuted}
                                mono
                            />
                        </Row>
                    </Column>
                </Card>

                <Card
                    c={c}
                    width={422}
                    padding={14}
                    gap={12}
                    title="Prompt Token Layout & KV-Cache Boundary"
                    subtitle="Pinned prefix stays byte-identical across turns"
                >
                    <Column gap={12}>
                        <Column gap={5}>
                            <Row justify="space-between" align="center" width={388}>
                                <TextLabel c={c} text="Step 3 prompt (no eviction yet)" fontSize={12} fontWeight={700} />
                                <TextLabel c={c} text="3/3 live slots" fontSize={11} color={c.textMuted} mono />
                            </Row>
                            <StackedBar
                                c={c}
                                width={388}
                                height={32}
                                showLegend={false}
                                segments={[
                                    { label: 'Pinned Prefix', value: 26, color: cPrefix, valueLabel: 'Prefix' },
                                    { label: 'Live t1..t3', value: 48, color: cLive, valueLabel: 't1 | t2 | t3' },
                                    { label: 'Free', value: 26, color: cHeadroom, valueLabel: '' },
                                ]}
                            />
                        </Column>

                        <Column gap={5}>
                            <Row justify="space-between" align="center" width={388}>
                                <TextLabel c={c} text="Step 5 prompt (t1, t2 evicted)" fontSize={12} fontWeight={700} />
                                <TextLabel c={c} text="bounded tokens" fontSize={11} color={c.textMuted} mono />
                            </Row>
                            <StackedBar
                                c={c}
                                width={388}
                                height={32}
                                showLegend={false}
                                segments={[
                                    { label: 'Pinned Prefix', value: 26, color: cPrefix, valueLabel: 'Prefix' },
                                    { label: 'Summary', value: 18, color: cSummary, valueLabel: 'Sum' },
                                    { label: 'Live t3..t5', value: 48, color: cLive, valueLabel: 't3 | t4 | t5' },
                                    { label: 'Free', value: 8, color: cHeadroom, valueLabel: '' },
                                ]}
                            />
                        </Column>

                        <Row gap={8} align="center" justify="space-between" width={388}>
                            <BadgePill c={c} text="KV Prefix Hit Zone (26%)" tone="green" fontSize={11} />
                            <TextLabel
                                c={c}
                                text="| Re-prefill boundary"
                                fontSize={12}
                                fontWeight={700}
                                color={getReadableToneColor('warm', c)}
                                mono
                            />
                        </Row>

                        <Row gap={12} wrap>
                            <TextLabel c={c} text="Prefix: system + repo + goal" fontSize={12} color={getReadableToneColor('green', c)} />
                            <TextLabel c={c} text="Sum: [t1] attn.py:84" fontSize={12} color={getReadableToneColor('purple', c)} />
                            <TextLabel c={c} text="Live k=3: t3, t4, t5" fontSize={12} color={getReadableToneColor('blue', c)} />
                        </Row>
                    </Column>
                </Card>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
