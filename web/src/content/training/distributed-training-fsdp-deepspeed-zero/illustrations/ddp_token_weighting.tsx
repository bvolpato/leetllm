import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    withColorAlpha,
    type ThemeMode,
} from 'vizmatic'

type Colors = ReturnType<typeof getThemeColors>

export const width = 760
export const height = 470

export const alt =
    'At w=0 with squared-error loss, rank 0 has one target [1] (local mean gradient -2) and rank 1 has three targets [3, 3, 3] (local mean gradient -6). Equal-rank averaging gives (-2-6)/2 = -4, skewing toward sparse rank 0. Scaling each rank by N * n_r / total (0.5 and 1.5) gives (-1-9)/2 = -5, matching the exact four-target pooled mean.'

function lbl(
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
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    // Bar chart geometry for gradient magnitude 0 -> -6
    const axisLeft = 220
    const axisW = 360
    const xForGrad = (g: number) => axisLeft + (Math.abs(g) / 6) * axisW
    const pooledX = xForGrad(-5)

    const tokenSlots = (baseX: number, filled: number, color: string, keyPrefix: string) =>
        [0, 1, 2, 3].map((i) =>
            createElement('rect', {
                key: `${keyPrefix}-${i}`,
                x: baseX + i * 78,
                y: 62,
                width: 68,
                height: 36,
                rx: 6,
                fill: i < filled ? withColorAlpha(color, 0.2) : 'none',
                stroke: i < filled ? color : c.borderSubtle,
                strokeWidth: i < filled ? 1.8 : 1.4,
                strokeDasharray: i < filled ? undefined : '4 3',
            }),
        )

    const shapeSvg = createElement(
        'svg',
        { width, height, viewBox: `0 0 ${width} ${height}`, role: 'presentation', 'aria-hidden': true },
        // Rank 0 card
        SvgFrame({
            c,
            key: 'r0',
            x: 16,
            y: 16,
            width: 352,
            height: 176,
            rx: 10,
            fill: c.bgCard,
            stroke: blue,
            strokeWidth: 1.6,
        }),
        // Rank 1 card
        SvgFrame({
            c,
            key: 'r1',
            x: 392,
            y: 16,
            width: 352,
            height: 176,
            rx: 10,
            fill: c.bgCard,
            stroke: purple,
            strokeWidth: 1.6,
        }),
        ...tokenSlots(36, 1, blue, 'r0tok'),
        ...tokenSlots(412, 3, purple, 'r1tok'),

        // Down arrows into reduction panel
        VectorArrow({ x1: 192, y1: 196, x2: 192, y2: 230, color: blue, strokeWidth: 2, arrowSize: 6 }),
        VectorArrow({ x1: 568, y1: 196, x2: 568, y2: 230, color: purple, strokeWidth: 2, arrowSize: 6 }),

        // Bottom comparison panel
        SvgFrame({
            c,
            key: 'bottom',
            x: 16,
            y: 236,
            width: 728,
            height: 218,
            rx: 10,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
        }),

        // Shared gradient axis (0 to -6)
        VectorSegment({ x1: axisLeft, y1: 404, x2: axisLeft + axisW, y2: 404, color: muted, strokeWidth: 1.6, showStartDot: false, showEndDot: false }),
        ...[0, -2, -4, -5, -6].map((tick) =>
            VectorSegment({
                key: `tick-${tick}`,
                x1: xForGrad(tick),
                y1: 398,
                x2: xForGrad(tick),
                y2: 410,
                color: tick === -5 ? green : muted,
                strokeWidth: tick === -5 ? 2 : 1.4,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        // Dashed reference line at exact pooled gradient = -5.0
        createElement('line', {
            key: 'pooled-ref',
            x1: pooledX,
            y1: 280,
            x2: pooledX,
            y2: 404,
            stroke: green,
            strokeWidth: 2,
            strokeDasharray: '5 4',
        }),

        // Bar 1: Equal-rank average (-4.0)
        SvgFrame({
            c,
            key: 'bar-naive-track',
            x: axisLeft,
            y: 292,
            width: axisW,
            height: 36,
            rx: 5,
            fill: c.bgSubtle,
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            key: 'bar-naive',
            x: axisLeft,
            y: 292,
            width: xForGrad(-4) - axisLeft,
            height: 36,
            rx: 5,
            fill: withColorAlpha(warm, 0.28),
            stroke: warm,
            strokeWidth: 1.8,
        }),

        // Bar 2: Token-weighted DDP (-5.0)
        SvgFrame({
            c,
            key: 'bar-weighted-track',
            x: axisLeft,
            y: 350,
            width: axisW,
            height: 36,
            rx: 5,
            fill: c.bgSubtle,
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            key: 'bar-weighted',
            x: axisLeft,
            y: 350,
            width: xForGrad(-5) - axisLeft,
            height: 36,
            rx: 5,
            fill: withColorAlpha(green, 0.28),
            stroke: green,
            strokeWidth: 1.8,
        }),
    )

    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapeSvg }),

            // Rank 0 labels
            lbl(c, 'Rank 0 · 1 token (25%)', 36, 28, 312, 24, 17, blue, 800),
            lbl(c, 'y=1', 36, 70, 68, 22, 16, blue, 700, 'center', true),
            lbl(c, 'local ∇ = −2.0', 36, 114, 312, 22, 16, c.textPrimary, 700, 'left', true),
            lbl(c, 'scale 2×¼ = 0.5 → −1.0', 36, 148, 312, 22, 16, blue, 700, 'left', true),

            // Rank 1 labels
            lbl(c, 'Rank 1 · 3 tokens (75%)', 412, 28, 312, 24, 17, purple, 800),
            lbl(c, 'y=3', 412, 70, 68, 22, 16, purple, 700, 'center', true),
            lbl(c, 'y=3', 490, 70, 68, 22, 16, purple, 700, 'center', true),
            lbl(c, 'y=3', 568, 70, 68, 22, 16, purple, 700, 'center', true),
            lbl(c, 'local ∇ = −6.0', 412, 114, 312, 22, 16, c.textPrimary, 700, 'left', true),
            lbl(c, 'scale 2×¾ = 1.5 → −9.0', 412, 148, 312, 22, 16, purple, 700, 'left', true),

            // Bottom panel title & pooled ref
            lbl(c, 'All-Reduce Mean Gradient (N = 2)', 34, 248, 380, 24, 17, c.textPrimary, 800),
            lbl(c, 'Pooled exact = −5.0', 440, 248, 280, 24, 16, green, 700, 'right', true),

            // Row 1 labels
            lbl(c, 'Equal-rank DDP', 34, 298, 176, 24, 16, warm, 700),
            lbl(c, '(−2 − 6)/2', axisLeft + 12, 299, 170, 22, 16, c.textPrimary, 700, 'left', true),
            lbl(c, '−4.0 (skewed)', 592, 298, 140, 24, 16, warm, 800, 'left', true),

            // Row 2 labels
            lbl(c, 'Token-weighted', 34, 356, 176, 24, 16, green, 700),
            lbl(c, '(−1 − 9)/2', axisLeft + 12, 357, 170, 22, 16, c.textPrimary, 700, 'left', true),
            lbl(c, '−5.0 (exact)', 592, 356, 140, 24, 16, green, 800, 'left', true),

            // Axis tick labels
            lbl(c, '0', xForGrad(0) - 20, 416, 40, 22, 16, muted, 600, 'center', true),
            lbl(c, '−2', xForGrad(-2) - 24, 416, 48, 22, 16, muted, 600, 'center', true),
            lbl(c, '−4', xForGrad(-4) - 24, 416, 48, 22, 16, warm, 700, 'center', true),
            lbl(c, '−5', xForGrad(-5) - 24, 416, 48, 22, 16, green, 800, 'center', true),
            lbl(c, '−6', xForGrad(-6) - 24, 416, 48, 22, 16, muted, 600, 'center', true),
        ],
    })
}

export default create('dark')
