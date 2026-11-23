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
export const height = 740
export const alt =
    'Left panel traces warp 0 holding [1..8] in lanes 0 to 7 and zeros in lanes 8 to 31: offsets 16, 8, 4, 2, and 1 bring lane 0 from 1 through 1, 1, 6, and 16 to 36. Right panel shows eight warp leaders publishing [1..8] into shared warp_sums before __syncthreads(), then warp 0 padding lanes 8 to 31 with zero and summing to 36.'

const cell = (label: string, tone?: GridCell['tone']): GridCell => ({
    label,
    tone,
})

const laneZeroRows: Array<Array<string | GridCell>> = [
    ['Step', 'Off', 'L0', 'Read'],
    ['init', 'none', '1', 'x0=1'],
    ['1', '16', '1', 'L16=0'],
    ['2', '8', '1', 'L8=0'],
    ['3', '4', '6', 'L4=5'],
    ['4', '2', '16', 'L2=10'],
    ['5', '1', cell('36', 'green'), 'L1=20'],
]

const sharedRows: Array<Array<string | GridCell>> = [
    [cell('w0: 1', 'blue'), cell('w1: 2', 'blue'), cell('w2: 3', 'blue'), cell('w3: 4', 'blue')],
    [cell('w4: 5', 'blue'), cell('w5: 6', 'blue'), cell('w6: 7', 'blue'), cell('w7: 8', 'blue')],
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
                    gap={10}
                    tone="purple"
                    titleFontSize={32}
                    title="Stage 1: Warp 0 shuffle"
                >
                    <TextLabel c={c} text="L0..L7 load 1..8; L8..L31 pad 0" fontSize={28} />
                    <Grid
                        c={c}
                        rows={laneZeroRows}
                        cellWidth={96}
                        cellHeight={44}
                        gap={6}
                        fontSize={28}
                        headerRows={1}
                    />
                    <Arrow c={c} direction="down" length={18} />
                    <BadgePill
                        c={c}
                        text="Lane 0 stores warp_sums[id]"
                        tone="purple"
                        fontSize={28}
                    />
                </Panel>
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={10}
                    tone="blue"
                    titleFontSize={32}
                    title="Stage 2: Shared handoff"
                >
                    <TextLabel c={c} text="8 warp leaders write shared slots" fontSize={28} />
                    <Grid
                        c={c}
                        rows={sharedRows}
                        cellWidth={94}
                        cellHeight={48}
                        gap={6}
                        fontSize={28}
                    />
                    <TextLabel c={c} text="__syncthreads() barrier" fontSize={28} align="center" />
                    <Arrow c={c} direction="down" length={18} />
                    <BadgePill c={c} text="All 8 warp totals visible" tone="warm" fontSize={28} />
                    <Arrow c={c} direction="down" length={18} />
                    <TextLabel c={c} text="Warp 0: L0..L7 read; L8..L31 = 0" fontSize={28} />
                    <BadgePill c={c} text="Final block total: 36" tone="green" fontSize={28} />
                </Panel>
            </Row>
        </Scene>
    )
}

export default create('dark')
