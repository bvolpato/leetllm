import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 1000
export const height = 780
export const alt =
    'CUDA block 0 thread 1 lowers through NVVM IR and LLVM IR while Triton pid 0 offset 1 mask 1 lowers through TTIR, TTGIR, and LLVM IR into PTX. PTX loads x[1]=0.25 into %f1 and y[1]=-2 into %f2, adds to %f3=-1.75, and stores out[1]=-1.75. Toolkit ptxas allocates physical registers to build a target ELF cubin for GPU driver execution or nvdisasm SASS disassembly.'

const stage = (
    c: Parameters<Parameters<typeof defineIllustration>[0]>[0],
    title: string,
    sub: string,
    tone: 'blue' | 'purple' | 'green' | 'warm' | 'cyan' | 'neutral',
    w: number,
) => (
    <Panel c={c} title={title} titleFontSize={31} tone={tone} padding={6} gap={2} width={w}>
        <TextLabel text={sub} c={c} fontSize={30} color={c.textMuted} mono />
    </Panel>
)

const illustration = defineIllustration((c) => {
    return (
        <Scene c={c} padding={14} gap={10} contentWidth={width - 28} align="center">
            <Column gap={8} width={width - 28} align="center">
                <Panel
                    c={c}
                    title="Source frontends select index i = 1"
                    titleFontSize={31}
                    tone="cyan"
                    padding={10}
                    gap={8}
                    width={width - 28}
                >
                    <Row gap={10} align="center">
                        <BadgePill
                            text="CUDA"
                            tone="cyan"
                            c={c}
                            width={114}
                            height={40}
                            fontSize={30}
                        />
                        {stage(c, 'thread 1', 'i = 1', 'cyan', 190)}
                        <FlowArrow direction="right" length={16} c={c} tone="cyan" />
                        {stage(c, 'NVVM IR', 'device IR', 'cyan', 196)}
                        <FlowArrow direction="right" length={16} c={c} tone="blue" />
                        {stage(c, 'LLVM IR', 'target', 'blue', 190)}
                    </Row>
                    <Row gap={6} align="center">
                        <BadgePill
                            text="Triton"
                            tone="purple"
                            c={c}
                            width={114}
                            height={40}
                            fontSize={30}
                        />
                        {stage(c, 'pid 0, i=1', 'mask[1]=1', 'purple', 196)}
                        <FlowArrow direction="right" length={10} c={c} tone="purple" />
                        {stage(c, 'TTIR', 'block', 'purple', 142)}
                        <FlowArrow direction="right" length={10} c={c} tone="purple" />
                        {stage(c, 'TTGIR', 'layout', 'purple', 156)}
                        <FlowArrow direction="right" length={10} c={c} tone="blue" />
                        {stage(c, 'LLVM IR', 'lowered', 'blue', 164)}
                    </Row>
                </Panel>

                <FlowArrow direction="down" length={14} c={c} tone="warm" />

                <Panel
                    c={c}
                    title="PTX virtual registers (x[1] = 0.25, y[1] = -2)"
                    titleFontSize={31}
                    tone="warm"
                    padding={10}
                    gap={8}
                    width={width - 28}
                >
                    <Row gap={4} align="center">
                        {stage(c, 'ld.f32 %f1', '0.25 x[1]', 'warm', 198)}
                        <FlowArrow direction="right" length={8} c={c} tone="warm" />
                        {stage(c, 'ld.f32 %f2', '-2 y[1]', 'warm', 190)}
                        <FlowArrow direction="right" length={8} c={c} tone="warm" />
                        {stage(c, 'add.f32 %f3', 'sum=-1.75', 'warm', 224)}
                        <FlowArrow direction="right" length={8} c={c} tone="green" />
                        {stage(c, 'st.f32', 'out[1]=-1.75', 'green', 252)}
                    </Row>
                </Panel>

                <FlowArrow direction="down" length={14} c={c} tone="green" />

                <Row gap={10} align="center" width={width - 28} justify="center">
                    {stage(c, 'ptxas', 'reg alloc', 'warm', 196)}
                    <FlowArrow direction="right" length={16} c={c} tone="green" />
                    {stage(c, 'cubin (ELF)', 'SASS ELF', 'green', 220)}
                    <FlowArrow direction="right" length={16} c={c} tone="green" />
                    <Column gap={8} width={440}>
                        <Panel
                            c={c}
                            title="GPU driver: execute cubin"
                            titleFontSize={30}
                            tone="green"
                            padding={8}
                            gap={2}
                        />
                        <Panel
                            c={c}
                            title="nvdisasm: view SASS"
                            titleFontSize={30}
                            tone="neutral"
                            padding={8}
                            gap={2}
                        />
                    </Column>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
