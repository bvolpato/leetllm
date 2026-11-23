import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'

export const width = 940
export const height = 620
export const opaqueBackground = false

export const alt =
    'Beam search tree (width B=2) solving (x^2 - 7x + 11)^(x^2 - 13x + 42) = 1. Branches for a=1 and a=-1 with even exponent receive high PRM scores (0.91 and 0.89) and verify all six integer roots {2, 3, 4, 5, 6, 7}, while omitting a=-1 scores 0.24 and is pruned at step 2.'

const illustration = defineIllustration((c) => (
    <Scene c={c} padding={12}>
        <GraphDiagram
            c={c}
            direction="TB"
            routing="dagre"
            labelFontSize={30}
            detailFontSize={28}
            nodeGap={18}
            rankGap={48}
            nodes={[
                { id: 'root', label: 'Solve a^b = 1', detail: 'Split cases', tone: 'purple' },
                { id: 'c1', label: 'a = 1', detail: 'PRM 0.91 keep', tone: 'green' },
                { id: 'c2', label: 'a=-1, even b', detail: 'PRM 0.89 keep', tone: 'green' },
                {
                    id: 'c3',
                    label: 'Omit a=-1',
                    detail: 'PRM 0.24 prune',
                    tone: 'critical',
                    muted: true,
                },
                { id: 'v1', label: 'x in {2, 5}', detail: '+ b=0 {6, 7}', tone: 'blue' },
                { id: 'v2', label: 'x in {3, 4}', detail: 'All 6 roots', tone: 'green' },
            ]}
            edges={[
                { from: 'root', to: 'c1', tone: 'green' },
                { from: 'root', to: 'c2', tone: 'green' },
                { from: 'root', to: 'c3', tone: 'critical', style: 'dashed' },
                { from: 'c1', to: 'v1', tone: 'blue' },
                { from: 'c2', to: 'v2', tone: 'green' },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
