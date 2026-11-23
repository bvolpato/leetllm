import React from 'react'
import { Column, FlowArrow, Panel, Row, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const width = 960
export const height = 640
export const alt =
    'Three phase-order flows with equal spacing (no time scale): cold PTX runs through process init, lazy module load, driver PTX JIT, cache write, first launch, and warm run; compatible cubin follows init, lazy module load, skipped JIT, first launch, and warm run; and the bottom synchronized warm interval isolates pre-run sync, timed warm runs, and post-run sync.'

const box = (
    c: Parameters<Parameters<typeof defineIllustration>[0]>[0],
    title: string,
    sub: string,
    tone: 'blue' | 'purple' | 'green' | 'warm' | 'cyan' | 'neutral',
    w: number,
) => (
    <Panel c={c} title={title} titleFontSize={30} tone={tone} padding={8} gap={2} width={w}>
        <TextLabel text={sub} c={c} fontSize={29} color={c.textMuted} />
    </Panel>
)

const illustration = defineIllustration((c) => {
    return (
        <Scene c={c} padding={16} gap={14} contentWidth={width - 32} align="center">
            <Column gap={14} width={width - 32}>
                <Panel
                    c={c}
                    title="Cold PTX path (event order, equal spacing)"
                    titleFontSize={31}
                    tone="warm"
                    padding={10}
                    gap={8}
                    width={width - 32}
                >
                    <Row gap={4} align="center">
                        {box(c, 'Init', 'ctx', 'neutral', 112)}
                        <FlowArrow direction="right" length={8} c={c} tone="warm" />
                        {box(c, 'Load', 'lazy', 'neutral', 120)}
                        <FlowArrow direction="right" length={8} c={c} tone="warm" />
                        {box(c, 'PTX JIT', 'driver', 'warm', 162)}
                        <FlowArrow direction="right" length={8} c={c} tone="warm" />
                        {box(c, 'Cache', 'write', 'purple', 132)}
                        <FlowArrow direction="right" length={8} c={c} tone="blue" />
                        {box(c, 'Call 1', 'launch', 'blue', 132)}
                        <FlowArrow direction="right" length={8} c={c} tone="green" />
                        {box(c, 'Warm', 'hit', 'green', 124)}
                    </Row>
                </Panel>

                <Panel
                    c={c}
                    title="Compatible cubin path (skips JIT; lazy load)"
                    titleFontSize={31}
                    tone="green"
                    padding={10}
                    gap={8}
                    width={width - 32}
                >
                    <Row gap={4} align="center">
                        {box(c, 'Init', 'ctx', 'neutral', 118)}
                        <FlowArrow direction="right" length={10} c={c} tone="green" />
                        {box(c, 'Load', 'lazy', 'neutral', 122)}
                        <FlowArrow direction="right" length={10} c={c} tone="green" />
                        {box(c, 'Direct cubin match', 'skips JIT and cache', 'cyan', 326)}
                        <FlowArrow direction="right" length={10} c={c} tone="blue" />
                        {box(c, 'Call 1', 'launch', 'blue', 134)}
                        <FlowArrow direction="right" length={10} c={c} tone="green" />
                        {box(c, 'Warm', 'hit', 'green', 126)}
                    </Row>
                </Panel>

                <Panel
                    c={c}
                    title="Synchronized warm window (after warmup)"
                    titleFontSize={31}
                    tone="blue"
                    padding={10}
                    gap={8}
                    width={width - 32}
                >
                    <Row gap={8} align="center">
                        {box(c, 'Start sync', 'warmup done', 'blue', 268)}
                        <FlowArrow direction="right" length={20} c={c} tone="blue" />
                        {box(c, 'Timed kernel runs', 'steady state', 'green', 292)}
                        <FlowArrow direction="right" length={20} c={c} tone="blue" />
                        {box(c, 'End sync', 'stop timer', 'blue', 268)}
                    </Row>
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
