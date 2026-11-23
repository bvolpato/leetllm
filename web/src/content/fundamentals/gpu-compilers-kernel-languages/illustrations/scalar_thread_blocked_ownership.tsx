import React from 'react'
import {
    BadgePill,
    Column,
    Grid,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const width = 960
export const height = 760
export const alt =
    'Stacked bar of n=1,000 split across four 256-lane blocks (CUDA blocks B0 to B3 and Triton pid 0 to 3): blocks 0 to 2 are full, while block 3 holds 232 valid lanes (768 to 999) and 24 masked lanes (1000 to 1023), with sums x[0]+y[0]=-3 and x[1]+y[1]=-1.75. Below left, a lane grid contrasts n=256 hiding <= against n=257 exposing lane 257 out of bounds. Below right, quotient-plus-remainder arithmetic for INT_MAX computes 8,388,608 blocks and 1 masked lane without 32-bit overflow.'

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 2.85)
    return (
        <Scene c={c} padding={16} gap={14} contentWidth={width - 32} align="center">
            <Column gap={14} width={width - 32}>
                <Panel
                    c={c}
                    title="n = 1,000 across four 256-lane blocks (B0..B3 / pid 0..3)"
                    titleFontSize={31}
                    tone="blue"
                    padding={14}
                    gap={8}
                >
                    <StackedBar
                        c={c}
                        width={width - 60}
                        height={52}
                        showLegend={false}
                        segments={[
                            { label: 'B0', value: 256, valueLabel: 'B0: 256', color: c.primary },
                            { label: 'B1', value: 256, valueLabel: 'B1: 256', color: c.primary },
                            { label: 'B2', value: 256, valueLabel: 'B2: 256', color: c.info },
                            {
                                label: 'B3 valid',
                                value: 232,
                                valueLabel: 'B3: 232',
                                color: c.positive,
                            },
                            { label: 'B3 mask', value: 24, valueLabel: '', color: c.critical },
                        ]}
                    />
                    <Row gap={20} justify="space-between">
                        <TextLabel
                            text="B3 final 24 lanes masked (1000..1023)"
                            c={c}
                            fontSize={29}
                            color={getReadableToneColor('red', c)}
                        />
                        <TextLabel text="i=0: -3 | i=1: -1.75" c={c} mono fontSize={29} />
                    </Row>
                </Panel>

                <Row gap={14} width={width - 32}>
                    <Panel
                        c={c}
                        title="n = 257 exposes off-by-one <= bug"
                        titleFontSize={31}
                        tone="warm"
                        padding={14}
                        gap={10}
                        width={457}
                    >
                        <TextLabel
                            text="n=256 fits B0; n=257 uses B1"
                            c={c}
                            fontSize={29}
                            color={c.textMuted}
                        />
                        <Grid
                            c={c}
                            cellWidth={72}
                            cellHeight={44}
                            gap={8}
                            fontSize={29}
                            headerCols={1}
                            rows={[
                                [
                                    'n=256',
                                    { label: '254', tone: 'green' },
                                    { label: '255', tone: 'green' },
                                    { label: '256', tone: 'neutral' },
                                    { label: '257', tone: 'neutral' },
                                ],
                                [
                                    'n=257',
                                    { label: '254', tone: 'green' },
                                    { label: '255', tone: 'green' },
                                    { label: '256', tone: 'green' },
                                    { label: '257!', tone: 'red' },
                                ],
                            ]}
                        />
                        <TextLabel
                            text="1 valid (256), 255 masked; <= hits 257"
                            c={c}
                            fontSize={29}
                            color={getReadableToneColor('red', c)}
                        />
                    </Panel>

                    <Panel
                        c={c}
                        title="INT_MAX (2,147,483,647) ceiling"
                        titleFontSize={31}
                        tone="purple"
                        padding={14}
                        gap={8}
                        width={457}
                    >
                        <Row gap={10} align="center">
                            <BadgePill
                                text="overflow"
                                tone="red"
                                c={c}
                                width={138}
                                height={38}
                                fontSize={29}
                            />
                            <TextLabel
                                text="wraps 32-bit int"
                                c={c}
                                fontSize={29}
                                color={getReadableToneColor('red', c)}
                            />
                        </Row>
                        <TextLabel text="(n + 255) / 256" c={c} mono fontSize={29} />
                        <Row gap={10} align="center">
                            <BadgePill
                                text="safe int"
                                tone="green"
                                c={c}
                                width={138}
                                height={38}
                                fontSize={29}
                            />
                            <TextLabel
                                text="8,388,608 blks | 1 masked"
                                c={c}
                                fontSize={29}
                                color={getReadableToneColor('green', c)}
                            />
                        </Row>
                        <TextLabel text="n/256 + (n%256 != 0)" c={c} mono fontSize={29} />
                    </Panel>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
