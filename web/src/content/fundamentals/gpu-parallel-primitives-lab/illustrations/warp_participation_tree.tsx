import React from 'react'
import {
    Arrow,
    BadgePill,
    Column,
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
export const height = 740
export const alt =
    'Left panel shows all 32 warp lanes with lanes 0 to 19 holding 1 and tail lanes 20 to 31 padded with 0, plus Lane 0 combining offsets 16, 8, 4, 2, and 1 along 1 -> 2 -> 3 -> 5 -> 10 -> 20. Right top shows early tail exit leaving Lane 20 undefined when Lane 4 reads it at offset 16. Right bottom shows Lane 16 at offset 16 rejecting source 32 >= 32 and keeping total 20.'

const laneCell = (i: number): GridCell => ({
    label: i < 20 ? '1' : '0',
    tone: i < 20 ? 'green' : 'neutral',
})

const warpRows: Array<Array<GridCell>> = [
    Array.from({ length: 8 }, (_, k) => laneCell(k)),
    Array.from({ length: 8 }, (_, k) => laneCell(8 + k)),
    Array.from({ length: 8 }, (_, k) => laneCell(16 + k)),
    Array.from({ length: 8 }, (_, k) => laneCell(24 + k)),
]

const laneZeroTrace: Array<Array<string | GridCell>> = [
    ['init', '+16', '+8', '+4', '+2', '+1'],
    ['1', '2', '3', '5', '10', { label: '20', tone: 'green' }],
]

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={480}
                    padding={14}
                    gap={10}
                    tone="purple"
                    titleFontSize={32}
                    title="All 32 lanes run every shuffle"
                >
                    <TextLabel c={c} text="Rows L0..31: L0..19 = 1, L20..31 = 0" fontSize={28} />
                    <Grid
                        c={c}
                        rows={warpRows}
                        cellWidth={50}
                        cellHeight={42}
                        gap={5}
                        fontSize={28}
                    />
                    <TextLabel c={c} text="Lane 0 down-shuffle sum" fontSize={28} />
                    <Grid
                        c={c}
                        rows={laneZeroTrace}
                        cellWidth={68}
                        cellHeight={44}
                        gap={5}
                        fontSize={28}
                        headerRows={1}
                    />
                    <Arrow c={c} direction="down" length={20} />
                    <BadgePill c={c} text="Final warp sum: 20" tone="green" fontSize={28} />
                </Panel>
                <Column width={414} gap={14}>
                    <Panel
                        c={c}
                        width={414}
                        padding={14}
                        gap={12}
                        tone="red"
                        titleFontSize={32}
                        title="Early exit breaks partners"
                    >
                        <TextLabel c={c} text="Offset 16: L4 reads L20" fontSize={28} />
                        <Row gap={10} align="center" justify="center">
                            <BadgePill c={c} text="L4 (1)" tone="blue" fontSize={28} />
                            <Arrow c={c} direction="left" length={24} />
                            <BadgePill c={c} text="L20 (exit)" tone="red" fontSize={28} />
                        </Row>
                        <BadgePill c={c} text="Exited lane is undefined" tone="red" fontSize={28} />
                    </Panel>
                    <Panel
                        c={c}
                        width={414}
                        padding={14}
                        gap={12}
                        tone="warm"
                        titleFontSize={32}
                        title="Upper-edge source guard"
                    >
                        <TextLabel c={c} text="Offset 16: L16 asks for L32" fontSize={28} />
                        <Row gap={10} align="center" justify="center">
                            <BadgePill c={c} text="src = 32" tone="neutral" fontSize={28} />
                            <Arrow c={c} direction="right" length={24} />
                            <BadgePill c={c} text="src < 32" tone="warm" fontSize={28} />
                        </Row>
                        <TextLabel
                            c={c}
                            text="Self-copy discarded; total stays 20"
                            fontSize={28}
                            align="center"
                        />
                    </Panel>
                </Column>
            </Row>
        </Scene>
    )
}

export default create('dark')
