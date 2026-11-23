import React from 'react'
import {
    BadgePill,
    Column,
    Flow,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 1020
export const height = 800
export const alt =
    '16x16 shared-memory tile reuse and two-barrier K-panel loop: As and Bs stage 256 FP32 values each (2,048 bytes total) to compute 256 outputs of C with 8,192 FLOPs (4.0 FLOP/B). Four stages sequence Load/zero-fill, RAW sync, Compute, and WAR sync, while edge threads with row >= M zero-fill As, stage valid Bs, reach both barriers, and skip invalid C stores.'

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 3.05)
    return (
        <Scene c={c} padding={14} gap={10}>
            <Panel
                c={c}
                width={992}
                tone="neutral"
                padding={10}
                gap={8}
                title="16x16 Shared Panel: 2,048 B -> 8,192 FLOPs (4.0 FLOP/B)"
                titleFontSize={30}
            >
                <Row gap={10} align="center" justify="space-between">
                    <TiledMatrix
                        c={c}
                        rows={16}
                        cols={16}
                        cellSize={9}
                        gap={2}
                        tone="warm"
                        title="As (16x16)"
                        regions={[
                            { rowStart: 7, rowEnd: 8, colStart: 3, colEnd: 4, tone: 'red' },
                            { rowStart: 7, rowEnd: 8, colStart: 0, colEnd: 16, tone: 'warm' },
                        ]}
                    />
                    <TextLabel c={c} text="x" fontSize={32} fontWeight={700} color={c.textMuted} />
                    <TiledMatrix
                        c={c}
                        rows={16}
                        cols={16}
                        cellSize={9}
                        gap={2}
                        tone="cyan"
                        title="Bs (16x16)"
                        regions={[
                            { rowStart: 3, rowEnd: 4, colStart: 7, colEnd: 8, tone: 'red' },
                            { rowStart: 0, rowEnd: 16, colStart: 7, colEnd: 8, tone: 'cyan' },
                        ]}
                    />
                    <FlowArrow c={c} direction="right" length={22} tone="green" />
                    <TiledMatrix
                        c={c}
                        rows={16}
                        cols={16}
                        cellSize={9}
                        gap={2}
                        tone="green"
                        title="C (16x16)"
                        regions={[
                            { rowStart: 7, rowEnd: 8, colStart: 7, colEnd: 8, tone: 'green' },
                            { rowStart: 7, rowEnd: 8, colStart: 0, colEnd: 16, tone: 'warm' },
                            { rowStart: 0, rowEnd: 16, colStart: 7, colEnd: 8, tone: 'cyan' },
                        ]}
                    />
                    <Column gap={8}>
                        <BadgePill
                            c={c}
                            text="As: 256 (1024B)"
                            tone="warm"
                            fontSize={30}
                            height={40}
                        />
                        <BadgePill
                            c={c}
                            text="Bs: 256 (1024B)"
                            tone="cyan"
                            fontSize={30}
                            height={40}
                        />
                        <BadgePill
                            c={c}
                            text="8,192 FLOPs"
                            tone="green"
                            fontSize={30}
                            height={40}
                        />
                        <BadgePill
                            c={c}
                            text="4.0 FLOP/B"
                            tone="red"
                            fontSize={30}
                            height={40}
                            filled
                        />
                    </Column>
                </Row>
            </Panel>

            <Panel
                c={c}
                width={992}
                tone="neutral"
                padding={10}
                gap={8}
                title="Two-Barrier K-Panel Loop"
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
                            title: 'Stage',
                            tone: 'cyan',
                            minWidth: 132,
                            padding: 6,
                            lines: ['zero OOB'],
                        },
                        {
                            eyebrow: '02',
                            title: 'RAW',
                            tone: 'warm',
                            minWidth: 132,
                            padding: 6,
                            lines: ['tiles ready'],
                        },
                        {
                            eyebrow: '03',
                            title: 'Math',
                            tone: 'green',
                            minWidth: 132,
                            padding: 6,
                            lines: ['16 FMAs'],
                        },
                        {
                            eyebrow: '04',
                            title: 'WAR',
                            tone: 'red',
                            minWidth: 132,
                            padding: 6,
                            lines: ['safe reuse'],
                        },
                    ]}
                />
            </Panel>

            <Panel
                c={c}
                width={992}
                tone="warm"
                padding={10}
                gap={6}
                title="Edge Thread Rule (row >= M, col < N)"
                titleFontSize={30}
            >
                <Row gap={8} align="center" justify="space-between">
                    <BadgePill c={c} text="Zero As" tone="warm" fontSize={30} height={40} />
                    <FlowArrow c={c} direction="right" length={16} tone="neutral" />
                    <BadgePill c={c} text="Load Bs" tone="cyan" fontSize={30} height={40} />
                    <FlowArrow c={c} direction="right" length={16} tone="neutral" />
                    <BadgePill c={c} text="Both barriers" tone="green" fontSize={30} height={40} />
                    <FlowArrow c={c} direction="right" length={16} tone="neutral" />
                    <BadgePill c={c} text="Skip C" tone="red" fontSize={30} height={40} />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
