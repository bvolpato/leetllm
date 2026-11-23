import React from 'react'
import {
    BadgePill,
    BarChart,
    DataTable,
    Grid,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 1020
export const height = 780
export const alt =
    'Shared-memory bank layout across a 32-lane warp: 16x16 As broadcasts two half-warp words and Bs covers 16 banks x 2 with zero conflicts, whereas stride-32 tile[32][32] column reads collide 32-way on one bank. Comparing column k bank mappings shows Grouped XOR still hits 4-way conflicts while Pad [32][33] and Full XOR (col ^ row) spread all 32 banks for 1-wave access.'

const bankCell = (label: string, tone: 'warm' | 'cyan' | 'green' | 'red' | 'neutral') => ({
    label,
    tone,
})

const conflictGrid = [
    ['r\\k', 'k0', 'k1', 'k2', 'k3'].map((h) => bankCell(h, 'neutral')),
    [
        bankCell('r0', 'neutral'),
        bankCell('b0', 'cyan'),
        bankCell('b1', 'cyan'),
        bankCell('b2', 'cyan'),
        bankCell('b3', 'red'),
    ],
    [
        bankCell('r1', 'neutral'),
        bankCell('b0', 'cyan'),
        bankCell('b1', 'cyan'),
        bankCell('b2', 'cyan'),
        bankCell('b3', 'red'),
    ],
    [
        bankCell('r2', 'neutral'),
        bankCell('b0', 'cyan'),
        bankCell('b1', 'cyan'),
        bankCell('b2', 'cyan'),
        bankCell('b3', 'red'),
    ],
]

const layoutRows = [
    ['Layout', 'Banks', 'Txns'],
    ['tile[32][32]', '3,3,3,3', '32-way'],
    ['k^((r//4)%8)', '3,3,3,3', '4-way'],
    ['Pad [32][33]', '3,4,5,6', '1 wave'],
    ['XOR (k^r)', '3,2,1,0', '1 wave'],
]

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 3.05)
    return (
        <Scene c={c} padding={14} gap={12}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={488}
                    tone="green"
                    padding={12}
                    gap={10}
                    title="16x16 Block: 0 Conflicts"
                    titleFontSize={30}
                >
                    <Row gap={8} align="center">
                        <BadgePill c={c} text="As[ty][3]" tone="warm" fontSize={30} height={42} />
                        <BadgePill
                            c={c}
                            text="ty0->b3, ty1->b19"
                            tone="green"
                            fontSize={30}
                            height={42}
                        />
                    </Row>
                    <Row gap={8} align="center">
                        <BadgePill c={c} text="Bs[3][tx]" tone="cyan" fontSize={30} height={42} />
                        <BadgePill
                            c={c}
                            text="b16..31 x 2"
                            tone="green"
                            fontSize={30}
                            height={42}
                        />
                    </Row>
                    <BadgePill
                        c={c}
                        text="Broadcasts merge in 1 wave"
                        tone="green"
                        fontSize={30}
                        height={42}
                        filled
                    />
                </Panel>

                <Panel
                    c={c}
                    width={490}
                    tone="red"
                    padding={12}
                    gap={10}
                    title="Stride-32 Col Read: 32-Way"
                    titleFontSize={30}
                >
                    <Grid
                        c={c}
                        rows={conflictGrid}
                        cellWidth={84}
                        cellHeight={42}
                        gap={4}
                        fontSize={30}
                        headerRows={1}
                        headerCols={1}
                    />
                    <BadgePill
                        c={c}
                        text="All 32 lanes hit Bank 3 (32x)"
                        tone="red"
                        fontSize={30}
                        height={42}
                    />
                </Panel>
            </Row>

            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={554}
                    tone="neutral"
                    padding={12}
                    gap={8}
                    title="Column k=3 Banks (r = 0..3)"
                    titleFontSize={30}
                >
                    <DataTable
                        c={c}
                        rows={layoutRows}
                        firstColWidth={184}
                        cellWidth={164}
                        cellHeight={46}
                        gap={4}
                        fontSize={30}
                        headerRows={1}
                        headerCols={1}
                        align={['left', 'center', 'right']}
                    />
                </Panel>

                <Panel
                    c={c}
                    width={424}
                    tone="cyan"
                    padding={12}
                    gap={8}
                    title="Bank Waves / Col Read"
                    titleFontSize={30}
                >
                    <BarChart
                        c={c}
                        width={396}
                        height={270}
                        min={0}
                        max={36}
                        showValues
                        data={[
                            { label: 'S32', value: 32, color: c.critical, valueLabel: '32' },
                            { label: 'Grp', value: 4, color: c.warning, valueLabel: '4' },
                            { label: 'P33', value: 1, color: c.positive, valueLabel: '1' },
                            { label: 'XOR', value: 1, color: c.positive, valueLabel: '1' },
                        ]}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
