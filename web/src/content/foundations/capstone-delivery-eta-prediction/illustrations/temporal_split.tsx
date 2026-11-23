import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 620
export const alt =
    'Chronological train, calibration, validation, and holdout test progression with out-of-fold scale estimation and twelve-hour label maturity'

const nodes = [
    {
        id: 'tr',
        label: '1. Train (324)',
        detail: 'Fit GBDT models',
        tone: 'blue' as const,
    },
    {
        id: 'oof',
        label: 'OOF Scale (4-fold)',
        detail: 'Residual sigma(x)',
        tone: 'neutral' as const,
    },
    {
        id: 'cal',
        label: '2. Calibrate (144)',
        detail: 'Platt + conformal q90',
        tone: 'green' as const,
    },
    {
        id: 'val',
        label: '3. Validate (126)',
        detail: 'Sweep cost -> t*=0.26',
        tone: 'warm' as const,
    },
    {
        id: 'tst',
        label: '4. Holdout Test (126)',
        detail: 'Single locked check',
        tone: 'purple' as const,
    },
]

const edges = [
    { from: 'tr', to: 'oof', label: 'CV residuals' },
    { from: 'tr', to: 'cal', label: '+12h mature' },
    { from: 'oof', to: 'val', dashed: true, label: 'frozen scale' },
    { from: 'cal', to: 'val', label: '+12h mature' },
    { from: 'val', to: 'tst', label: 'lock t* = 0.26' },
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
            height={540}
            nodeWidth={230}
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
