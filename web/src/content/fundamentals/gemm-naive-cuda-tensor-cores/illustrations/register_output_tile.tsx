import React from 'react'
import {
    BadgePill,
    BarChart,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TiledMatrix,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 1020
export const height = 780
export const alt =
    '16x64 register output tile ownership and operand-reuse comparison: thread (tx=1, ty=2) reuses one As[2, k] float across four Bs[k, 1/17/33/49] floats to update four C accumulators (8 FLOPs per 20 bytes = 0.40 FLOP/B). Bar chart compares per-thread operand demand across 1x1 Naive (0.25 FLOP/B), 1x4 Lab (0.40 FLOP/B), and 8x8 Tile (2.00 FLOP/B).'

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 3.05)
    return (
        <Scene c={c} padding={14} gap={12}>
            <Panel
                c={c}
                width={992}
                tone="green"
                padding={10}
                gap={8}
                title="16x64 C Tile: Thread (1,2) Owns Row 2 at Cols 1, 17, 33, 49"
                titleFontSize={30}
            >
                <Row gap={16} justify="space-around">
                    {[0, 16, 32, 48].map((offset) => (
                        <TiledMatrix
                            key={offset}
                            c={c}
                            rows={16}
                            cols={16}
                            cellSize={8}
                            gap={1}
                            tone="cyan"
                            title={`+${offset}`}
                            regions={[
                                { rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, tone: 'red' },
                                { rowStart: 2, rowEnd: 3, colStart: 0, colEnd: 16, tone: 'green' },
                            ]}
                        />
                    ))}
                </Row>
            </Panel>

            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={482}
                    tone="neutral"
                    padding={12}
                    gap={12}
                    title="Per-k Register Reuse"
                    titleFontSize={30}
                >
                    <Row gap={8} align="center" justify="space-between">
                        <BadgePill c={c} text="As[2,k]" tone="warm" fontSize={30} height={46} />
                        <BadgePill c={c} text="+ 4 Bs" tone="cyan" fontSize={30} height={46} />
                        <FlowArrow c={c} direction="right" length={18} tone="green" />
                        <BadgePill c={c} text="4 acc" tone="green" fontSize={30} height={46} />
                    </Row>
                    <Column gap={8}>
                        <BadgePill
                            c={c}
                            text="5 floats (20 B) -> 8 FLOPs"
                            tone="cyan"
                            fontSize={30}
                            height={42}
                        />
                        <BadgePill
                            c={c}
                            text="Intensity = 0.40 FLOP/B"
                            tone="green"
                            fontSize={30}
                            height={42}
                            filled
                        />
                        <BadgePill
                            c={c}
                            text="8x8: 16 floats -> 128F"
                            tone="neutral"
                            fontSize={30}
                            height={42}
                        />
                    </Column>
                </Panel>

                <Panel
                    c={c}
                    width={496}
                    tone="cyan"
                    padding={12}
                    gap={8}
                    title="Per-Thread Reuse (FLOP/B)"
                    titleFontSize={30}
                >
                    <BarChart
                        c={c}
                        width={468}
                        height={230}
                        min={0}
                        max={2.4}
                        showValues
                        data={[
                            { label: '1x1', value: 0.25, color: c.warning, valueLabel: '.25' },
                            { label: '1x4', value: 0.4, color: c.info, valueLabel: '.40' },
                            { label: '8x8', value: 2.0, color: c.positive, valueLabel: '2.0' },
                        ]}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
