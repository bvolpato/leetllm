import React from 'react'
import {
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

export const width = 720
export const height = 650
export const alt =
    'Configured 120-GPU fleet split into two node pools. Sixteen four-GPU learner nodes hold 64 GPUs as one Megatron model replica, while fourteen four-GPU rollout nodes supply 56 GPUs across seven eight-GPU vLLM engines. Updated BF16 learner weights cast to FP8 and broadcast to the rollout pool.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity({ ...baseC, shadow: 'transparent' }, 1.45)
    return (
        <Scene c={c} background="transparent" padding={20} gap={14} contentWidth={680}>
            <TextLabel
                c={c}
                text="120 GB200 GPUs: learner pool vs. rollout pool"
                fontSize={26}
                fontWeight={700}
                color={c.textPrimary}
                width={680}
            />
            <Row gap={18} width={680} align="stretch">
                <Panel
                    c={c}
                    title="Learner: 64 GPUs"
                    subtitle="16 nodes x 4 GPUs · 1 replica"
                    tone="blue"
                    width={331}
                    padding={16}
                    gap={10}
                >
                    <TiledMatrix
                        c={c}
                        rows={8}
                        cols={8}
                        cellSize={22}
                        gap={4}
                        tone="blue"
                        regions={[{ rowStart: 0, rowEnd: 8, colStart: 0, colEnd: 8, tone: 'blue' }]}
                        ariaLabel="Eight by eight grid of 64 learner GPUs"
                    />
                    <Column gap={4}>
                        <TextLabel c={c} text="Megatron BF16 + Adam" fontSize={22} width={295} />
                        <TextLabel
                            c={c}
                            text="TP8 x CP8 / EP64 · DP1"
                            fontSize={22}
                            color={c.textSecondary}
                            width={295}
                        />
                    </Column>
                </Panel>
                <Panel
                    c={c}
                    title="Rollout: 56 GPUs"
                    subtitle="14 nodes x 4 GPUs · 7 engines"
                    tone="green"
                    width={331}
                    padding={16}
                    gap={10}
                >
                    <TiledMatrix
                        c={c}
                        rows={7}
                        cols={8}
                        cellSize={22}
                        gap={4}
                        tone="green"
                        regions={[
                            { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 8, tone: 'cyan' },
                            { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 8, tone: 'green' },
                            { rowStart: 2, rowEnd: 3, colStart: 0, colEnd: 8, tone: 'cyan' },
                            { rowStart: 3, rowEnd: 4, colStart: 0, colEnd: 8, tone: 'green' },
                            { rowStart: 4, rowEnd: 5, colStart: 0, colEnd: 8, tone: 'cyan' },
                            { rowStart: 5, rowEnd: 6, colStart: 0, colEnd: 8, tone: 'green' },
                            { rowStart: 6, rowEnd: 7, colStart: 0, colEnd: 8, tone: 'cyan' },
                        ]}
                        ariaLabel="Seven rows of 8 rollout GPUs representing 7 vLLM engines"
                    />
                    <Column gap={4}>
                        <TextLabel c={c} text="7 vLLM engines x 8 GPUs" fontSize={22} width={295} />
                        <TextLabel
                            c={c}
                            text="FP8 weights + FP8 KV"
                            fontSize={22}
                            color={c.textSecondary}
                            width={295}
                        />
                    </Column>
                </Panel>
            </Row>
            <Panel c={c} title="Weight refresh across pools" tone="purple" width={680} padding={12}>
                <Row gap={12} align="center" width={648}>
                    <TextLabel c={c} text="Learner BF16" fontSize={22} width={150} />
                    <FlowArrow c={c} direction="right" tone="purple" length={36} />
                    <TextLabel c={c} text="Cast FP8 + NCCL" fontSize={22} width={185} />
                    <FlowArrow c={c} direction="right" tone="green" length={36} />
                    <TextLabel c={c} text="7 vLLM replicas" fontSize={22} width={180} />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
