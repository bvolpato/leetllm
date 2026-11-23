import React, { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 520
export const alt =
    'Seven token positions show two loss masks: CPT scores positions 2–7, while response-only SFT scores positions 4–7. In the two-input gradient walkthrough, the scored target y₂=2 backpropagates through h₂=e₀+e₁, so input embedding rows 0 and 1 receive gradients. Input row 2 is unused. Those rows update only when the base embeddings are trainable.'

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cptColor = getReadableToneColor('cyan', c)
    const sftColor = getReadableToneColor('purple', c)
    const gradColor = getReadableToneColor('green', c)
    const mutedColor = c.textSecondary

    const tokens = ['tok 1', 'tok 2', 'tok 3', 'tok 4', 'tok 5', 'tok 6', 'tok 7']
    const cptScored = [false, true, true, true, true, true, true]
    const sftScored = [false, false, false, true, true, true, true]

    const tokenShapes: ReactNode[] = []
    tokens.forEach((name, i) => {
        const tx = 35 + i * 50
        tokenShapes.push(
            SvgFrame({
                c,
                x: tx,
                y: 120,
                width: 44,
                height: 30,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1,
                key: `tok-${i}`,
            }),
            SvgFrame({
                c,
                x: tx + 14,
                y: 180,
                width: 16,
                height: 16,
                rx: 8,
                fill: cptScored[i] ? cptColor : 'transparent',
                stroke: cptScored[i] ? cptColor : c.borderSubtle,
                strokeWidth: 2,
                key: `cpt-dot-${i}`,
            }),
            SvgFrame({
                c,
                x: tx + 14,
                y: 230,
                width: 16,
                height: 16,
                rx: 8,
                fill: sftScored[i] ? sftColor : 'transparent',
                stroke: sftScored[i] ? sftColor : c.borderSubtle,
                strokeWidth: 2,
                key: `sft-dot-${i}`,
            }),
        )
    })

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Panel 1: Sequence Loss Masks
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 390,
            height: 400,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-masks',
        }),
        // Panel 2: Gradient Flow
        SvgFrame({
            c,
            x: 430,
            y: 50,
            width: 410,
            height: 400,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-grads',
        }),
        ...tokenShapes,
        // Node frames in right panel
        SvgFrame({
            c,
            x: 450,
            y: 120,
            width: 80,
            height: 48,
            rx: 6,
            fill: cptColor,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'node-input',
        }),
        SvgFrame({
            c,
            x: 560,
            y: 120,
            width: 100,
            height: 48,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'node-h',
        }),
        SvgFrame({
            c,
            x: 690,
            y: 120,
            width: 120,
            height: 48,
            rx: 6,
            fill: sftColor,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'node-loss',
        }),
        // Arrows in forward flow
        VectorArrow({
            x1: 532,
            y1: 144,
            x2: 556,
            y2: 144,
            color: c.textSecondary,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        VectorArrow({
            x1: 662,
            y1: 144,
            x2: 686,
            y2: 144,
            color: c.textSecondary,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        // Backward gradient arrow
        VectorArrow({
            x1: 750,
            y1: 172,
            x2: 490,
            y2: 172,
            color: gradColor,
            strokeWidth: 2,
            arrowSize: 7,
        }),

        // Embedding rows
        SvgFrame({
            c,
            x: 450,
            y: 270,
            width: 360,
            height: 38,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: gradColor,
            strokeWidth: 1.5,
            key: 'emb-row-0',
        }),
        SvgFrame({
            c,
            x: 450,
            y: 316,
            width: 360,
            height: 38,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: gradColor,
            strokeWidth: 1.5,
            key: 'emb-row-1',
        }),
        SvgFrame({
            c,
            x: 450,
            y: 362,
            width: 360,
            height: 38,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'emb-row-2',
        }),
    )

    const tokenLabels = tokens.map((name, i) =>
        label(c, name, 35 + i * 50, 126, 44, 20, 12, c.textPrimary, 'center'),
    )

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({ x: 0, y: 0, width, height, children: shapeSvg }),
                label(
                    c,
                    'Continued Pretraining: Loss Masking and Gradient Flow',
                    20,
                    12,
                    width - 40,
                    30,
                    22,
                    c.textPrimary,
                    'center',
                ),

                // Left Panel Labels
                label(c, 'Sequence Loss Mask Comparison', 35, 62, 360, 24, 16, c.textPrimary),
                label(c, 'Token sequence positions:', 35, 94, 360, 20, 13, mutedColor),
                ...tokenLabels,

                label(c, 'CPT Mask: 6/7 positions scored (86%)', 35, 155, 360, 20, 14, cptColor),
                label(
                    c,
                    'All continuation tokens contribute to loss',
                    35,
                    202,
                    360,
                    20,
                    12,
                    mutedColor,
                ),

                label(c, 'Response-only SFT: 4/7 scored (57%)', 35, 252, 360, 20, 14, sftColor),
                label(
                    c,
                    'Prompt tokens masked out from direct prediction loss',
                    35,
                    298,
                    360,
                    20,
                    12,
                    mutedColor,
                ),

                label(
                    c,
                    'CPT updates broad linguistic and domain distributions',
                    35,
                    360,
                    360,
                    20,
                    13,
                    c.textPrimary,
                ),
                label(
                    c,
                    'by scoring every unmasked token across documents.',
                    35,
                    385,
                    360,
                    20,
                    13,
                    mutedColor,
                ),

                // Right Panel Labels
                label(c, 'Prompt Gradients During Adaptation', 445, 62, 380, 24, 16, c.textPrimary),
                label(
                    c,
                    'Scored response tokens backpropagate into prompt embeddings:',
                    445,
                    92,
                    380,
                    20,
                    13,
                    mutedColor,
                ),

                label(c, 'Input IDs\n[0, 1]', 450, 126, 80, 36, 12, c.textPrimary, 'center'),
                label(
                    c,
                    'Hidden State\nh₂ = e₀ + e₁',
                    560,
                    126,
                    100,
                    36,
                    12,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Target y₂ = 2\nLoss = 1.862',
                    690,
                    126,
                    120,
                    36,
                    12,
                    c.textPrimary,
                    'center',
                ),

                label(
                    c,
                    '∇ Loss backpropagates into e₀ and e₁',
                    450,
                    182,
                    360,
                    20,
                    13,
                    gradColor,
                    'center',
                ),

                label(c, 'Base Embedding Rows Update Status', 445, 242, 380, 20, 14, c.textPrimary),
                label(
                    c,
                    'Row 0 (e₀): Receives gradient ∇ > 0 (Active)',
                    460,
                    278,
                    340,
                    22,
                    13,
                    gradColor,
                ),
                label(
                    c,
                    'Row 1 (e₁): Receives gradient ∇ > 0 (Active)',
                    460,
                    324,
                    340,
                    22,
                    13,
                    gradColor,
                ),
                label(
                    c,
                    'Row 2 (e₂): Unused in context · ∇ = 0 (Frozen)',
                    460,
                    370,
                    340,
                    22,
                    13,
                    mutedColor,
                ),

                label(
                    c,
                    'Base embeddings only update when declared trainable in the optimizer.',
                    445,
                    412,
                    380,
                    20,
                    12,
                    mutedColor,
                ),

                // Footer
                label(
                    c,
                    'CPT density and representation updates · Gradient flow maintains cross-token semantic dependencies',
                    20,
                    475,
                    width - 40,
                    24,
                    14,
                    mutedColor,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
