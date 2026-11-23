import React from 'react'
import {
    BadgePill,
    BarChart,
    Column,
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
    'Zero-padded 16x16 GEMM tiling for 73x61x67 padded to 80x64x80: A becomes 5x5 tiles, B becomes 5x4 tiles, and C becomes 5x4 tiles cropped back to 73x61. For tile (bm=4, bn=3), four full K=16 panels precede tail panel p4 where only 9x3 of A and 3x13 of B are nonzero. Padding increases total GEMM FLOPs from 596,702 to 819,200 (+37.3%, versus +11.6% at 257x263x251).'

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 3.05)
    return (
        <Scene c={c} padding={14} gap={12}>
            <Panel
                c={c}
                width={992}
                tone="neutral"
                padding={10}
                gap={8}
                title="16x16 Zero-Padded Tiling: 73x61x67 -> 80x64x80"
                titleFontSize={30}
            >
                <Row gap={14} align="center" justify="space-around">
                    <TiledMatrix
                        c={c}
                        rows={5}
                        cols={5}
                        cellSize={22}
                        gap={3}
                        tone="neutral"
                        title="A: 80x80"
                        regions={[
                            { rowStart: 4, rowEnd: 5, colStart: 4, colEnd: 5, tone: 'red' },
                            { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 4, tone: 'cyan' },
                            { rowStart: 4, rowEnd: 5, colStart: 0, colEnd: 4, tone: 'warm' },
                            { rowStart: 0, rowEnd: 4, colStart: 4, colEnd: 5, tone: 'warm' },
                        ]}
                    />
                    <TextLabel c={c} text="x" fontSize={32} fontWeight={700} color={c.textMuted} />
                    <TiledMatrix
                        c={c}
                        rows={5}
                        cols={4}
                        cellSize={22}
                        gap={3}
                        tone="neutral"
                        title="B: 80x64"
                        regions={[
                            { rowStart: 4, rowEnd: 5, colStart: 3, colEnd: 4, tone: 'red' },
                            { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 3, tone: 'cyan' },
                            { rowStart: 4, rowEnd: 5, colStart: 0, colEnd: 3, tone: 'warm' },
                            { rowStart: 0, rowEnd: 4, colStart: 3, colEnd: 4, tone: 'warm' },
                        ]}
                    />
                    <FlowArrow c={c} direction="right" length={22} tone="green" />
                    <TiledMatrix
                        c={c}
                        rows={5}
                        cols={4}
                        cellSize={22}
                        gap={3}
                        tone="neutral"
                        title="C: crop"
                        regions={[
                            { rowStart: 4, rowEnd: 5, colStart: 3, colEnd: 4, tone: 'red' },
                            { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 3, tone: 'green' },
                            { rowStart: 4, rowEnd: 5, colStart: 0, colEnd: 3, tone: 'warm' },
                            { rowStart: 0, rowEnd: 4, colStart: 3, colEnd: 4, tone: 'warm' },
                        ]}
                    />
                </Row>
            </Panel>

            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={560}
                    tone="warm"
                    padding={12}
                    gap={10}
                    title="Corner tile bm=4, bn=3"
                    titleFontSize={30}
                >
                    <Row gap={6} align="center">
                        <BadgePill
                            c={c}
                            text="p0..p3: K=16"
                            tone="green"
                            fontSize={30}
                            height={42}
                        />
                        <FlowArrow c={c} direction="right" length={14} tone="warm" />
                        <BadgePill
                            c={c}
                            text="p4: 3+13 pad"
                            tone="warm"
                            fontSize={30}
                            height={42}
                        />
                    </Row>
                    <Column gap={8}>
                        <BadgePill
                            c={c}
                            text="p4: A[9x3] * B[3x13] -> 9x13 C"
                            tone="cyan"
                            fontSize={30}
                            height={42}
                        />
                        <BadgePill
                            c={c}
                            text="257x263x251 -> +11.6% FLOPs"
                            tone="neutral"
                            fontSize={30}
                            height={42}
                        />
                    </Column>
                </Panel>

                <Panel
                    c={c}
                    width={418}
                    tone="cyan"
                    padding={12}
                    gap={8}
                    title="Work, kFLOPs (+37.3%)"
                    titleFontSize={30}
                >
                    <BarChart
                        c={c}
                        width={388}
                        height={226}
                        min={0}
                        max={1200}
                        showGrid={false}
                        showValues
                        data={[
                            {
                                label: '73x61',
                                value: 596.7,
                                color: c.positive,
                                valueLabel: '597',
                            },
                            {
                                label: '80x64',
                                value: 819.2,
                                color: c.warning,
                                valueLabel: '819',
                            },
                        ]}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
