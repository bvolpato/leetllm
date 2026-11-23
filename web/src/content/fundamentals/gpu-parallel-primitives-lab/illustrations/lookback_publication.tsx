import React from 'react'
import {
    Arrow,
    BadgePill,
    Card,
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
    'Top panel shows Tile 3 starting with local aggregate 2, reading Tile 2 aggregate A=3 (running 5), Tile 1 aggregate A=4 (running 9), and Tile 0 prefix P=7 (inclusive prefix 16, exclusive offset 14). Bottom panel shows write-before-release on the writer side matching acquire-before-read on the consumer side; polling flags alone gives no progress guarantee.'

const cell = (label: string, tone?: GridCell['tone']): GridCell => ({
    label,
    tone,
})

const walkRows: Array<Array<string | GridCell>> = [
    ['Tile', 'T0', 'T1', 'T2', 'T3'],
    [
        'State',
        cell('P: 7', 'green'),
        cell('A: 4', 'blue'),
        cell('A: 3', 'blue'),
        cell('X: loc 2', 'warm'),
    ],
    ['Walk', cell('sum = 16', 'green'), '5 + 4 = 9', '2 + 3 = 5', 'start 2'],
]

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Panel
                c={c}
                width={908}
                padding={14}
                gap={10}
                tone="purple"
                titleFontSize={32}
                title="Tile 3 decoupled look-back walk (left until P)"
            >
                <TextLabel
                    c={c}
                    text="X = wait, A = aggregate ready, P = inclusive prefix ready"
                    fontSize={28}
                />
                <Grid
                    c={c}
                    rows={walkRows}
                    cellWidth={168}
                    cellHeight={48}
                    gap={8}
                    fontSize={28}
                    headerRows={1}
                    headerCols={1}
                />
                <Row gap={12} align="center" justify="center">
                    <BadgePill
                        c={c}
                        text="Tile 3 exclusive offset = 14"
                        tone="warm"
                        fontSize={28}
                    />
                    <BadgePill
                        c={c}
                        text="Tile 3 inclusive prefix = 16"
                        tone="green"
                        fontSize={28}
                    />
                </Row>
            </Panel>
            <Panel
                c={c}
                width={908}
                padding={14}
                gap={10}
                tone="blue"
                titleFontSize={32}
                title="Memory ordering protocol (not plain flag polling)"
            >
                <Row gap={8} align="center" justify="space-between">
                    <Card c={c} width={196} padding={10} gap={4} tone="blue" title="1. Store">
                        <TextLabel c={c} text="write payload" fontSize={28} />
                    </Card>
                    <Arrow c={c} direction="right" length={16} />
                    <Card c={c} width={196} padding={10} gap={4} tone="purple" title="2. Release">
                        <TextLabel c={c} text="publish A/P" fontSize={28} />
                    </Card>
                    <Arrow c={c} direction="right" length={16} />
                    <Card c={c} width={196} padding={10} gap={4} tone="warm" title="3. Acquire">
                        <TextLabel c={c} text="spin while X" fontSize={28} />
                    </Card>
                    <Arrow c={c} direction="right" length={16} />
                    <Card c={c} width={196} padding={10} gap={4} tone="green" title="4. Read">
                        <TextLabel c={c} text="data visible" fontSize={28} />
                    </Card>
                </Row>
                <TextLabel
                    c={c}
                    text="Plain polling lacks ordering and progress guarantees"
                    fontSize={28}
                    align="center"
                />
            </Panel>
        </Scene>
    )
}

export default create('dark')
