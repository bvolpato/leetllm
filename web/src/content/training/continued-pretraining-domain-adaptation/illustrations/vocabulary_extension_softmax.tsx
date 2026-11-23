import { createElement, type ReactNode } from 'react'
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
export const height = 500
export const alt =
    'In a zero-logit walkthrough, two old output rows give target probability 0.5 and denominator Z=2. Adding a zero-logit row makes all three probabilities 1/3 and Z=3, while old logits stay fixed. On the same probability scale, target NLL rises from 0.693147 to 1.098612, an increase of ln(3/2)≈0.405465. Input embeddings also gain a row; the visualization isolates output softmax.'

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
    const target = getReadableToneColor('cyan', c)
    const other = getReadableToneColor('purple', c)
    const added = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Panel 1: Original Vocabulary (V=2)
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 380,
            height: 380,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-v2',
        }),
        // Panel 2: Extended Vocabulary (V=3)
        SvgFrame({
            c,
            x: 460,
            y: 50,
            width: 380,
            height: 380,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-v3',
        }),
        // Connecting arrow between panels
        VectorArrow({
            x1: 410,
            y1: 220,
            x2: 450,
            y2: 220,
            color: added,
            strokeWidth: 2.5,
            arrowSize: 8,
        }),
        // Bars in Panel 1 (V=2)
        SvgFrame({
            c,
            x: 160,
            y: 130,
            width: 180,
            height: 28,
            rx: 4,
            fill: target,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'bar-v2-target',
        }),
        SvgFrame({
            c,
            x: 160,
            y: 175,
            width: 180,
            height: 28,
            rx: 4,
            fill: other,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'bar-v2-other',
        }),
        // Card Z=2
        SvgFrame({
            c,
            x: 40,
            y: 235,
            width: 340,
            height: 70,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-z2',
        }),
        // Card NLL before
        SvgFrame({
            c,
            x: 40,
            y: 325,
            width: 340,
            height: 80,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-nll-before',
        }),

        // Bars in Panel 2 (V=3)
        SvgFrame({
            c,
            x: 600,
            y: 120,
            width: 120,
            height: 26,
            rx: 4,
            fill: target,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'bar-v3-target',
        }),
        SvgFrame({
            c,
            x: 600,
            y: 156,
            width: 120,
            height: 26,
            rx: 4,
            fill: other,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'bar-v3-other',
        }),
        SvgFrame({
            c,
            x: 600,
            y: 192,
            width: 120,
            height: 26,
            rx: 4,
            fill: added,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'bar-v3-added',
        }),
        // Card Z=3
        SvgFrame({
            c,
            x: 480,
            y: 235,
            width: 340,
            height: 70,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: added,
            strokeWidth: 1.5,
            key: 'card-z3',
        }),
        // Card NLL after
        SvgFrame({
            c,
            x: 480,
            y: 325,
            width: 340,
            height: 80,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: added,
            strokeWidth: 1.5,
            key: 'card-nll-after',
        }),
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
                    'Vocabulary Extension: Softmax Normalization Shift',
                    20,
                    12,
                    width - 40,
                    30,
                    22,
                    c.textPrimary,
                    'center',
                ),

                // Left Panel: V=2
                label(c, 'Original Output Space (V = 2)', 35, 62, 350, 24, 16, c.textPrimary),
                label(c, 'Both existing tokens have logit z = 0', 35, 88, 350, 20, 13, muted),

                label(c, 'Target token', 40, 134, 110, 20, 13, target),
                label(c, 'p = 0.50', 350, 134, 60, 20, 13, target),

                label(c, 'Other token', 40, 179, 110, 20, 13, other),
                label(c, 'p = 0.50', 350, 179, 60, 20, 13, other),

                label(c, 'Partition Function (Z)', 55, 245, 310, 20, 13, muted),
                label(c, 'Z = exp(0) + exp(0) = 2', 55, 270, 310, 24, 15, c.textPrimary),

                label(c, 'Target Negative Log-Likelihood', 55, 335, 310, 20, 13, muted),
                label(c, '−ln(p) = −ln(0.5) ≈ 0.693 nats', 55, 362, 310, 24, 15, c.textPrimary),

                // Right Panel: V=3
                label(c, 'Extended Output Space (V = 3)', 475, 62, 350, 24, 16, c.textPrimary),
                label(
                    c,
                    'Adding 1 new row with initialized logit z = 0',
                    475,
                    88,
                    350,
                    20,
                    13,
                    muted,
                ),

                label(c, 'Target token', 480, 123, 110, 20, 13, target),
                label(c, 'p = 1/3 ≈ 0.333', 730, 123, 100, 20, 12, target),

                label(c, 'Other token', 480, 159, 110, 20, 13, other),
                label(c, 'p = 1/3 ≈ 0.333', 730, 159, 100, 20, 12, other),

                label(c, 'New token', 480, 195, 110, 20, 13, added),
                label(c, 'p = 1/3 ≈ 0.333', 730, 195, 100, 20, 12, added),

                label(c, 'New Partition Function (Z)', 495, 245, 310, 20, 13, muted),
                label(c, 'Z = 2 + exp(0) = 3 (+50% denominator)', 495, 270, 310, 24, 15, added),

                label(c, 'Target Negative Log-Likelihood Shift', 495, 335, 310, 20, 13, muted),
                label(
                    c,
                    '−ln(1/3) ≈ 1.099 nats  (Δ = +ln(3/2) ≈ +0.405)',
                    495,
                    362,
                    310,
                    24,
                    15,
                    added,
                ),

                // Footer
                label(
                    c,
                    'Softmax dilution · Extending vocab size expands the denominator and increases initial loss across existing targets',
                    20,
                    455,
                    width - 40,
                    24,
                    14,
                    muted,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
