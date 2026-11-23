import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

type Colors = ReturnType<typeof getThemeColors>

export const width = 860
export const height = 520

export const alt =
    'At w=0 with squared-error loss, rank 0 has one target [1] and local mean gradient −2; rank 1 has three targets [3,3,3] and local mean gradient −6. Equal averaging of rank means gives (−2−6)/2=−4. The pooled four-target mean gives (−2−6−6−6)/4=−5, which default DDP reproduces with factors 2×1/4=0.5 and 2×3/4=1.5 when both ranks use the shared total-target denominator.'

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 650,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: w,
            fontSize,
            color,
            fontWeight,
            align,
            mono,
        }),
    })
}

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
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
        // Left Panel (Ranks and Token Mass)
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 390,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        // Right Panel (Reduction Math)
        SvgFrame({
            c,
            x: 430,
            y: 50,
            width: 410,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),

        // Rank 0 Box
        SvgFrame({
            c,
            x: 40,
            y: 110,
            width: 350,
            height: 100,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: blue,
            strokeWidth: 1.5,
            key: 'box-rank-0',
        }),
        // Rank 1 Box
        SvgFrame({
            c,
            x: 40,
            y: 230,
            width: 350,
            height: 100,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: purple,
            strokeWidth: 1.5,
            key: 'box-rank-1',
        }),

        // Tokens in Rank 0 (1 token)
        SvgFrame({
            c,
            x: 180,
            y: 130,
            width: 50,
            height: 36,
            rx: 4,
            fill: blue,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'tok-r0-0',
        }),

        // Tokens in Rank 1 (3 tokens)
        SvgFrame({
            c,
            x: 180,
            y: 250,
            width: 50,
            height: 36,
            rx: 4,
            fill: purple,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'tok-r1-0',
        }),
        SvgFrame({
            c,
            x: 240,
            y: 250,
            width: 50,
            height: 36,
            rx: 4,
            fill: purple,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'tok-r1-1',
        }),
        SvgFrame({
            c,
            x: 300,
            y: 250,
            width: 50,
            height: 36,
            rx: 4,
            fill: purple,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'tok-r1-2',
        }),

        // Right Panel: Naive card
        SvgFrame({
            c,
            x: 450,
            y: 110,
            width: 370,
            height: 90,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: warm,
            strokeWidth: 1.5,
            key: 'card-naive',
        }),
        // Right Panel: Correct Pooled card
        SvgFrame({
            c,
            x: 450,
            y: 220,
            width: 370,
            height: 100,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: green,
            strokeWidth: 1.5,
            key: 'card-pooled',
        }),
        // Right Panel: DDP pre-scaling rule card
        SvgFrame({
            c,
            x: 450,
            y: 335,
            width: 370,
            height: 105,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-ddp-rule',
        }),
    )

    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapeSvg }),
            label(
                c,
                'Distributed Data Parallel (DDP): Token-Weighted Gradient Reduction',
                20,
                12,
                width - 40,
                30,
                22,
                c.textPrimary,
                700,
                'center',
            ),

            // Left Panel
            label(
                c,
                '1. Variable Token Batch Asymmetry (2 Ranks)',
                35,
                62,
                360,
                24,
                16,
                c.textPrimary,
            ),
            label(
                c,
                'Padded or masked sequences produce unequal active token counts',
                35,
                86,
                360,
                20,
                12,
                muted,
            ),

            label(c, 'Rank 0 (1 Token)', 55, 122, 120, 20, 13, blue),
            label(c, 'Target: [1]', 55, 144, 120, 18, 11, muted),
            label(c, 'y=1', 180, 138, 50, 20, 12, c.textPrimary, 650, 'center'),
            label(c, 'Local Mean ∇ = −2.0  (25% of tokens)', 55, 180, 320, 20, 12, blue),

            label(c, 'Rank 1 (3 Tokens)', 55, 242, 120, 20, 13, purple),
            label(c, 'Targets: [3, 3, 3]', 55, 264, 120, 18, 11, muted),
            label(c, 'y=3', 180, 258, 50, 20, 12, c.textPrimary, 650, 'center'),
            label(c, 'y=3', 240, 258, 50, 20, 12, c.textPrimary, 650, 'center'),
            label(c, 'y=3', 300, 258, 50, 20, 12, c.textPrimary, 650, 'center'),
            label(c, 'Local Mean ∇ = −6.0  (75% of tokens)', 55, 300, 320, 20, 12, purple),

            label(
                c,
                'Total batch tokens = 4 (Rank 0: 1/4 = 25% · Rank 1: 3/4 = 75%)',
                40,
                355,
                350,
                20,
                12,
                c.textPrimary,
            ),
            label(
                c,
                'Unweighted all-reduce treats both ranks as 50/50 contributors.',
                40,
                380,
                350,
                20,
                11,
                warm,
            ),
            label(
                c,
                'This distorts the true empirical gradient direction.',
                40,
                402,
                350,
                20,
                11,
                muted,
            ),

            // Right Panel
            label(c, '2. Gradient Reduction Comparison', 445, 62, 380, 24, 16, c.textPrimary),
            label(
                c,
                'Correct pooled expectation vs naive average of rank means',
                445,
                86,
                380,
                20,
                12,
                muted,
            ),

            label(c, 'Naive Mean of Ranks (Wrong)', 465, 118, 340, 20, 13, warm),
            label(c, '∇ = (−2.0 + −6.0) / 2 = −4.0', 465, 142, 340, 24, 15, warm, 650, 'center'),
            label(
                c,
                'Over-weights Rank 0 (sparse batch) and under-weights Rank 1',
                465,
                172,
                340,
                18,
                11,
                muted,
            ),

            label(c, 'True Pooled Mean Over All Tokens (Correct)', 465, 228, 340, 20, 13, green),
            label(
                c,
                '∇ = (−2 + 3 × −6) / 4 = −20 / 4 = −5.0',
                465,
                252,
                340,
                24,
                15,
                green,
                650,
                'center',
            ),
            label(
                c,
                'Matches exact single-GPU loss reduction over the 4 targets',
                465,
                282,
                340,
                18,
                11,
                green,
            ),

            label(c, 'DDP Implementation Rule', 465, 342, 340, 20, 13, c.textPrimary),
            label(
                c,
                'Pre-scale local gradient before all-reduce by: (N × T_local) / T_total',
                465,
                366,
                340,
                18,
                11,
                c.textPrimary,
            ),
            label(
                c,
                '• Rank 0 factor: 2 × (1 / 4) = 0.50  →  ∇_local × 0.50 = −1.0',
                465,
                388,
                340,
                18,
                11,
                blue,
            ),
            label(
                c,
                '• Rank 1 factor: 2 × (3 / 4) = 1.50  →  ∇_local × 1.50 = −9.0',
                465,
                408,
                340,
                18,
                11,
                purple,
            ),
            label(
                c,
                'Sum = −10.0; NCCL all-reduce divides by N=2 to recover −5.0 exactly.',
                465,
                428,
                340,
                18,
                10,
                green,
            ),

            label(
                c,
                'Token-weighted all-reduce · Ensures multi-node DDP gradients exactly match single-device loss mathematics',
                20,
                480,
                width - 40,
                24,
                14,
                muted,
                650,
                'center',
            ),
        ],
    })
}

export default create('dark')
