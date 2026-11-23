import React from 'react'
import { GraphDiagram, Scene, TextLabel, defineIllustration, withDensity } from 'vizmatic'

export const width = 720
export const height = 680
export const alt =
    'One token hidden state of width 6,144 splits into MLA query latent 2,048 and KV latent 512. Twenty-one layers run a fresh DSA 32-head indexer while fifty-seven IndexShare layers reuse a prior shortlist of up to 2,048 causal positions. Sparse attention feeds a router picking eight of 256 experts plus one shared expert before summing back into the 6,144 residual stream.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity({ ...baseC, shadow: 'transparent' }, 1.55)
    return (
        <Scene c={c} background="transparent" padding={20} gap={14} contentWidth={680}>
            <TextLabel
                c={c}
                text="One token across a sparse GLM-5.3 MoE layer"
                fontSize={26}
                fontWeight={700}
                color={c.textPrimary}
                width={680}
            />
            <GraphDiagram
                c={c}
                width={680}
                height={530}
                direction="TB"
                nodeGap={28}
                rankGap={34}
                labelFontSize={23}
                detailFontSize={22}
                routing="orthogonal"
                padding={10}
                nodes={[
                    {
                        id: 'hidden',
                        label: 'Hidden 6,144 · MLA Latents',
                        detail: 'Q 2,048 · KV 512',
                        tone: 'blue',
                    },
                    {
                        id: 'fresh',
                        label: 'Fresh DSA (21L)',
                        detail: '32x128 FP8 indexer',
                        tone: 'purple',
                    },
                    {
                        id: 'share',
                        label: 'IndexShare (57L)',
                        detail: 'Reuses prior shortlist',
                        tone: 'warm',
                    },
                    {
                        id: 'attn',
                        label: 'Sparse MLA Attention',
                        detail: 'Top-2,048 causal IDs',
                        tone: 'cyan',
                    },
                    {
                        id: 'routed',
                        label: 'Top-8 of 256 MoE',
                        detail: 'Sigmoid FP32 router',
                        tone: 'green',
                    },
                    {
                        id: 'shared',
                        label: '1 Shared Expert',
                        detail: 'Always active (2,048)',
                        tone: 'blue',
                    },
                ]}
                edges={[
                    { from: 'hidden', to: 'fresh', tone: 'purple' },
                    { from: 'hidden', to: 'share', tone: 'warm' },
                    { from: 'fresh', to: 'attn', tone: 'purple' },
                    { from: 'share', to: 'attn', tone: 'warm' },
                    { from: 'attn', to: 'routed', tone: 'green' },
                    { from: 'attn', to: 'shared', tone: 'blue' },
                ]}
            />
            <TextLabel
                c={c}
                text="Routed + shared outputs sum back into the 6,144 residual stream"
                fontSize={22}
                color={c.textSecondary}
                width={680}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
