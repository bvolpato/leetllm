import React from 'react'
import {
    Column,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 960
export const height = 780
export const alt =
    'Top row traces Triton MLIR lowering across TTIR, TTGIR layout, LLVM IR, PTX, and cubin. Bottom left shows a 4x4 TritonGPU tile assigning rows 0-3, 4-7, 8-11, and 12-15 to lanes L0 through L3, with zero shared memory for plain vector add. Bottom right uses lifetime bars to show nonoverlapping virtual values A and B sharing physical register r0, while overlapping lifetimes occupy r0 and r1 concurrently.'

const stage = (
    c: Parameters<Parameters<typeof defineIllustration>[0]>[0],
    title: string,
    sub: string,
    tone: 'blue' | 'purple' | 'green' | 'warm' | 'cyan',
    w: number,
) => (
    <Panel c={c} title={title} titleFontSize={30} tone={tone} padding={8} gap={2} width={w}>
        <TextLabel text={sub} c={c} fontSize={29} color={c.textMuted} />
    </Panel>
)

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 2.85)
    return (
        <Scene c={c} padding={16} gap={14} contentWidth={width - 32} align="center">
            <Column gap={14} width={width - 32}>
                <Panel
                    c={c}
                    title="Triton NVIDIA lowering pipeline"
                    titleFontSize={31}
                    tone="blue"
                    padding={10}
                    gap={8}
                    width={width - 32}
                >
                    <Row gap={4} align="center">
                        {stage(c, 'TTIR', 'block IR', 'blue', 156)}
                        <FlowArrow direction="right" length={10} c={c} tone="blue" />
                        {stage(c, 'TTGIR', 'lane map', 'cyan', 162)}
                        <FlowArrow direction="right" length={10} c={c} tone="purple" />
                        {stage(c, 'LLVM IR', 'smem', 'purple', 174)}
                        <FlowArrow direction="right" length={10} c={c} tone="warm" />
                        {stage(c, 'PTX', 'virtual', 'warm', 150)}
                        <FlowArrow direction="right" length={10} c={c} tone="green" />
                        {stage(c, 'cubin', 'ptxas', 'green', 150)}
                    </Row>
                </Panel>

                <Row gap={14} width={width - 32}>
                    <Panel
                        c={c}
                        title="TTGIR 4x4 lane layout"
                        titleFontSize={31}
                        tone="cyan"
                        padding={14}
                        gap={10}
                        width={457}
                    >
                        <Grid
                            c={c}
                            cellWidth={72}
                            cellHeight={44}
                            gap={6}
                            fontSize={29}
                            headerCols={1}
                            rows={[
                                [
                                    'L0',
                                    { label: '0', tone: 'blue' },
                                    { label: '1', tone: 'blue' },
                                    { label: '2', tone: 'blue' },
                                    { label: '3', tone: 'blue' },
                                ],
                                [
                                    'L1',
                                    { label: '4', tone: 'cyan' },
                                    { label: '5', tone: 'cyan' },
                                    { label: '6', tone: 'cyan' },
                                    { label: '7', tone: 'cyan' },
                                ],
                                [
                                    'L2',
                                    { label: '8', tone: 'green' },
                                    { label: '9', tone: 'green' },
                                    { label: '10', tone: 'green' },
                                    { label: '11', tone: 'green' },
                                ],
                                [
                                    'L3',
                                    { label: '12', tone: 'purple' },
                                    { label: '13', tone: 'purple' },
                                    { label: '14', tone: 'purple' },
                                    { label: '15', tone: 'purple' },
                                ],
                            ]}
                        />
                        <TextLabel
                            text="Vector add: 0 B smem"
                            c={c}
                            fontSize={29}
                            color={c.textMuted}
                        />
                    </Panel>

                    <Panel
                        c={c}
                        title="Live ranges set registers"
                        titleFontSize={31}
                        tone="warm"
                        padding={14}
                        gap={8}
                        width={457}
                    >
                        <TextLabel text="Disjoint: A, B share r0" c={c} fontSize={29} />
                        <StackedBar
                            c={c}
                            width={427}
                            height={40}
                            showLegend={false}
                            segments={[
                                { label: 'A', value: 42, valueLabel: 'A in r0', color: c.primary },
                                { label: 'idle', value: 16, valueLabel: '', color: c.neutral },
                                { label: 'B', value: 42, valueLabel: 'B in r0', color: c.info },
                            ]}
                        />
                        <TextLabel text="Overlap uses r0 and r1" c={c} fontSize={29} />
                        <StackedBar
                            c={c}
                            width={427}
                            height={38}
                            showLegend={false}
                            segments={[
                                {
                                    label: 'A',
                                    value: 74,
                                    valueLabel: 'A live r0',
                                    color: c.primary,
                                },
                                { label: 'free', value: 26, valueLabel: '', color: c.neutral },
                            ]}
                        />
                        <StackedBar
                            c={c}
                            width={427}
                            height={38}
                            showLegend={false}
                            segments={[
                                { label: 'pre', value: 28, valueLabel: '', color: c.neutral },
                                {
                                    label: 'B',
                                    value: 72,
                                    valueLabel: 'B live r1',
                                    color: c.warning,
                                },
                            ]}
                        />
                        <TextLabel
                            text="Concurrent live = 2 regs"
                            c={c}
                            fontSize={29}
                            color={c.textMuted}
                        />
                    </Panel>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
