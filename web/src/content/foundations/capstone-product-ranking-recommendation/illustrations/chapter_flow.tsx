import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 680
export const alt =
    'Product ranking architecture separating hard eligibility filtering, pairwise RankNet and IPS debiasing, and MMR diversity reranking'

const nodes = [
    {
        id: 'elig',
        label: '1. Eligibility (417/540)',
        detail: 'Drop 123 blocked',
        tone: 'red' as const,
    },
    {
        id: 'rn',
        label: '2a. PyTorch RankNet',
        detail: 'Pairwise log loss',
        tone: 'blue' as const,
    },
    {
        id: 'ips',
        label: '2b. Clipped IPS Click',
        detail: 'Weights min(1/e, 5)',
        tone: 'green' as const,
    },
    {
        id: 'mmr',
        label: '3. MMR Reranker',
        detail: 'lambda=0.72, <=2/seller',
        tone: 'warm' as const,
    },
    {
        id: 'exp',
        label: '4. Exposure Slate',
        detail: 'Top-5 + propensity log',
        tone: 'purple' as const,
    },
]

const edges = [
    { from: 'elig', to: 'rn', label: 'explicit labels' },
    { from: 'elig', to: 'ips', label: 'click logs' },
    { from: 'rn', to: 'mmr', label: 'rank scores' },
    { from: 'ips', to: 'mmr', dashed: true, label: 'debiased scores' },
    { from: 'mmr', to: 'exp', label: 'serve top 5' },
]

const illustration = defineIllustration((c: ThemeColors) => (
    <Scene c={c} density={1.65} padding={16} gap={10} contentWidth={528}>
        <GraphDiagram
            c={c}
            nodes={nodes}
            edges={edges}
            direction="TB"
            layout="auto"
            routing="orthogonal"
            width={528}
            height={620}
            nodeWidth={210}
            nodeHeight={52}
            labelFontSize={18}
            detailFontSize={16}
            arrowSize={7}
            nodeGap={22}
            rankGap={22}
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
