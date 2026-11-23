import React from 'react'
import {
    Flow,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 800
export const height = 560
export const alt =
    'A distributed rank process on the CPU launches kernels onto its assigned GPU. Inside the GPU, tensors move between HBM memory and Tensor Cores for matrix multiplication. An NCCL collective exchanges tensor shards across NVLink with peer GPU ranks.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity({ ...baseC, shadow: 'transparent' }, 1.45)
    return (
        <Scene c={c} background="transparent" padding={20} gap={14} contentWidth={760}>
            <TextLabel
                c={c}
                text="Rank process, GPU device, and NVLink peers"
                fontSize={26}
                fontWeight={700}
                color={c.textPrimary}
                width={760}
            />
            <Row gap={10} width={760} align="center">
                <Panel
                    c={c}
                    title="CPU Process"
                    subtitle="Rank 0 / 64"
                    tone="blue"
                    width={186}
                    padding={14}
                    gap={10}
                >
                    <Flow
                        c={c}
                        direction="vertical"
                        gap={4}
                        connectorLength={12}
                        stages={[
                            {
                                title: 'PyTorch script',
                                subtitle: 'Local GPU 0',
                                tone: 'blue',
                                width: 154,
                                padding: 10,
                            },
                            {
                                title: 'Launch CUDA',
                                subtitle: 'Async stream',
                                tone: 'cyan',
                                width: 154,
                                padding: 10,
                            },
                        ]}
                    />
                </Panel>
                <FlowArrow c={c} direction="right" tone="blue" length={24} />
                <Panel
                    c={c}
                    title="Blackwell GPU 0"
                    subtitle="Device memory + compute"
                    tone="cyan"
                    width={240}
                    padding={14}
                    gap={10}
                >
                    <Flow
                        c={c}
                        direction="vertical"
                        gap={4}
                        connectorLength={16}
                        connectorTone="green"
                        stages={[
                            {
                                title: 'HBM3e Memory',
                                subtitle: 'Weights + activations',
                                tone: 'cyan',
                                width: 208,
                                padding: 10,
                            },
                            {
                                title: 'Tensor Cores',
                                subtitle: 'GEMM tiles C = AB',
                                tone: 'green',
                                width: 208,
                                padding: 10,
                            },
                        ]}
                    />
                </Panel>
                <FlowArrow c={c} direction="right" tone="purple" length={24} />
                <Panel
                    c={c}
                    title="NVLink Peers"
                    subtitle="NCCL group"
                    tone="purple"
                    width={186}
                    padding={14}
                    gap={10}
                >
                    <Flow
                        c={c}
                        direction="vertical"
                        gap={4}
                        connectorLength={12}
                        connectorTone="purple"
                        stages={[
                            {
                                title: 'Ranks 1..7',
                                subtitle: 'TP8 all-reduce',
                                tone: 'purple',
                                width: 154,
                                padding: 10,
                            },
                            {
                                title: 'Ranks 0..63',
                                subtitle: 'EP64 all-to-all',
                                tone: 'warm',
                                width: 154,
                                padding: 10,
                            },
                        ]}
                    />
                </Panel>
            </Row>
            <TextLabel
                c={c}
                text="Separate stalls: Python launch · HBM tile · NVLink peer wait"
                fontSize={22}
                color={c.textSecondary}
                width={760}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
