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
export const height = 700
export const alt =
    'Top panel shows Pass 1 running local exclusive scans on Block 0 [3, -1, 4, 1] -> [0, 3, 2, 6] (total 7) and Block 1 [5, -9, 2, 6] -> [0, 5, -4, -2] (total 4). Middle scans block_totals [7, 4] into offsets [0, +7]. Bottom panel shows Pass 3 adding +0 to Block 0 and +7 to Block 1 to yield [0, 3, 2, 6, 7, 12, 3, 5].'

const cell = (label: string, tone?: GridCell['tone']): GridCell => ({
    label,
    tone,
})

const pass1Rows: Array<Array<string | GridCell>> = [
    ['Idx', 'B0:0', 'B0:1', 'B0:2', 'B0:3', 'B1:4', 'B1:5', 'B1:6', 'B1:7'],
    ['In', '3', '-1', '4', '1', '5', '-9', '2', '6'],
    [
        'Loc',
        '0',
        '3',
        '2',
        '6',
        cell('0', 'blue'),
        cell('5', 'blue'),
        cell('-4', 'blue'),
        cell('-2', 'blue'),
    ],
]

const pass3Rows: Array<Array<string | GridCell>> = [
    [
        'Add',
        '+0',
        '+0',
        '+0',
        '+0',
        cell('+7', 'warm'),
        cell('+7', 'warm'),
        cell('+7', 'warm'),
        cell('+7', 'warm'),
    ],
    [
        'Out',
        '0',
        '3',
        '2',
        '6',
        cell('7', 'green'),
        cell('12', 'green'),
        cell('3', 'green'),
        cell('5', 'green'),
    ],
]

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={12}>
            <Panel
                c={c}
                width={908}
                padding={14}
                gap={8}
                tone="blue"
                titleFontSize={32}
                title="Pass 1: Block-local exclusive scans (totals: 7 and 4)"
            >
                <Grid
                    c={c}
                    rows={pass1Rows}
                    cellWidth={88}
                    cellHeight={42}
                    gap={6}
                    fontSize={28}
                    headerRows={1}
                    headerCols={1}
                />
            </Panel>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={530}
                    padding={14}
                    gap={10}
                    tone="purple"
                    titleFontSize={32}
                    title="Pass 2: Scan block_totals"
                >
                    <Row gap={12} align="center" justify="center">
                        <BadgePill c={c} text="totals [7, 4]" tone="blue" fontSize={28} />
                        <Arrow c={c} direction="right" length={24} />
                        <BadgePill c={c} text="offsets [0, +7]" tone="warm" fontSize={28} />
                    </Row>
                    <TextLabel
                        c={c}
                        text="exclusive_scan([7, 4]) = [0, 7]"
                        fontSize={28}
                        align="center"
                    />
                </Panel>
                <Panel
                    c={c}
                    width={364}
                    padding={14}
                    gap={10}
                    tone="green"
                    titleFontSize={32}
                    title="Pass 3: Broadcast add"
                >
                    <TextLabel c={c} text="Block 0 adds +0" fontSize={28} />
                    <BadgePill c={c} text="Block 1 adds +7" tone="warm" fontSize={28} />
                </Panel>
            </Row>
            <Panel
                c={c}
                width={908}
                padding={14}
                gap={8}
                tone="green"
                titleFontSize={32}
                title="Final global exclusive prefix sum"
            >
                <Grid
                    c={c}
                    rows={pass3Rows}
                    cellWidth={88}
                    cellHeight={42}
                    gap={6}
                    fontSize={28}
                    headerCols={1}
                />
            </Panel>
        </Scene>
    )
}

export default create('dark')
