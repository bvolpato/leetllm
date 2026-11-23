import React from 'react'
import {
    Column,
    Flow,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    TiledMatrix,
    defineIllustration,
} from 'vizmatic'

export const width = 780
export const height = 780

export const alt =
    'Hybrid architecture pairing constant-state SSM layers with sparse attention layers and FFN/MoE blocks, alongside stacked sublayer compositions for Jamba (1 attention, 7 Mamba per block) and Nemotron-H-8B (4 attention, 24 Mamba-2, 24 FFN).'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.3} padding={10} gap={8} background="transparent">
        <Row gap={10} align="stretch">
            <Panel
                c={c}
                title="Hybrid block"
                subtitle="Sparse attn owns KV"
                width={295}
                padding={8}
                gap={6}
            >
                <Flow
                    c={c}
                    direction="vertical"
                    gap={4}
                    connectorLength={10}
                    stages={[
                        {
                            title: 'SSM sublayers',
                            subtitle: 'Fixed state O(1)',
                            tone: 'green',
                            width: 256,
                        },
                        {
                            title: 'Sparse attention',
                            subtitle: 'KV lookup O(L)',
                            tone: 'blue',
                            width: 256,
                        },
                        {
                            title: 'FFN / MoE',
                            subtitle: 'Stateless mix',
                            tone: 'neutral',
                            width: 256,
                        },
                    ]}
                />
            </Panel>

            <Panel
                c={c}
                title="Published layer mixes"
                subtitle="Fewer attn layers shrink KV"
                width={430}
                padding={8}
                gap={8}
            >
                <Column gap={14}>
                    <StackedBar
                        c={c}
                        width={392}
                        height={34}
                        title="Jamba (8-layer block)"
                        segments={[
                            { label: 'Attn', value: 1, valueLabel: '1', color: c.info },
                            { label: 'Mamba', value: 7, valueLabel: '7', color: c.positive },
                        ]}
                    />
                    <StackedBar
                        c={c}
                        width={392}
                        height={34}
                        title="Nemotron-H-8B (52 layers)"
                        segments={[
                            { label: 'Attn', value: 4, valueLabel: '4', color: c.info },
                            {
                                label: 'Mamba-2',
                                value: 24,
                                valueLabel: '24',
                                color: c.positive,
                            },
                            { label: 'FFN', value: 24, valueLabel: '24', color: c.neutral },
                        ]}
                    />
                    <Row gap={10} align="center">
                        <TiledMatrix
                            c={c}
                            rows={2}
                            cols={8}
                            cellSize={16}
                            gap={4}
                            tone="blue"
                            regions={[
                                {
                                    rowStart: 0,
                                    rowEnd: 0,
                                    colStart: 0,
                                    colEnd: 0,
                                    tone: 'blue',
                                },
                                {
                                    rowStart: 0,
                                    rowEnd: 1,
                                    colStart: 1,
                                    colEnd: 7,
                                    tone: 'green',
                                },
                            ]}
                        />
                        <TextLabel
                            c={c}
                            text="Sparse KV + fixed SSM"
                            variant="small"
                            fontSize={23}
                        />
                    </Row>
                </Column>
            </Panel>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
