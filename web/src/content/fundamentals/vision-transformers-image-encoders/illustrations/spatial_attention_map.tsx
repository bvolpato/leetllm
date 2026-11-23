import React from 'react'
import {
    Matrix,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 880
export const height = 540
export const alt =
    'Bidirectional spatial self-attention in a Vision Transformer contrasted with a causal decoder mask. In the 5-token ViT street scene, [CLS] and early patches attend to later tokens such as Sign and Road. In the causal mask, upper-triangular entries above the diagonal stay strictly zero before softmax.'

const tokens = ['CLS', 'Sky', 'Tree', 'Sign', 'Road']

const vitWeights: number[][] = [
    [0.12, 0.14, 0.24, 0.36, 0.14],
    [0.1, 0.42, 0.2, 0.18, 0.1],
    [0.14, 0.18, 0.34, 0.22, 0.12],
    [0.16, 0.14, 0.18, 0.38, 0.14],
    [0.12, 0.12, 0.18, 0.24, 0.34],
]

const causalWeights: number[][] = [
    [1.0, 0.0, 0.0, 0.0, 0.0],
    [0.3, 0.7, 0.0, 0.0, 0.0],
    [0.22, 0.26, 0.52, 0.0, 0.0],
    [0.18, 0.16, 0.2, 0.46, 0.0],
    [0.15, 0.14, 0.19, 0.22, 0.3],
]

const pill = (text: string, tone: ToneName, c: ThemeColors) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7px 14px',
            borderRadius: 999,
            border: '2px solid ' + getReadableToneColor(tone, c, c.bgSubtle),
            background: c.bgSubtle,
            color: getReadableToneColor(tone, c, c.bgSubtle),
            fontSize: 26,
            fontWeight: 700,
            whiteSpace: 'nowrap',
        }}
    >
        {text}
    </div>
)

const illustration = defineIllustration((c) => (
    <Scene c={c} background={c.bg} padding={18} contentWidth={844} gap={12}>
        <TextLabel
            text="Bidirectional patch attention vs causal decoder mask"
            c={c}
            fontSize={28}
            fontWeight={700}
            math={false}
        />
        <Row gap={12} align="stretch" justify="space-between" width="100%">
            <Panel
                c={c}
                title="ViT encoder: bidirectional"
                tone="blue"
                width={416}
                padding={12}
                gap={8}
                align="center"
                titleFontSize={26}
            >
                <TextLabel
                    text="Highlighted row: Sign sees all patches"
                    c={c}
                    fontSize={26}
                    color={c.textSecondary}
                    math={false}
                />
                <Matrix
                    data={vitWeights}
                    c={c}
                    rowLabels={tokens}
                    colLabels={tokens}
                    cellWidth={66}
                    cellHeight={42}
                    rowLabelWidth={64}
                    fontSize={26}
                    format="decimal"
                    colorScale="strength"
                    highlightRow={3}
                    ariaLabel="Bidirectional 5 by 5 attention matrix over CLS, Sky, Tree, Sign, and Road"
                />
                {pill('CLS sees Sign (0.36)', 'blue', c)}
            </Panel>

            <Panel
                c={c}
                title="Causal LLM decoder: masked"
                tone="warm"
                width={416}
                padding={12}
                gap={8}
                align="center"
                titleFontSize={26}
            >
                <TextLabel
                    text="Zero weight where key > query"
                    c={c}
                    fontSize={26}
                    color={c.textSecondary}
                    math={false}
                />
                <Matrix
                    data={causalWeights}
                    c={c}
                    rowLabels={tokens}
                    colLabels={tokens}
                    cellWidth={66}
                    cellHeight={42}
                    rowLabelWidth={64}
                    fontSize={26}
                    format="decimal"
                    colorScale="strength"
                    highlightRow={1}
                    ariaLabel="Causal 5 by 5 attention matrix with upper triangle masked to zero"
                />
                {pill('Prefix cannot read later slots', 'warm', c)}
            </Panel>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
