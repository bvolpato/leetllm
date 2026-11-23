import React from 'react'
import {
    BarChart,
    Column,
    Panel,
    Row,
    Scene,
    StackedBar,
    TiledMatrix,
    defineIllustration,
} from 'vizmatic'

export const width = 760
export const height = 760

export const alt =
    'Memory comparison showing a single live 5 MiB SSM state, 8 independent live requests at 40 MiB, and 1K-token checkpoint retention reaching 45 MiB at 8K tokens and 325 MiB at 64K tokens.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.3} padding={10} gap={8} background="transparent">
        <Column gap={8} align="stretch">
            <Panel
                c={c}
                title="Live state vs checkpoint retention (MiB)"
                subtitle="1K snapshots turn constant 5 MiB state into O(L) growth"
                padding={10}
                gap={4}
            >
                <BarChart
                    c={c}
                    width={690}
                    height={180}
                    min={0}
                    max={350}
                    format="integer"
                    yAxisLabel="MiB"
                    data={[
                        { label: '1 live', value: 5, valueLabel: '5', color: c.positive },
                        { label: '8 reqs', value: 40, valueLabel: '40', color: c.info },
                        { label: '8K ckpt', value: 45, valueLabel: '45', color: c.warning },
                        {
                            label: '64K ckpt',
                            value: 325,
                            valueLabel: '325',
                            color: c.critical,
                        },
                    ]}
                />
            </Panel>

            <Panel
                c={c}
                title="64K checkpoint footprint (1 live + 64 snapshots)"
                subtitle="Snapshots consume 98.5% of the 325 MiB budget"
                padding={10}
                gap={6}
            >
                <Row gap={14} align="center">
                    <TiledMatrix
                        c={c}
                        rows={5}
                        cols={13}
                        cellSize={16}
                        gap={4}
                        tone="warm"
                        regions={[
                            { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 0, tone: 'green' },
                            { rowStart: 0, rowEnd: 4, colStart: 1, colEnd: 12, tone: 'warm' },
                        ]}
                    />
                    <StackedBar
                        c={c}
                        width={400}
                        height={36}
                        segments={[
                            {
                                label: 'Live',
                                value: 5,
                                valueLabel: '5 MiB',
                                color: c.positive,
                            },
                            {
                                label: 'Saved snapshots',
                                value: 320,
                                valueLabel: '320 MiB',
                                color: c.warning,
                            },
                        ]}
                    />
                </Row>
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
