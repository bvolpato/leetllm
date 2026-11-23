import React from 'react'
import {
    BadgePill,
    Column,
    GraphDiagram,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 760
export const height = 650
export const preset = 'engineering'
export const alt =
    'DSPy 3.4.0 BootstrapFewShot evaluates two DummyLM teacher predictions of ANSWER with P-4412. On the supported WikiText-103 question, the label matches, scores 1.0, and enters the compiled predictor as one demonstration. On the unsupported MMLU question requiring ABSTAIN, the same teacher output scores 0.0 and is discarded. A constant-score 0.5 probe keeps both traces when metric_threshold is None or 0.0 because 0.5 is truthy, and keeps zero when metric_threshold is 1.0.'

const thresholds = [
    { label: 'None', kept: '2 / 2 kept', tone: 'warm' as const },
    { label: 'zero', kept: '2 / 2 kept', tone: 'critical' as const },
    { label: '1.0', kept: '0 / 2 kept', tone: 'green' as const },
]

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="Threshold checks gate teacher traces into demonstrations"
        subtitle="DSPy 3.4.0 DummyLM trace gate and constant-0.5 truthiness check"
        padding={20}
        gap={14}
        contentWidth={720}
    >
        <Column gap={14} align="center">
            <GraphDiagram
                c={c}
                direction="LR"
                layout="auto"
                routing="orthogonal"
                nodeGap={36}
                rankGap={70}
                edgeGap={20}
                nodeWidth={200}
                nodeHeight={80}
                labelFontSize={23}
                detailFontSize={23}
                nodes={[
                    { id: 'q1', label: 'WikiText-103?', detail: 'Label: ANSWER', tone: 'blue' },
                    { id: 'q2', label: 'MMLU score?', detail: 'Label: ABSTAIN', tone: 'purple' },
                    { id: 's1', label: 'Score = 1.0', detail: 'P-4412 matches', tone: 'green' },
                    { id: 's2', label: 'Score = 0.0', detail: 'P-4412 wrong', tone: 'critical' },
                    { id: 'k1', label: 'Keep demo', detail: '1 demo', tone: 'green' },
                    { id: 'd2', label: 'Discard', detail: 'Filtered out', tone: 'critical' },
                ]}
                edges={[
                    { from: 'q1', to: 's1', tone: 'green' },
                    { from: 's1', to: 'k1', tone: 'green' },
                    { from: 'q2', to: 's2', tone: 'critical' },
                    { from: 's2', to: 'd2', tone: 'critical' },
                ]}
            />
            <Panel
                c={c}
                title="Score 0.5 by metric_threshold"
                tone="warm"
                padding={14}
                width={720}
                titleFontSize={23}
            >
                <Row gap={12} align="center" justify="space-between">
                    {thresholds.map((item) => (
                        <Column key={item.label} gap={6} align="center" width={220}>
                            <TextLabel c={c} text={item.label} fontSize={23} align="center" mono />
                            <BadgePill
                                c={c}
                                text={item.kept}
                                tone={item.tone}
                                filled
                                fontSize={23}
                                height={40}
                                width={170}
                            />
                        </Column>
                    ))}
                </Row>
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
