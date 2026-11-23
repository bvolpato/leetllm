import { createElement } from 'react'
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
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 860
export const height = 540
export const alt =
    'A completed-update-321 checkpoint contains the model weights, AdamW moments and step, train and validation generator states, token map, tokenizer, corpus identity, split, and configuration. The uninterrupted and restored paths draw paired batches of shape 12 by 48, run forward, cross-entropy, and AdamW step 322. The example checks identity metadata and restored token-map and RNG state, then compares probe logits, the next batch, loss, and updated weights in the same CPU process and environment.'

function checkpointHeader(c: ThemeColors) {
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)

    return Panel({
        c,
        width: 824,
        padding: 10,
        gap: 6,
        tone: 'purple',
        title: 'Step 321 Checkpoint State',
        titleFontSize: 16,
        children: Row({
            width: 804,
            gap: 12,
            justify: 'space-between',
            align: 'center',
            children: [
                BadgePill({
                    c,
                    text: 'Model Weights θ (4.2M params)',
                    tone: 'cyan',
                    fontSize: 14,
                    height: 26,
                }),
                BadgePill({
                    c,
                    text: 'AdamW State (m_t, v_t, step=321)',
                    tone: 'warm',
                    fontSize: 14,
                    height: 26,
                }),
                BadgePill({
                    c,
                    text: 'RNG Generator (train/val seed)',
                    tone: 'purple',
                    fontSize: 14,
                    height: 26,
                }),
                BadgePill({
                    c,
                    text: 'Metadata (vocab=17485, config)',
                    tone: 'neutral',
                    fontSize: 14,
                    height: 26,
                }),
            ],
        }),
    })
}

function executionBranch(
    c: ThemeColors,
    title: string,
    stepDetail: string,
    lossText: string,
    tone: 'cyan' | 'green',
) {
    return Panel({
        c,
        width: 394,
        padding: 12,
        gap: 8,
        tone,
        title,
        titleFontSize: 16,
        children: Column({
            gap: 6,
            align: 'stretch',
            children: [
                Row({
                    gap: 8,
                    justify: 'space-between',
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Batch (12 × 48):',
                            width: 130,
                            fontSize: 13,
                            color: c.textSecondary,
                        }),
                        BadgePill({
                            c,
                            text: 'Tokens from RNG step 321',
                            tone: 'neutral',
                            fontSize: 12,
                            height: 22,
                        }),
                    ],
                }),
                Row({
                    gap: 8,
                    justify: 'space-between',
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Forward & Loss:',
                            width: 130,
                            fontSize: 13,
                            color: c.textSecondary,
                        }),
                        TextLabel({
                            c,
                            text: lossText,
                            width: 180,
                            fontSize: 13,
                            color: c.textPrimary,
                            mono: true,
                        }),
                    ],
                }),
                Row({
                    gap: 8,
                    justify: 'space-between',
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Optimizer Update:',
                            width: 130,
                            fontSize: 13,
                            color: c.textSecondary,
                        }),
                        BadgePill({
                            c,
                            text: stepDetail,
                            tone,
                            fontSize: 12,
                            height: 22,
                        }),
                    ],
                }),
            ],
        }),
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 824,
        title: 'Deterministic Checkpoint Resume Equivalence',
        subtitle:
            'Restoring model weights, optimizer moments, and RNG state yields bit-identical training trajectories.',
        children: Column({
            width: 824,
            gap: 12,
            align: 'stretch',
            children: [
                checkpointHeader(c),
                Row({
                    width: 824,
                    gap: 16,
                    align: 'stretch',
                    justify: 'space-between',
                    children: [
                        executionBranch(
                            c,
                            'Path A: Uninterrupted Training',
                            'AdamW Step 322 applied',
                            'L_CE = 5.5492 nats',
                            'cyan',
                        ),
                        executionBranch(
                            c,
                            'Path B: Resumed From Checkpoint',
                            'AdamW Step 322 applied',
                            'L_CE = 5.5492 nats',
                            'green',
                        ),
                    ],
                }),
                Panel({
                    c,
                    width: 824,
                    padding: 10,
                    gap: 4,
                    tone: 'green',
                    title: 'Bitwise Parity Verified',
                    titleFontSize: 15,
                    children: Row({
                        width: 804,
                        gap: 12,
                        justify: 'space-around',
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'max |logit_A − logit_B| = 0.0',
                                width: 240,
                                fontSize: 13,
                                color: c.textPrimary,
                                mono: true,
                            }),
                            TextLabel({
                                c,
                                text: 'max |weight_A − weight_B| = 0.0',
                                width: 240,
                                fontSize: 13,
                                color: c.textPrimary,
                                mono: true,
                            }),
                            TextLabel({
                                c,
                                text: 'Identical random token batches',
                                width: 240,
                                fontSize: 13,
                                color: c.textPrimary,
                            }),
                        ],
                    }),
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
