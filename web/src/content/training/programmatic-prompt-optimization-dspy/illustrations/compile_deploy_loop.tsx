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
export const height = 610
export const preset = 'engineering'
export const alt =
    'A LabeledFewShot save file compiled.json stores two demonstrations plus attached eval-model-a. Calling CitationVerifier.load restores both demonstrations and eval-model-a. Setting global dspy.context to eval-model-b leaves eval-model-a attached. Calling restored.set_lm binds eval-model-b, which requires evaluating the updated artifact-model pair before serving.'

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="Loading state keeps its saved LM until set_lm binds another"
        subtitle="Program state serialization, runtime override, and citation checks"
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
                nodeWidth={198}
                nodeHeight={80}
                labelFontSize={23}
                detailFontSize={23}
                nodes={[
                    { id: 'json', label: 'compiled.json', detail: '2 demos, A', tone: 'purple' },
                    { id: 'load', label: 'restored.load()', detail: 'model A', tone: 'blue' },
                    { id: 'ctx', label: 'global context', detail: 'still A', tone: 'critical' },
                    { id: 'set', label: 'set_lm(B)', detail: 'model B', tone: 'green' },
                ]}
                edges={[
                    { from: 'json', to: 'load', tone: 'purple' },
                    { from: 'load', to: 'ctx', tone: 'critical', dashed: true },
                    { from: 'load', to: 'set', tone: 'green' },
                ]}
            />
            <Panel
                c={c}
                title="Evaluate the deployed (artifact, LM) pair"
                tone="warm"
                padding={14}
                width={720}
                titleFontSize={23}
            >
                <Row gap={12} align="center" justify="space-between">
                    <Column gap={6} width={450}>
                        <TextLabel
                            c={c}
                            text="Question + evidence → (verdict, source_id)"
                            fontSize={23}
                            mono
                        />
                        <TextLabel
                            c={c}
                            text="Host citation check verifies grounding"
                            fontSize={23}
                            color={c.textSecondary}
                        />
                    </Column>
                    <BadgePill
                        c={c}
                        text="Re-test on change"
                        tone="warm"
                        filled
                        fontSize={23}
                        height={42}
                        width={220}
                    />
                </Row>
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
