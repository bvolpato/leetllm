import React from 'react'
import {
    BadgePill,
    DataTable,
    Flow,
    Grid,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 1020
export const height = 810
export const alt =
    'Asynchronous tile-stage ownership lifecycle, double-buffered Slot 0 and Slot 1 overlap, and Ampere/Hopper/Blackwell hardware paths. Six sequential stages trace Acquire empty, Issue async copy, Wait copy readable, Consume/accumulate, Wait consumers done, and Release reusable. Double-buffer schedule avoids the early-release race before step 5, and comparison table tracks Pre-Ampere, Ampere cp.async, Hopper TMA/wgmma, and Blackwell tcgen05.'

const stageCell = (label: string, tone: 'warm' | 'cyan' | 'green' | 'red' | 'neutral') => ({
    label,
    tone,
})

const bufferGrid = [
    ['Slot', 'Int A', 'Guard', 'Int B'].map((h) => stageCell(h, 'neutral')),
    [
        stageCell('S0', 'neutral'),
        stageCell('Read', 'green'),
        stageCell('Wait5', 'warm'),
        stageCell('Copy', 'cyan'),
    ],
    [
        stageCell('S1', 'neutral'),
        stageCell('Copy', 'cyan'),
        stageCell('Ready', 'green'),
        stageCell('Read', 'green'),
    ],
]

const archRows = [
    ['Tier', 'Path', 'Guard'],
    ['Pre-Amp', 'G->R->S', 'sync'],
    ['Ampere', 'cp.async', 'wait_grp'],
    ['Hopper', 'TMA->TC', 'parity'],
    ['Blackwl', '->TMEM', 'tcgen05'],
]

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 3.05)
    return (
        <Scene c={c} padding={14} gap={10}>
            <Panel
                c={c}
                width={992}
                tone="neutral"
                padding={10}
                gap={6}
                title="Six Asynchronous Stage-Ownership Phases"
                titleFontSize={30}
            >
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={4}
                    connectorLength={12}
                    stages={[
                        {
                            eyebrow: '01',
                            title: 'Acquire',
                            tone: 'neutral',
                            minWidth: 190,
                            padding: 6,
                            lines: ['claim slot'],
                        },
                        {
                            eyebrow: '02',
                            title: 'Issue',
                            tone: 'cyan',
                            minWidth: 190,
                            padding: 6,
                            lines: ['G -> S copy'],
                        },
                        {
                            eyebrow: '03',
                            title: 'Wait read',
                            tone: 'warm',
                            minWidth: 190,
                            padding: 6,
                            lines: ['phase ready'],
                        },
                    ]}
                />
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={4}
                    connectorLength={12}
                    stages={[
                        {
                            eyebrow: '04',
                            title: 'Compute',
                            tone: 'green',
                            minWidth: 190,
                            padding: 6,
                            lines: ['MMA / WMMA'],
                        },
                        {
                            eyebrow: '05',
                            title: 'Wait done',
                            tone: 'warm',
                            minWidth: 190,
                            padding: 6,
                            lines: ['reads done'],
                        },
                        {
                            eyebrow: '06',
                            title: 'Release',
                            tone: 'red',
                            minWidth: 190,
                            padding: 6,
                            lines: ['slot free'],
                        },
                    ]}
                />
            </Panel>

            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={464}
                    tone="cyan"
                    padding={10}
                    gap={8}
                    title="Double-Buffer Slots"
                    titleFontSize={30}
                >
                    <Grid
                        c={c}
                        rows={bufferGrid}
                        cellWidth={102}
                        cellHeight={42}
                        gap={4}
                        fontSize={30}
                        headerRows={1}
                        headerCols={1}
                    />
                    <BadgePill
                        c={c}
                        text="Early release before 5 races!"
                        tone="red"
                        fontSize={30}
                        height={38}
                    />
                </Panel>

                <Panel
                    c={c}
                    width={514}
                    tone="neutral"
                    padding={10}
                    gap={6}
                    title="Hardware Async Tiers"
                    titleFontSize={30}
                >
                    <DataTable
                        c={c}
                        rows={archRows}
                        firstColWidth={130}
                        cellWidth={172}
                        cellHeight={38}
                        gap={4}
                        fontSize={30}
                        headerRows={1}
                        headerCols={1}
                        align={['left', 'left', 'right']}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
