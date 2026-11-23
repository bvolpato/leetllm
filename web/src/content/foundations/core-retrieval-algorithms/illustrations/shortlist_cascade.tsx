import React from 'react'
import {
    BarChart,
    Column,
    GraphDiagram,
    MetricCard,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 740
export const autoSize = false
export const alt =
    'Retrieval and reranking cascade showing how shortlist cutoffs gate downstream scoring. BM25 and dense lanes fuse via RRF (k=60) into [d1, d4, d2]. A top-2 cutoff drops d2 so the cross-encoder leaves d1 (0.782) on top. A top-3 cutoff retains d2, whose cross-encoder score (0.953) promotes it to rank 1 ahead of d1 (0.782) and d4 (0.068).'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={12} width={656}>
                <GraphDiagram
                    c={c}
                    width={656}
                    height={285}
                    direction="LR"
                    routing="dagre"
                    nodeWidth={124}
                    nodeHeight={58}
                    rankGap={24}
                    nodeGap={16}
                    padding={14}
                    labelFontSize={20}
                    detailFontSize={20}
                    nodes={[
                        { id: 'bm25', label: 'BM25', detail: 'd1, d4', tone: 'blue' },
                        { id: 'dense', label: 'Dense', detail: 'd2, d1, d4', tone: 'cyan' },
                        { id: 'rrf', label: 'RRF k=60', detail: 'd1, d4, d2', tone: 'purple' },
                        { id: 'k2', label: 'K = 2', detail: '[d1, d4]', tone: 'red' },
                        { id: 'k3', label: 'K = 3', detail: '[d1, d4, d2]', tone: 'green' },
                        { id: 'rerank', label: 'Reranker', detail: 'Joint score', tone: 'warm' },
                    ]}
                    edges={[
                        { from: 'bm25', to: 'rrf', tone: 'blue' },
                        { from: 'dense', to: 'rrf', tone: 'cyan' },
                        { from: 'rrf', to: 'k2', label: 'drop d2', tone: 'red' },
                        { from: 'rrf', to: 'k3', label: 'keep d2', tone: 'green' },
                        { from: 'k2', to: 'rerank', tone: 'red', dashed: true },
                        { from: 'k3', to: 'rerank', tone: 'green' },
                    ]}
                />
                <Row gap={14} align="stretch">
                    <BarChart
                        c={c}
                        width={366}
                        height={255}
                        title="Cross-Encoder Score"
                        min={0}
                        max={1.15}
                        format={(v) => v.toFixed(2)}
                        showValues
                        showGrid={false}
                        ariaLabel="Cross-encoder sigmoid scores: d2 0.953, d1 0.782, d4 0.068"
                        data={[
                            { label: 'd2', value: 0.953, valueLabel: '0.953', color: 'positive' },
                            { label: 'd1', value: 0.782, valueLabel: '0.782', color: 'primary' },
                            { label: 'd4', value: 0.068, valueLabel: '0.068', color: 'critical' },
                        ]}
                    />
                    <Column gap={12} width={276}>
                        <MetricCard
                            c={c}
                            label="K = 2 Shortlist"
                            value="Top: d1"
                            detail="d2 absent · unrecoverable"
                            tone="red"
                            width={276}
                        />
                        <MetricCard
                            c={c}
                            label="K = 3 Shortlist"
                            value="Top: d2"
                            detail="d2 scores 0.953 · rank #1"
                            tone="green"
                            width={276}
                        />
                    </Column>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
