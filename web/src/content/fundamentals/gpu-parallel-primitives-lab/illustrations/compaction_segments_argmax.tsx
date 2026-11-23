import React from 'react'
import {
    Arrow,
    BadgePill,
    Column,
    DataTable,
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
    'Left panel shows stream compaction keeping positive elements of [3, -1, 4, 1, 5, -9, 2, 6] at exclusive scan offsets [0, 1, 1, 2, 3, 4, 4, 5] into [3, 4, 1, 5, 2, 6]. Right top shows segmented reduction over half-open ranges [0, 4) = 7, [4, 4) = 0, and [4, 8) = 4. Right bottom shows argmax returning (6, 7) and tie-breaking [6, -1, 6] to (6, 0).'

const cell = (label: string, tone?: GridCell['tone']): GridCell => ({
    label,
    tone,
})

const compactRows: Array<Array<string | GridCell>> = [
    ['i', 'x', 'keep', 'off', 'dest'],
    ['0', '3', cell('1', 'green'), '0', 'out0'],
    ['1', '-1', cell('0', 'neutral'), '1', 'skip'],
    ['2', '4', cell('1', 'green'), '1', 'out1'],
    ['3', '1', cell('1', 'green'), '2', 'out2'],
    ['4', '5', cell('1', 'green'), '3', 'out3'],
    ['5', '-9', cell('0', 'neutral'), '4', 'skip'],
    ['6', '2', cell('1', 'green'), '4', 'out4'],
    ['7', '6', cell('1', 'green'), '5', 'out5'],
]

const segmentRows: Array<Array<string>> = [
    ['Range', 'Slice', 'Sum'],
    ['[0, 4)', '3, -1, 4, 1', '7'],
    ['[4, 4)', 'empty', '0'],
    ['[4, 8)', '5, -9, 2, 6', '4'],
]

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={8}
                    tone="purple"
                    titleFontSize={32}
                    title="Stream compaction"
                >
                    <Grid
                        c={c}
                        rows={compactRows}
                        cellWidth={76}
                        cellHeight={42}
                        gap={5}
                        fontSize={28}
                        headerRows={1}
                    />
                    <Arrow c={c} direction="down" length={18} />
                    <Grid
                        c={c}
                        rows={[['3', '4', '1', '5', '2', '6'].map((v) => cell(v, 'green'))]}
                        cellWidth={62}
                        cellHeight={42}
                        gap={6}
                        fontSize={28}
                    />
                </Panel>
                <Column width={447} gap={14}>
                    <Panel
                        c={c}
                        width={447}
                        padding={14}
                        gap={10}
                        tone="blue"
                        titleFontSize={32}
                        title="Segmented reduction"
                    >
                        <DataTable
                            c={c}
                            rows={segmentRows}
                            cellHeight={44}
                            gap={6}
                            fontSize={28}
                            headerRows={1}
                            align={['left', 'left', 'right']}
                            width={415}
                        />
                        <TextLabel
                            c={c}
                            text="Offsets [0, 4, 4, 8] give [4, 4) sum 0"
                            fontSize={28}
                            align="center"
                        />
                    </Panel>
                    <Panel
                        c={c}
                        width={447}
                        padding={14}
                        gap={12}
                        tone="green"
                        titleFontSize={32}
                        title="Argmax (value, index)"
                    >
                        <Row gap={10} align="center" justify="center">
                            <BadgePill c={c} text="[3..-9, 2, 6]" fontSize={28} />
                            <Arrow c={c} direction="right" length={24} />
                            <BadgePill c={c} text="(6, 7)" tone="green" fontSize={28} />
                        </Row>
                        <Row gap={10} align="center" justify="center">
                            <BadgePill c={c} text="[6, -1, 6]" fontSize={28} />
                            <Arrow c={c} direction="right" length={24} />
                            <BadgePill c={c} text="(6, 0)" tone="warm" fontSize={28} />
                        </Row>
                        <TextLabel
                            c={c}
                            text="Smaller index breaks value ties"
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
