import React from 'react'
import { BarChart, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 380
export const alt =
    'Test MAE comparison in parcels showing leaky shuffled K-Fold cross-validation at 5.7 vs causal rolling Ridge at 9.3, rolling GBDT at 14.5, and seasonal naive at 30.2'

const MAE_BARS = [
    { label: 'K-Fold Leak', value: 5.7, color: 'critical' as const },
    { label: 'Ridge', value: 9.3, color: 'positive' as const },
    { label: 'GBDT', value: 14.5, color: 'info' as const },
    { label: 'Naive S7', value: 30.2, color: 'neutral' as const },
]

const illustration = defineIllustration((c: ThemeColors) => (
    <Scene c={c} density={1.65} padding={16} gap={10} contentWidth={528}>
        <BarChart
            c={c}
            data={MAE_BARS}
            width={528}
            height={295}
            min={0}
            max={36}
            yAxisLabel="MAE (parcels)"
            showGrid
            showValues
            footer="Holdout rolling window (96 forecast rows) vs random 5-fold leak (5.7 MAE)"
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
