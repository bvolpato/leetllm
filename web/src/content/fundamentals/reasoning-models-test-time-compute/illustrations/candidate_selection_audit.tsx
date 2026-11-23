import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'

export const width = 920
export const height = 560
export const opaqueBackground = false

export const alt =
    'Diagram of three test-time inference regimes branching from one prompt: greedy single-pass decoding emits one fast sequence, Best-of-N shares the prompt prefix across N parallel candidates scored at the end, and PRM beam search scores and prunes intermediate reasoning steps.'

const illustration = defineIllustration((c) => (
    <Scene c={c} padding={12}>
        <GraphDiagram
            c={c}
            direction="LR"
            routing="dagre"
            labelFontSize={29}
            detailFontSize={26}
            nodeGap={22}
            rankGap={46}
            nodes={[
                { id: 'prompt', label: 'Prompt Prefix', detail: 'Encoded once', tone: 'purple' },
                { id: 'greedy', label: 'Greedy Pass', detail: '1 trace, fast', tone: 'warm' },
                { id: 'bon', label: 'Best-of-N', detail: 'N parallel traces', tone: 'blue' },
                { id: 'prm', label: 'PRM Tree Search', detail: 'Branch per step', tone: 'green' },
                { id: 'orm', label: 'Terminal Score', detail: 'Vote / ORM select', tone: 'blue' },
                { id: 'prune', label: 'Prune & Expand', detail: 'Step-wise score', tone: 'green' },
            ]}
            edges={[
                { from: 'prompt', to: 'greedy', tone: 'warm' },
                { from: 'prompt', to: 'bon', tone: 'blue' },
                { from: 'prompt', to: 'prm', tone: 'green' },
                { from: 'bon', to: 'orm', tone: 'blue' },
                { from: 'prm', to: 'prune', tone: 'green' },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
