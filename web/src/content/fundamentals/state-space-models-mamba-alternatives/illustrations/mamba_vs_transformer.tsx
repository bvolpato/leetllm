import React from 'react'
import {
    BadgePill,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
} from 'vizmatic'

export const width = 780
export const height = 640

export const alt =
    'Side-by-side comparison of Transformer KV cache growing linearly with sequence length L versus Mamba fixed-size recurrent state and 4-slot convolution window updating in constant time per token.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={12} gap={10} background="transparent">
        <Row gap={14} align="stretch">
            <Panel
                c={c}
                title="Transformer attention"
                subtitle="Linear O(L) scan per step"
                tone="blue"
                width={362}
                padding={12}
                gap={8}
                footer={
                    <Row justify="center" align="center" width="100%">
                        <BadgePill
                            c={c}
                            text="KV grows O(L) with prefix"
                            tone="blue"
                            height={40}
                            padding="4px 12px"
                            fontSize={23}
                        />
                    </Row>
                }
            >
                <TextLabel c={c} text="Stored prefix keys & values" variant="small" fontSize={24} />
                <Grid
                    c={c}
                    rows={[
                        [
                            { label: 'K1 V1', tone: 'blue' },
                            { label: 'K2 V2', tone: 'blue' },
                            { label: 'K3 V3', tone: 'blue' },
                            { label: 'Kt Vt', tone: 'blue' },
                        ],
                    ]}
                    cellWidth={76}
                    cellHeight={46}
                    gap={6}
                    fontSize={23}
                />
                <TextLabel c={c} text="Query q[L+1] scans 1..L" variant="small" fontSize={24} />
                <FlowArrow c={c} direction="down" length={22} tone="blue" />
                <TiledMatrix
                    c={c}
                    rows={3}
                    cols={8}
                    cellSize={28}
                    gap={5}
                    tone="blue"
                    regions={[{ rowStart: 0, rowEnd: 2, colStart: 0, colEnd: 7, tone: 'blue' }]}
                    title="L cached pairs read per token"
                />
            </Panel>

            <Panel
                c={c}
                title="Mamba selective SSM"
                subtitle="Constant O(1) update per step"
                tone="green"
                width={362}
                padding={12}
                gap={8}
                footer={
                    <Row justify="center" align="center" width="100%">
                        <BadgePill
                            c={c}
                            text="State stays O(1) per token"
                            tone="green"
                            height={40}
                            padding="4px 12px"
                            fontSize={23}
                        />
                    </Row>
                }
            >
                <TextLabel c={c} text="Rolling 4-token conv window" variant="small" fontSize={24} />
                <Grid
                    c={c}
                    rows={[
                        [
                            { label: 't-3', tone: 'neutral' },
                            { label: 't-2', tone: 'neutral' },
                            { label: 't-1', tone: 'neutral' },
                            { label: 'now', tone: 'green' },
                        ],
                    ]}
                    cellWidth={76}
                    cellHeight={46}
                    gap={6}
                    fontSize={23}
                />
                <TextLabel
                    c={c}
                    text="New input u[t+1] updates h[t]"
                    variant="small"
                    fontSize={24}
                />
                <FlowArrow c={c} direction="down" length={22} tone="green" />
                <TiledMatrix
                    c={c}
                    rows={3}
                    cols={5}
                    cellSize={28}
                    gap={5}
                    tone="green"
                    regions={[{ rowStart: 0, rowEnd: 2, colStart: 0, colEnd: 4, tone: 'green' }]}
                    title="Fixed (D x N) state h[t]"
                />
            </Panel>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
