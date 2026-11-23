import React from 'react'
import {
    Arrow,
    BadgePill,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { GridCell, ThemeMode } from 'vizmatic'

export const width = 940
export const height = 670
export const alt =
    'Left panel shows an ordinary launch with eight blocks competing for four resident GPU slots: blocks 0 through 3 hold every slot while waiting at a barrier, stalling blocks 4 through 7 in the queue in a deadlock. Right panel shows a cooperative launch sized for eight co-resident slots so blocks 0 through 7 all reach grid.sync and continue.'

const cell = (label: string, tone?: GridCell['tone']): GridCell => ({
    label,
    tone,
})

const ordinaryRows: Array<Array<string | GridCell>> = [
    [
        cell('B0 wait', 'warm'),
        cell('B1 wait', 'warm'),
        cell('B2 wait', 'warm'),
        cell('B3 wait', 'warm'),
    ],
    [
        cell('B4 queue', 'neutral'),
        cell('B5 queue', 'neutral'),
        cell('B6 queue', 'neutral'),
        cell('B7 queue', 'neutral'),
    ],
]

const coopRows: Array<Array<string | GridCell>> = [
    [
        cell('B0 run', 'blue'),
        cell('B1 run', 'blue'),
        cell('B2 run', 'blue'),
        cell('B3 run', 'blue'),
    ],
    [
        cell('B4 run', 'blue'),
        cell('B5 run', 'blue'),
        cell('B6 run', 'blue'),
        cell('B7 run', 'blue'),
    ],
]

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={447}
                    padding={16}
                    gap={12}
                    tone="red"
                    titleFontSize={32}
                    title="Ordinary launch (4 slots)"
                >
                    <TextLabel c={c} text="8 blocks vie for 4 SM slots" fontSize={28} />
                    <Grid
                        c={c}
                        rows={ordinaryRows}
                        cellWidth={96}
                        cellHeight={66}
                        gap={6}
                        fontSize={28}
                    />
                    <TextLabel c={c} text="Holders wait on B4..B7" fontSize={28} align="center" />
                    <Arrow c={c} direction="down" length={20} />
                    <BadgePill c={c} text="Deadlock: queue stalled" tone="red" fontSize={28} />
                    <TextLabel
                        c={c}
                        text="Occupied slots never retire"
                        fontSize={28}
                        align="center"
                    />
                </Panel>
                <Panel
                    c={c}
                    width={447}
                    padding={16}
                    gap={12}
                    tone="green"
                    titleFontSize={32}
                    title="Cooperative launch (8 slots)"
                >
                    <TextLabel c={c} text="Grid sized for co-residency" fontSize={28} />
                    <Grid
                        c={c}
                        rows={coopRows}
                        cellWidth={96}
                        cellHeight={66}
                        gap={6}
                        fontSize={28}
                    />
                    <TextLabel
                        c={c}
                        text="All blocks call grid.sync()"
                        fontSize={28}
                        align="center"
                    />
                    <Arrow c={c} direction="down" length={20} />
                    <BadgePill c={c} text="All 8 sync and resume" tone="green" fontSize={28} />
                    <TextLabel
                        c={c}
                        text="Requires cooperative launch API"
                        fontSize={28}
                        align="center"
                    />
                </Panel>
            </Row>
        </Scene>
    )
}

export default create('dark')
