import React from 'react'
import {
    BadgePill,
    Column,
    DataTable,
    Grid,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 1020
export const height = 810
export const alt =
    'Aligned FP32 warp sector layout for M=32, N=K=64: 16x16 strided lanes split rows by 256 bytes, requesting 16 A, 1 B, and 16 C sectors (33 total); 32x8 coalesced lanes pack row 0 contiguously, requesting 1 broadcast A sector, 4 B sectors, and 4 C sectors (9 total). Five lane byte-offset triples (L0, L1, L8, L16, L31) and sector split bars are shown.'

const sectorCell = (label: string, tone: 'warm' | 'cyan' | 'green' | 'neutral') => ({
    label,
    tone,
})

const stridedSectors = [
    [
        sectorCell('S0', 'warm'),
        sectorCell('+7', 'neutral'),
        sectorCell('S8', 'warm'),
        sectorCell('...', 'neutral'),
        sectorCell('S120', 'warm'),
    ],
    [
        sectorCell('S0', 'cyan'),
        sectorCell('--', 'neutral'),
        sectorCell('--', 'neutral'),
        sectorCell('--', 'neutral'),
        sectorCell('--', 'neutral'),
    ],
    [
        sectorCell('S0', 'green'),
        sectorCell('+7', 'neutral'),
        sectorCell('S8', 'green'),
        sectorCell('...', 'neutral'),
        sectorCell('S120', 'green'),
    ],
]

const coalescedSectors = [
    [
        sectorCell('S0', 'warm'),
        sectorCell('--', 'neutral'),
        sectorCell('--', 'neutral'),
        sectorCell('--', 'neutral'),
    ],
    [
        sectorCell('S0', 'cyan'),
        sectorCell('S1', 'cyan'),
        sectorCell('S2', 'cyan'),
        sectorCell('S3', 'cyan'),
    ],
    [
        sectorCell('S0', 'green'),
        sectorCell('S1', 'green'),
        sectorCell('S2', 'green'),
        sectorCell('S3', 'green'),
    ],
]

const traceRows = [
    ['Lane', 'Strided A/B/C', 'Coal A/B/C'],
    ['L0', '0/0/0', '0/0/0'],
    ['L1', '256/0/256', '0/4/4'],
    ['L8', '2048/0/2048', '0/32/32'],
    ['L16', '0/4/4', '0/64/64'],
    ['L31', '3840/4/3844', '0/124/124'],
]

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 3.05)
    return (
        <Scene c={c} padding={14} gap={10}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={500}
                    tone="warm"
                    padding={10}
                    gap={6}
                    title="16x16 Strided (33 sectors)"
                    titleFontSize={30}
                >
                    <Row gap={8} align="center">
                        <Column gap={24}>
                            <TextLabel
                                c={c}
                                text="A"
                                fontSize={30}
                                fontWeight={700}
                                color={c.warning}
                            />
                            <TextLabel
                                c={c}
                                text="B"
                                fontSize={30}
                                fontWeight={700}
                                color={c.info}
                            />
                            <TextLabel
                                c={c}
                                text="C"
                                fontSize={30}
                                fontWeight={700}
                                color={c.positive}
                            />
                        </Column>
                        <Grid
                            c={c}
                            rows={stridedSectors}
                            cellWidth={82}
                            cellHeight={52}
                            gap={4}
                            fontSize={30}
                        />
                    </Row>
                    <Row gap={8}>
                        <BadgePill c={c} text="A: 16" tone="warm" fontSize={30} height={38} />
                        <BadgePill c={c} text="B: 1" tone="cyan" fontSize={30} height={38} />
                        <BadgePill c={c} text="C: 16" tone="green" fontSize={30} height={38} />
                    </Row>
                </Panel>

                <Panel
                    c={c}
                    width={478}
                    tone="green"
                    padding={10}
                    gap={6}
                    title="32x8 Coalesced (9 sectors)"
                    titleFontSize={30}
                >
                    <Row gap={8} align="center">
                        <Column gap={24}>
                            <TextLabel
                                c={c}
                                text="A"
                                fontSize={30}
                                fontWeight={700}
                                color={c.warning}
                            />
                            <TextLabel
                                c={c}
                                text="B"
                                fontSize={30}
                                fontWeight={700}
                                color={c.info}
                            />
                            <TextLabel
                                c={c}
                                text="C"
                                fontSize={30}
                                fontWeight={700}
                                color={c.positive}
                            />
                        </Column>
                        <Grid
                            c={c}
                            rows={coalescedSectors}
                            cellWidth={98}
                            cellHeight={52}
                            gap={5}
                            fontSize={30}
                        />
                    </Row>
                    <Row gap={8}>
                        <BadgePill c={c} text="A: 1" tone="warm" fontSize={30} height={38} />
                        <BadgePill c={c} text="B: 4" tone="cyan" fontSize={30} height={38} />
                        <BadgePill c={c} text="C: 4" tone="green" fontSize={30} height={38} />
                    </Row>
                </Panel>
            </Row>

            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={580}
                    tone="neutral"
                    padding={10}
                    gap={6}
                    title="Byte Offsets at k=0 (FP32)"
                    titleFontSize={30}
                >
                    <DataTable
                        c={c}
                        rows={traceRows}
                        firstColWidth={78}
                        cellWidth={228}
                        cellHeight={38}
                        gap={4}
                        fontSize={30}
                        headerRows={1}
                        headerCols={1}
                        align={['left', 'right', 'right']}
                    />
                </Panel>

                <Panel
                    c={c}
                    width={398}
                    tone="neutral"
                    padding={10}
                    gap={8}
                    title="32B Sector Split"
                    titleFontSize={30}
                >
                    <StackedBar
                        c={c}
                        width={370}
                        height={42}
                        title="Strided: 33"
                        showLegend={false}
                        segments={[
                            { label: 'A', value: 16, color: c.warning, valueLabel: '16' },
                            { label: 'B', value: 1, color: c.info, valueLabel: '1' },
                            { label: 'C', value: 16, color: c.positive, valueLabel: '16' },
                        ]}
                    />
                    <StackedBar
                        c={c}
                        width={370}
                        height={42}
                        title="Coalesced: 9"
                        showLegend={false}
                        segments={[
                            { label: 'A', value: 1, color: c.warning, valueLabel: '1' },
                            { label: 'B', value: 4, color: c.info, valueLabel: '4' },
                            { label: 'C', value: 4, color: c.positive, valueLabel: '4' },
                        ]}
                    />
                    <BadgePill
                        c={c}
                        text="3.67x fewer sectors"
                        tone="green"
                        fontSize={30}
                        height={38}
                        filled
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
