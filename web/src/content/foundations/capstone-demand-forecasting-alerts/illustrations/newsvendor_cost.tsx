import React from 'react'
import { BarChart, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 380
export const alt =
    'Holdout expected daily staffing cost under asymmetric overtime and idle penalties comparing seasonal naive at 1500 dollars, median q50 at 737 dollars, critical fractile q80 at 526 dollars, and conservative q90 at 571 dollars'

const COST_BARS = [
    { label: 'Naive S7', value: 1500, color: 'neutral' as const },
    { label: 'Median q50', value: 737, color: 'warning' as const },
    { label: 'Plan q80', value: 526, color: 'positive' as const },
    { label: 'Buffer q90', value: 571, color: 'info' as const },
]

const illustration = defineIllustration((c: ThemeColors) => (
    <Scene c={c} density={1.65} padding={16} gap={10} contentWidth={528}>
        <BarChart
            c={c}
            data={COST_BARS}
            width={528}
            height={295}
            min={0}
            max={1800}
            yAxisLabel="Mean daily cost ($)"
            showGrid
            showValues
            footer="Asymmetric costs ($72 understaff vs $18 idle): tau* = 0.80 quantile minimizes holdout cost"
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
