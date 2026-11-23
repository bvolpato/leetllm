import React from 'react'
import {
    BarChart,
    Column,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 960
export const height = 810
export const alt =
    'Bar chart and register-pool breakdown for 256-thread (8-warp) blocks on a 65,536-register SM with 256-register warp allocation granules. Active warps drop from 64 at R32 (8 blocks, 65,536 used) to 48 at R33 (6 blocks, 61,440 used, 4,096 free), 40 at R41, 24 at R65, and 8 at R129. Right panels show why rounding 1,056 to 1,280 stranded 4,096 registers, how R33 reaches 100% under a 48-warp cap, and how 96 KiB shared memory at 32 KiB per block caps R32 at 24 warps.'

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 2.85)
    return (
        <Scene c={c} padding={14} gap={12} contentWidth={width - 28} align="center">
            <Row gap={14} width={width - 28} align="start">
                <Column gap={10} width={520}>
                    <Panel
                        c={c}
                        title="Resident warps (64-warp cap)"
                        titleFontSize={31}
                        tone="blue"
                        padding={10}
                        gap={4}
                        width={520}
                    >
                        <BarChart
                            c={c}
                            width={498}
                            height={220}
                            min={0}
                            max={80}
                            format="integer"
                            showValues={false}
                            data={[
                                { label: 'R32', value: 64, color: c.primary },
                                { label: 'R33', value: 48, color: c.warning },
                                { label: 'R41', value: 40, color: c.warning },
                                { label: 'R65', value: 24, color: c.violet },
                                { label: 'R129', value: 8, color: c.critical },
                            ]}
                        />
                        <TextLabel text="R32=64 | R33=48 | R41=40" c={c} mono fontSize={29} />
                        <TextLabel text="R65=24 | R129=8 warps" c={c} mono fontSize={29} />
                    </Panel>

                    <Panel
                        c={c}
                        title="SM register pool (65,536 total)"
                        titleFontSize={31}
                        tone="neutral"
                        padding={10}
                        gap={8}
                        width={520}
                    >
                        <TextLabel text="R32: 1,024/warp (8 blks x 8,192)" c={c} fontSize={29} />
                        <StackedBar
                            c={c}
                            width={498}
                            height={38}
                            showLegend={false}
                            segments={[
                                {
                                    label: 'used',
                                    value: 65536,
                                    valueLabel: '65,536 used (100%)',
                                    color: c.primary,
                                },
                            ]}
                        />
                        <TextLabel
                            text="R33: 1,280/warp (6 blks, 4,096 free)"
                            c={c}
                            fontSize={29}
                        />
                        <StackedBar
                            c={c}
                            width={498}
                            height={38}
                            showLegend={false}
                            segments={[
                                {
                                    label: 'used',
                                    value: 61440,
                                    valueLabel: '61,440 used',
                                    color: c.warning,
                                },
                                { label: 'free', value: 4096, valueLabel: '', color: c.neutral },
                            ]}
                        />
                    </Panel>
                </Column>

                <Column gap={12} width={398}>
                    <Panel
                        c={c}
                        title="Why 32 to 33 drops"
                        titleFontSize={31}
                        tone="warm"
                        padding={12}
                        gap={6}
                        width={398}
                    >
                        <TextLabel text="33x32 rounds to 1,280" c={c} mono fontSize={29} />
                        <TextLabel text="10,240/blk (6 blks fit)" c={c} mono fontSize={29} />
                        <TextLabel
                            text="4,096 unused regs left"
                            c={c}
                            fontSize={29}
                            color={c.textMuted}
                        />
                    </Panel>

                    <Panel
                        c={c}
                        title="Under a 48-warp cap"
                        titleFontSize={31}
                        tone="green"
                        padding={12}
                        gap={6}
                        width={398}
                    >
                        <TextLabel text="R33: 6 blks = 48/48" c={c} mono fontSize={29} />
                        <TextLabel
                            text="100% cap occupancy"
                            c={c}
                            fontSize={29}
                            color={c.textMuted}
                        />
                    </Panel>

                    <Panel
                        c={c}
                        title="96 KiB shared limit"
                        titleFontSize={31}
                        tone="purple"
                        padding={12}
                        gap={6}
                        width={398}
                    >
                        <TextLabel text="32 KiB/blk: 3 blks" c={c} mono fontSize={29} />
                        <TextLabel
                            text="24/64 warps (37.5%)"
                            c={c}
                            fontSize={29}
                            color={c.textMuted}
                        />
                    </Panel>
                </Column>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
