import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'

export const width = 760
export const height = 680
export const opaqueBackground = false

export const alt =
    'DeepSeek-R1 four-stage pipeline: V3-Base initializes Stage 1 cold-start SFT and Stage 2 GRPO RL, which filters 600k reasoning traces plus 200k general examples onto a fresh V3-Base checkpoint in Stage 3 before Stage 4 broad RL and dense distillation.'

const illustration = defineIllustration((c) => (
    <Scene c={c} padding={10}>
        <GraphDiagram
            c={c}
            direction="TB"
            routing="dagre"
            labelFontSize={25}
            detailFontSize={22}
            nodeGap={18}
            rankGap={24}
            nodes={[
                { id: 'base', label: 'V3-Base (671B)', detail: 'Pretrained base', tone: 'neutral' },
                { id: 's1', label: '1. Cold SFT', detail: 'Readable CoT init', tone: 'blue' },
                { id: 's2', label: '2. GRPO RL', detail: '600k CoT traces', tone: 'purple' },
                { id: 's3', label: '3. Fresh V3 SFT', detail: 'V3-Base + 800k SFT', tone: 'warm' },
                { id: 's4', label: '4. Broad RL', detail: 'DeepSeek-R1 (671B)', tone: 'green' },
                { id: 'dist', label: 'Dense Distill', detail: '1.5B - 70B SFT', tone: 'cyan' },
            ]}
            edges={[
                { from: 'base', to: 's1', tone: 'blue' },
                { from: 'base', to: 's3', tone: 'warm', style: 'dashed' },
                { from: 's1', to: 's2', tone: 'purple' },
                { from: 's2', to: 's3', tone: 'warm' },
                { from: 's3', to: 's4', tone: 'green' },
                { from: 's3', to: 'dist', tone: 'cyan' },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
