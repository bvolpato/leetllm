import React from 'react'
import { IntervalPlot, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 470
export const alt =
    'Normalized 90 percent split conformal ETA prediction intervals on five holdout parcels across clear, rain, and storm weather'

const INTERVALS = [
    {
        label: '#1595 Clear',
        low: 0.32,
        mid: 1.64,
        high: 2.96,
        color: 'info',
        lowLabel: '0.3',
        midLabel: '1.6',
        highLabel: '3.0',
    },
    {
        label: '#1598 Clear',
        low: 0.0,
        mid: 1.26,
        high: 3.15,
        color: 'info',
        lowLabel: '0.0',
        midLabel: '1.3',
        highLabel: '3.2',
    },
    {
        label: '#1596 Rain',
        low: 1.86,
        mid: 3.53,
        high: 5.21,
        color: 'warning',
        lowLabel: '1.9',
        midLabel: '3.5',
        highLabel: '5.2',
    },
    {
        label: '#1599 Rain',
        low: 2.72,
        mid: 4.44,
        high: 6.17,
        color: 'warning',
        lowLabel: '2.7',
        midLabel: '4.4',
        highLabel: '6.2',
    },
    {
        label: '#1597 Storm',
        low: 5.54,
        mid: 8.41,
        high: 11.28,
        color: 'critical',
        lowLabel: '5.5',
        midLabel: '8.4',
        highLabel: '11.3',
    },
]

const illustration = defineIllustration((c: ThemeColors) => (
    <Scene c={c} density={1.65} padding={16} gap={10} contentWidth={528}>
        <IntervalPlot
            c={c}
            data={INTERVALS}
            width={528}
            height={395}
            min={0}
            max={12}
            axisLabel="Remaining transit hours (90% conformal band)"
            footer="Holdout intervals using normalized conformal quantile (94.4% coverage)"
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
