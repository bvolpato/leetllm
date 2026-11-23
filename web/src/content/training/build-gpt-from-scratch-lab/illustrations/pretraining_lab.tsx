import React from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 880
export const height = 540
export const alt =
    'A token batch of shape 12 by 48 combines with learned positions to make hidden states of shape 12 by 48 by 96. A Pre-LN attention sublayer normalizes h, forms four heads of queries, keys, and values, and joins weighted values back to width 96; the first residual gives u = h + attention(LN1(h)). A second LayerNorm feeds a 96-to-384-to-96 GELU MLP, whose output adds back u to make h-prime. The block repeats twice. After block two, final normalization and the tied token-embedding transpose produce 17,485 logits at each of 48 positions. Boxes are schematic; listed shapes come from the lab model.'

function stagePanel(
    c: ThemeColors,
    width: number,
    title: string,
    tone: 'cyan' | 'warm' | 'purple',
    items: { label: string; shape: string; sub?: string }[],
) {
    return Panel({
        c,
        width,
        padding: 10,
        gap: 8,
        tone,
        title,
        titleFontSize: 16,
        children: Column({
            gap: 8,
            align: 'stretch',
            children: items.map((item, idx) =>
                Panel({
                    c,
                    width: width - 20,
                    padding: 8,
                    gap: 3,
                    tone: 'neutral',
                    title: item.label,
                    titleFontSize: 14,
                    children: Column({
                        gap: 2,
                        align: 'stretch',
                        children: [
                            TextLabel({
                                c,
                                text: item.shape,
                                width: width - 36,
                                fontSize: 13,
                                color: c.textPrimary,
                                mono: true,
                            }),
                            ...(item.sub
                                ? [
                                      TextLabel({
                                          c,
                                          text: item.sub,
                                          width: width - 36,
                                          fontSize: 12,
                                          color: c.textSecondary,
                                      }),
                                  ]
                                : []),
                        ],
                    }),
                }),
            ),
        }),
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 844,
        title: 'GPT Pretraining Computational Flow',
        subtitle:
            'From input tokens to vocabulary logits through repeated Pre-LN Transformer blocks.',
        children: Row({
            width: 844,
            gap: 12,
            align: 'stretch',
            justify: 'space-between',
            children: [
                stagePanel(c, 260, '1. Token & Position Input', 'cyan', [
                    {
                        label: 'Input Tokens X',
                        shape: 'shape: [12, 48]',
                        sub: 'B=12 sequences, T=48 context',
                    },
                    {
                        label: 'Embedding + WPE',
                        shape: 'W_e[X] + W_pos[0..47]',
                        sub: 'Vocab 17,485 · d_model=96',
                    },
                    {
                        label: 'Initial State h₀',
                        shape: 'shape: [12, 48, 96]',
                        sub: 'Normalized activation space',
                    },
                ]),
                stagePanel(c, 304, '2. Pre-LN Transformer Block (×2)', 'warm', [
                    {
                        label: 'LN₁ & Causal Attention',
                        shape: 'u = h + Attn(LN₁(h))',
                        sub: '4 heads · head_dim=24 · causal mask',
                    },
                    {
                        label: 'LN₂ & GELU MLP',
                        shape: "h' = u + MLP(LN₂(u))",
                        sub: 'Width 96 → 384 → 96 with GELU',
                    },
                    {
                        label: 'Residual Connections',
                        shape: 'Clean identity gradient path',
                        sub: 'Pre-LN prevents gradient vanishing',
                    },
                ]),
                stagePanel(c, 260, '3. Head & Vocabulary Loss', 'purple', [
                    {
                        label: 'Final LayerNorm',
                        shape: 'h_final = LN_f(h_L)',
                        sub: 'Zero mean, unit variance',
                    },
                    {
                        label: 'Tied LM Head',
                        shape: 'Logits = h_final · W_eᵀ',
                        sub: 'shape: [12, 48, 17485]',
                    },
                    {
                        label: 'Cross-Entropy Loss',
                        shape: 'L_CE against shifted targets',
                        sub: 'Uniform baseline: ln(17485) ≈ 9.77',
                    },
                ]),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
