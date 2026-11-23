import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 660
export const alt =
    'Demand forecasting pipeline flowing from daily parcel counts and promotion notices into origin-safe features, rolling-origin Ridge and GBDT models, split conformal intervals, and Newsvendor staffing alerts'

const nodes = [
    {
        id: 'feed',
        label: '1. Daily Sort Feed',
        detail: '120 days + 8 promo notices',
        tone: 'blue' as const,
    },
    {
        id: 'lags',
        label: '2a. Origin Lags & Fourier',
        detail: 'Counts strictly < t',
        tone: 'cyan' as const,
    },
    {
        id: 'promo',
        label: '2b. Notice Guard',
        detail: 'announced <= origin',
        tone: 'purple' as const,
    },
    {
        id: 'roll',
        label: '3. Rolling Weekly Refit',
        detail: 'Ridge, GBDT, q50/q80/q90',
        tone: 'green' as const,
    },
    {
        id: 'band',
        label: '4a. Conformal 90% Band',
        detail: 'Radius +/-30.1 parcels',
        tone: 'neutral' as const,
    },
    {
        id: 'staff',
        label: '4b. Newsvendor Alerts',
        detail: 'tau*=0.80 -> q80 plan',
        tone: 'warm' as const,
    },
]

const edges = [
    { from: 'feed', to: 'lags', label: 'past counts' },
    { from: 'feed', to: 'promo', label: 'event date' },
    { from: 'lags', to: 'roll', label: 'causal rows' },
    { from: 'promo', to: 'roll', label: 'known lift' },
    { from: 'roll', to: 'band', label: 'cal residuals' },
    { from: 'roll', to: 'staff', label: 'tau*=0.80' },
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
            height={600}
            nodeWidth={212}
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
