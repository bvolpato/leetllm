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
export const height = 620
export const preset = 'engineering'
export const alt =
    'Parameter and gradient pytrees must match on both tree structure (weight and bias keys) and leaf shapes ([2] and scalar). With valid gradients [-4.5, -1.5] and -2.5 at lr=0.05, SGD yields weight [0.225, 0.075] and bias 0.125. Renaming weight to kernel fails structure checks; passing scalar -4.5 fails leaf-shape checks and would broadcast to [0.225, 0.225].'

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="Transformations check treedef paths and leaf shapes"
        subtitle="Valid update vs key mismatch and scalar broadcasting error"
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
                labelFontSize={24}
                detailFontSize={23}
                nodes={[
                    { id: 'p', label: 'params tree', detail: 'w (2,), b ()', tone: 'blue' },
                    { id: 'flat', label: 'tree.flatten', detail: 'treedef + leaves', tone: 'cyan' },
                    { id: 'ok', label: 'valid grads', detail: 'w [-4.5,-1.5]', tone: 'green' },
                    {
                        id: 'badk',
                        label: 'wrong key',
                        detail: 'kernel != weight',
                        tone: 'critical',
                    },
                    { id: 'bads', label: 'scalar -4.5', detail: 'shape () != (2,)', tone: 'warm' },
                ]}
                edges={[
                    { from: 'p', to: 'flat', tone: 'blue' },
                    { from: 'flat', to: 'ok', tone: 'green' },
                    { from: 'flat', to: 'badk', tone: 'critical', dashed: true },
                    { from: 'flat', to: 'bads', tone: 'warm', dashed: true },
                ]}
            />
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    title="Valid SGD step (lr=0.05)"
                    tone="green"
                    padding={14}
                    width={352}
                    titleFontSize={23}
                >
                    <Column gap={10}>
                        <TextLabel c={c} text="w = [0.225, 0.075]" fontSize={23} mono />
                        <BadgePill
                            c={c}
                            text="ACCEPT"
                            tone="green"
                            filled
                            fontSize={23}
                            height={42}
                            width={160}
                        />
                    </Column>
                </Panel>
                <Panel
                    c={c}
                    title="Unchecked scalar broadcast"
                    tone="critical"
                    padding={14}
                    width={354}
                    titleFontSize={23}
                >
                    <Column gap={10}>
                        <TextLabel c={c} text="w = [0.225, 0.225]" fontSize={23} mono />
                        <BadgePill
                            c={c}
                            text="SHAPE REJECT"
                            tone="critical"
                            filled
                            fontSize={23}
                            height={42}
                            width={220}
                        />
                    </Column>
                </Panel>
            </Row>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
