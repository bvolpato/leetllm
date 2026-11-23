import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 660
export const alt =
    'Chronological search session splitting with two-day conversion label maturity, validation tuning, holdout test evaluation, and experiment traffic checks'

const nodes = [
    {
        id: 'tr',
        label: '1. Train (Days 1-10)',
        detail: '250 mature rows',
        tone: 'blue' as const,
    },
    {
        id: 'imm',
        label: 'Immature (Days 11-12)',
        detail: 'Excluded at cutoff',
        tone: 'red' as const,
    },
    {
        id: 'val',
        label: '2. Validate (D13-16)',
        detail: 'Tune MMR lambda=0.72',
        tone: 'warm' as const,
    },
    {
        id: 'tst',
        label: '3. Holdout (D17-20)',
        detail: 'Single locked check',
        tone: 'green' as const,
    },
    {
        id: 'ab',
        label: '4. Live A/B Gate',
        detail: 'SRM chi2 & p95 latency',
        tone: 'purple' as const,
    },
]

const edges = [
    { from: 'tr', to: 'val', label: '+2d maturity gap' },
    { from: 'imm', to: 'tst', dashed: true, label: 'not mature by D12' },
    { from: 'tr', to: 'imm', label: 'delayed labels' },
    { from: 'val', to: 'tst', label: 'freeze lambda' },
    { from: 'tst', to: 'ab', label: 'ship canary' },
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
            height={610}
            nodeWidth={210}
            nodeHeight={54}
            labelFontSize={18}
            detailFontSize={16}
            arrowSize={7}
            nodeGap={22}
            rankGap={24}
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
