import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 700
export const alt =
    'End-to-end delivery ETA pipeline from dual-clock telemetry joins through regression, conformal quantiles, probability calibration, and policy alerting'

const nodes = [
    {
        id: 'logs',
        label: 'Telemetry Scans',
        detail: 'event_hour + ingested_hour',
        tone: 'neutral' as const,
    },
    {
        id: 'pit',
        label: 'Point-in-Time Join',
        detail: 'both clocks <= cutoff_hour',
        tone: 'blue' as const,
    },
    {
        id: 'reg',
        label: 'GBDT ETA Regressor',
        detail: 'remaining transit hours',
        tone: 'warm' as const,
    },
    {
        id: 'clf',
        label: 'GBDT Risk Classifier',
        detail: 'raw late logit + promise',
        tone: 'warm' as const,
    },
    {
        id: 'conf',
        label: 'Normalized Conformal',
        detail: '90% band y_hat +- q * sigma',
        tone: 'green' as const,
    },
    {
        id: 'cal',
        label: 'Platt Calibration Gate',
        detail: 'alert when p_cal >= 0.26',
        tone: 'red' as const,
    },
]

const edges = [
    { from: 'logs', to: 'pit', label: 'merge_asof <= t' },
    { from: 'pit', to: 'reg', label: 'transit features' },
    { from: 'pit', to: 'clf', label: '+ promise_hours' },
    { from: 'reg', to: 'conf', label: 'cal residuals' },
    { from: 'clf', to: 'cal', label: 'sigmoid fit' },
]

const illustration = defineIllustration((c: ThemeColors) => (
    <Scene
        c={c}
        density={1.65}
        padding={16}
        gap={10}
        contentWidth={520}
        title="Point-in-time ETA and alert architecture"
        subtitle="Parallel transit intervals and SLA risk alerts share guarded cutoff features"
    >
        <GraphDiagram
            c={c}
            nodes={nodes}
            edges={edges}
            direction="TB"
            layout="auto"
            routing="orthogonal"
            width={520}
            height={470}
            nodeWidth={210}
            nodeHeight={62}
            labelFontSize={18}
            detailFontSize={16}
            arrowSize={7}
            nodeGap={20}
            rankGap={34}
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
