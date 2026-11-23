import React from 'react'
import { BarChart, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 380
export const alt =
    'Holdout test NDCG at rank 5 across BM25 baseline, naive biased click ranker, pointwise GBDT, PyTorch RankNet, and clipped IPS click debiasing'

const DATA = [
    { label: 'BM25', value: 0.742, color: 'neutral' as const },
    { label: 'Naive Click', value: 0.811, color: 'critical' as const },
    { label: 'GBDT', value: 0.907, color: 'info' as const },
    { label: 'RankNet', value: 0.92, color: 'primary' as const },
    { label: 'Clipped IPS', value: 0.946, color: 'positive' as const },
]

const illustration = defineIllustration((c: ThemeColors) => (
    <Scene c={c} density={1.65} padding={16} gap={10} contentWidth={528}>
        <BarChart
            c={c}
            data={DATA}
            width={528}
            height={295}
            min={0.6}
            max={1.0}
            yAxisLabel="Holdout NDCG@5"
            showGrid
            showValues
            footer="Holdout evaluation (86 eligible test candidates): clipped IPS beats naive clicks by +0.135"
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
