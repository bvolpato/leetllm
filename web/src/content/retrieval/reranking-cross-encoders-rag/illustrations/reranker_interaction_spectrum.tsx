import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Matrix,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 860
export const height = 520
export const alt =
    'Three architectures score the same query and chunk. A bi-encoder compares separately pooled query and chunk vectors. A BERT-style cross-encoder joins CLS, query, and chunk tokens so both sides interact before one score. ColBERT keeps chunk-token vectors and compares a 2-by-3 matrix: query row 1 selects 0.900, row 2 selects 0.800, and MaxSim sums them to 1.700.'

const queryTokens = ['q1', 'q2']
const chunkTokens = ['d1', 'd2', 'd3']

const colbertScores = [
    [0.9, 0.6, -0.8],
    [Math.sqrt(0.19), 0.8, -0.6],
]
const colbertLabels = [
    ['0.90', '0.60', '−0.80'],
    ['0.44', '0.80', '−0.60'],
]

const illustration = defineIllustration((c) => {
    const tones = {
        blue: getReadableToneColor('blue', c),
        purple: getReadableToneColor('purple', c),
        green: getReadableToneColor('green', c),
        cyan: getReadableToneColor('cyan', c),
    }

    return (
        <Scene
            c={c}
            title="Interaction Spectrum in Retrieval and Reranking"
            subtitle="Comparing token interaction mechanisms and compute complexity"
            padding={20}
            gap={10}
            contentWidth={820}
        >
            <Row gap={12} align="start" justify="space-between">
                {/* 1. Bi-Encoder */}
                <Panel
                    c={c}
                    title="1 · Bi-Encoder"
                    tone="blue"
                    padding={12}
                    gap={8}
                    titleFontSize={14}
                    width={264}
                >
                    <Column gap={6} align="center">
                        <TextLabel
                            c={c}
                            text="Separate Encoding"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <Row gap={6} align="center">
                            {queryTokens.map((t) => (
                                <BadgePill
                                    key={t}
                                    c={c}
                                    text={t}
                                    tone="blue"
                                    filled
                                    fontSize={11}
                                    width={32}
                                    height={22}
                                />
                            ))}
                            <TextLabel c={c} text="|" fontSize={12} color={c.textSecondary} />
                            {chunkTokens.map((t) => (
                                <BadgePill
                                    key={t}
                                    c={c}
                                    text={t}
                                    tone="green"
                                    filled
                                    fontSize={11}
                                    width={32}
                                    height={22}
                                />
                            ))}
                        </Row>
                        <FlowArrow c={c} direction="down" tone="neutral" length={12} />
                        <Row gap={8} align="center">
                            <BadgePill
                                c={c}
                                text="q-vec (pool)"
                                tone="blue"
                                filled={false}
                                fontSize={11}
                                width={80}
                                height={24}
                            />
                            <TextLabel c={c} text="·" fontSize={14} fontWeight={700} />
                            <BadgePill
                                c={c}
                                text="d-vec (pool)"
                                tone="green"
                                filled={false}
                                fontSize={11}
                                width={80}
                                height={24}
                            />
                        </Row>
                        <FlowArrow c={c} direction="down" tone="neutral" length={12} />
                        <BadgePill
                            c={c}
                            text="Score = q · d"
                            tone="blue"
                            filled
                            fontSize={12}
                            width={130}
                            height={26}
                        />
                        <TextLabel
                            c={c}
                            text="Offline document index. Sub-ms ANN search. Bottleneck: zero token-level cross-attention."
                            fontSize={11}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>

                {/* 2. ColBERT Late Interaction */}
                <Panel
                    c={c}
                    title="2 · ColBERT (Late Interaction)"
                    tone="cyan"
                    padding={12}
                    gap={8}
                    titleFontSize={14}
                    width={280}
                >
                    <Column gap={6} align="center">
                        <TextLabel
                            c={c}
                            text="Token-Token Similarity Matrix"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <Matrix
                            data={colbertScores}
                            labels={colbertLabels}
                            rowLabels={['q1', 'q2']}
                            colLabels={['d1', 'd2', 'd3']}
                            c={c}
                            cellWidth={48}
                            cellHeight={26}
                            rowLabelWidth={26}
                            colorize
                            colorScale="strength"
                            colorDomain={[0.45, 0.9]}
                            fontSize={11}
                        />
                        <Row gap={6} align="center" justify="center">
                            <BadgePill
                                c={c}
                                text="max(q1)=0.90"
                                tone="green"
                                filled
                                fontSize={10}
                                width={90}
                                height={22}
                            />
                            <BadgePill
                                c={c}
                                text="max(q2)=0.80"
                                tone="green"
                                filled
                                fontSize={10}
                                width={90}
                                height={22}
                            />
                        </Row>
                        <FlowArrow c={c} direction="down" tone="neutral" length={12} />
                        <BadgePill
                            c={c}
                            text="MaxSim = 0.9 + 0.8 = 1.70"
                            tone="cyan"
                            filled
                            fontSize={11}
                            width={175}
                            height={26}
                        />
                        <TextLabel
                            c={c}
                            text="Offline token embeddings. Query-time MaxSim preserves fine-grained token alignments."
                            fontSize={11}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>

                {/* 3. Cross-Encoder */}
                <Panel
                    c={c}
                    title="3 · Cross-Encoder"
                    tone="purple"
                    padding={12}
                    gap={8}
                    titleFontSize={14}
                    width={264}
                >
                    <Column gap={6} align="center">
                        <TextLabel
                            c={c}
                            text="Joint Input Sequence"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <Row gap={3} align="center">
                            <BadgePill
                                c={c}
                                text="CLS"
                                tone="purple"
                                filled={false}
                                fontSize={10}
                                width={30}
                                height={20}
                            />
                            <BadgePill
                                c={c}
                                text="q"
                                tone="blue"
                                filled
                                fontSize={10}
                                width={24}
                                height={20}
                            />
                            <BadgePill
                                c={c}
                                text="SEP"
                                tone="neutral"
                                filled={false}
                                fontSize={10}
                                width={30}
                                height={20}
                            />
                            <BadgePill
                                c={c}
                                text="d"
                                tone="green"
                                filled
                                fontSize={10}
                                width={24}
                                height={20}
                            />
                            <BadgePill
                                c={c}
                                text="SEP"
                                tone="neutral"
                                filled={false}
                                fontSize={10}
                                width={30}
                                height={20}
                            />
                        </Row>
                        <TiledMatrix
                            rows={6}
                            cols={6}
                            c={c}
                            cellSize={14}
                            gap={2}
                            tone="purple"
                            regions={[
                                { rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 5, tone: 'blue' },
                                { rowStart: 3, rowEnd: 5, colStart: 1, colEnd: 2, tone: 'green' },
                            ]}
                        />
                        <FlowArrow c={c} direction="down" tone="neutral" length={12} />
                        <BadgePill
                            c={c}
                            text="Score = f([CLS])"
                            tone="purple"
                            filled
                            fontSize={12}
                            width={130}
                            height={26}
                        />
                        <TextLabel
                            c={c}
                            text="All-to-all cross-attention. Richest semantic interaction. High O(K · L²) compute cost."
                            fontSize={11}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
