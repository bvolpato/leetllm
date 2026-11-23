import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'

export const width = 920
export const height = 600
export const opaqueBackground = false

export const alt =
    'Process reward model supervision tree for x^2 - 7x + 12 = 0. Factoring (x-3)(x-4)=0 yields 3 of 4 Monte Carlo completions reaching the right answer (target V=0.75), while factoring (x+3)(x-4)=0 yields 0 of 4 completions recovering (target V=0.00).'

const illustration = defineIllustration((c) => (
    <Scene c={c} padding={12}>
        <GraphDiagram
            c={c}
            direction="TB"
            routing="dagre"
            labelFontSize={29}
            detailFontSize={26}
            nodeGap={22}
            rankGap={52}
            nodes={[
                {
                    id: 's1',
                    label: 'x^2 - 7x + 12 = 0',
                    detail: 'Factor quadratic',
                    tone: 'purple',
                },
                {
                    id: 's2a',
                    label: '(x - 3)(x - 4) = 0',
                    detail: '3/4 rollouts -> 0.75',
                    tone: 'green',
                },
                {
                    id: 's2b',
                    label: '(x + 3)(x - 4) = 0',
                    detail: '0/4 rollouts -> 0.00',
                    tone: 'critical',
                },
                { id: 'ok', label: '3 Pass', detail: 'Solve {3, 4}', tone: 'green' },
                { id: 'slip', label: '1 Sign slip', detail: 'Fails later', tone: 'warm' },
                {
                    id: 'dead',
                    label: '0 Recover',
                    detail: 'Roots {-3, 4}',
                    tone: 'critical',
                    muted: true,
                },
            ]}
            edges={[
                { from: 's1', to: 's2a', tone: 'green' },
                { from: 's1', to: 's2b', tone: 'critical', style: 'dashed' },
                { from: 's2a', to: 'ok', tone: 'green' },
                { from: 's2a', to: 'slip', tone: 'warm', style: 'dashed' },
                { from: 's2b', to: 'dead', tone: 'critical', style: 'dashed' },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
