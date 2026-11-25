import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 445
export const alt =
    'Visual comparison of Random Forest versus Gradient Boosting. Top: Random Forest trains three noisy bootstrap step trees independently in parallel and averages them into a smooth prediction curve, reducing variance. Bottom: Gradient Boosting runs sequentially across rounds, fitting a stump h1 to the initial residuals of F0 = 30 on plant growth targets (10, 20, 60 mm) and stepping by eta = 0.10 to shrink residuals across F1 and F4.'

// Smooth underlying 1D signal for Random Forest illustration
const trueFn = (x: number) => 0.5 + 0.34 * Math.sin((x - 0.5) * 1.45)

// Three noisy bootstrap step-tree approximations
const TREE_STEPS: readonly (readonly [number, number][])[] = [
    [
        [0, 0.14],
        [0.85, 0.14],
        [0.85, 0.92],
        [1.9, 0.92],
        [1.9, 0.62],
        [3.1, 0.62],
        [3.1, 0.08],
        [4, 0.08],
    ],
    [
        [0, 0.32],
        [0.55, 0.32],
        [0.55, 0.68],
        [2.3, 0.68],
        [2.3, 0.42],
        [3.4, 0.42],
        [3.4, 0.24],
        [4, 0.24],
    ],
    [
        [0, 0.06],
        [1.15, 0.06],
        [1.15, 0.85],
        [2.1, 0.85],
        [2.1, 0.74],
        [2.85, 0.74],
        [2.85, 0.22],
        [4, 0.22],
    ],
]

function evalStep(pts: readonly (readonly [number, number])[], x: number): number {
    for (let i = 0; i < pts.length - 1; i += 2) {
        if (x >= pts[i]![0] && x <= pts[i + 1]![0] + 1e-9) return pts[i]![1]
    }
    return pts[pts.length - 1]![1]
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // =========================================================================
    // TOP BAND: Random Forest (parallel noisy trees -> smooth average)
    // =========================================================================
    fig.text(24, 22, 'Random Forest · fit bootstrap trees in parallel, then average', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.math(836, 22, '\\bar{T}(x) = \\frac{1}{B}\\sum_{b=1}^{B} T_b(x)', {
        size: 14,
        color: green,
        align: 'right',
    })

    // Left: 3 stacked miniature tree curves (parallel)
    const miniW = 148
    const miniH = 44
    const miniX = 96
    const miniYs = [46, 102, 158]

    // Data source label + fan-out lines
    fig.rect(20, 104, 52, 38, {
        fill: tint(blue, c.bg, isLight ? 0.16 : 0.24),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(46, 123, 'Data', { size: 13, weight: 700, color: blue, align: 'center' })

    TREE_STEPS.forEach((steps, idx) => {
        const y0 = miniYs[idx]!
        const cy = y0 + miniH / 2
        // Fan-out from Data to each tree
        fig.path(`M72 123 C84 123, 84 ${cy}, ${miniX - 2} ${cy}`, {
            color: blue,
            width: 1.5,
            opacity: 0.8,
        })
        fig.rect(miniX, y0, miniW, miniH, {
            fill: tint(purple, c.bg, isLight ? 0.06 : 0.1),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 5,
        })
        const p = fig.plot({ x: miniX + 8, y: y0 + 6, width: miniW - 16, height: miniH - 12 }, { x: [0, 4], y: [0, 1] })
        p.fn(trueFn, { color: c.textMuted, width: 1.2, dash: '3 3', opacity: 0.7 }, 40)
        p.curve(steps, { color: purple, width: 1.8 })
        fig.text(miniX + miniW + 10, cy, `Tree ${idx + 1}`, {
            size: 12,
            weight: 600,
            color: purple,
        })

        // Converging arrows into Forest average plot
        fig.path(`M${miniX + miniW + 58} ${cy} C368 ${cy}, 386 124, 424 124`, {
            color: purple,
            width: 1.6,
            opacity: 0.8,
        })
    })
    fig.arrow(414, 124, 434, 124, { color: green, width: 2.2, head: 6 })
    fig.text(388, 192, 'average in parallel', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    // Right: Forest average plot (faint noisy trees + smooth bold average)
    const avgPlot = fig.plot({ x: 454, y: 50, width: 374, height: 146 }, { x: [0, 4], y: [0, 1] })
    fig.rect(avgPlot.area.x, avgPlot.area.y, avgPlot.area.width, avgPlot.area.height, {
        fill: tint(green, c.bg, isLight ? 0.05 : 0.08),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 6,
    })
    // Individual faint trees in background
    for (const steps of TREE_STEPS) {
        avgPlot.curve(steps, { color: purple, width: 1.1, opacity: 0.32 })
    }
    // True signal dashed
    avgPlot.fn(trueFn, { color: c.textMuted, width: 1.4, dash: '4 4' }, 80)
    // Average curve (sample densely across [0, 4])
    const avgPts: [number, number][] = []
    for (let i = 0; i <= 120; i++) {
        const xv = (i / 120) * 4
        const yv =
            (evalStep(TREE_STEPS[0]!, xv) +
                evalStep(TREE_STEPS[1]!, xv) +
                evalStep(TREE_STEPS[2]!, xv)) /
            3
        avgPts.push([xv, yv])
    }
    avgPlot.curve(avgPts, { color: green, width: 2.6 })
    fig.text(avgPlot.area.x + 10, avgPlot.area.y + 15, 'Forest mean (jagged variance cancels)', {
        size: 12,
        weight: 700,
        color: green,
    })
    fig.text(avgPlot.right - 10, avgPlot.bottom - 14, 'dashed: true signal', {
        size: 11,
        color: c.textMuted,
        align: 'right',
    })

    // Horizontal divider between Random Forest and Gradient Boosting
    fig.line(20, 218, 840, 218, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // BOTTOM BAND: Gradient Boosting (sequential residual shrinkage)
    // =========================================================================
    fig.text(24, 240, 'Gradient Boosting · each tree fits the current residuals sequentially', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.math(836, 240, 'F_m(x) = F_{m-1}(x) + \\eta\\,h_m(x)', {
        size: 14,
        color: warm,
        align: 'right',
    })

    const xs = [1, 2, 5]
    const ys = [10, 20, 60]
    const f0 = [30, 30, 30]
    const f1 = [28.5, 28.5, 33.0]
    const f4 = [24.84, 24.84, 40.32]
    const r0 = [-20, -10, 30]
    const h1 = [-15, -15, 30]

    const boxW = 176
    const boxH = 128
    const boxY = 276
    const boxXs = [24, 236, 448, 660]

    const drawStageBox = (
        x0: number,
        title: string,
        sub: string,
        tone: string,
        draw: (pArea: { x: number; y: number; width: number; height: number }) => void,
    ) => {
        fig.rect(x0, boxY, boxW, boxH, {
            fill: tint(tone, c.bg, isLight ? 0.05 : 0.08),
            stroke: tint(tone, c.borderSubtle, 0.45),
            strokeWidth: 1.2,
            radius: 6,
        })
        fig.text(x0 + boxW / 2, boxY - 11, title, {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
        })
        draw({ x: x0 + 16, y: boxY + 14, width: boxW - 32, height: boxH - 28 })
        fig.text(x0 + boxW / 2, boxY + boxH + 16, sub, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Stage 1: F0 = 30 with large residuals
    drawStageBox(boxXs[0]!, '1. Initial F₀ = 30', 'MSE = 466.7', blue, (area) => {
        const p = fig.plot(area, { x: [0.4, 5.6], y: [0, 70] })
        p.fn(() => 30, { color: blue, width: 2 }, 2)
        for (let i = 0; i < 3; i++) {
            fig.line(p.px(xs[i]!), p.py(f0[i]!), p.px(xs[i]!), p.py(ys[i]!), {
                color: warm,
                width: 2,
                dash: '3 3',
            })
            p.point(xs[i]!, ys[i]!, { color: warm, r: 4.5 })
        }
    })

    // Stage 2: Fit stump h1 to residuals [-20, -10, +30]
    drawStageBox(boxXs[1]!, '2. Fit h₁ to y − F₀', 'h₁ = [-15, -15, +30]', purple, (area) => {
        const p = fig.plot(area, { x: [0.4, 5.6], y: [-32, 38] })
        p.hline(0, undefined, { color: c.textMuted, dash: '2 3', width: 1 })
        // Stump step line
        p.curve(
            [
                [0.5, -15],
                [3.5, -15],
                [3.5, 30],
                [5.5, 30],
            ],
            { color: purple, width: 2.2 },
        )
        for (let i = 0; i < 3; i++) {
            p.point(xs[i]!, r0[i]!, { color: warm, r: 4.5 })
            p.point(xs[i]!, h1[i]!, { color: purple, r: 3.5, ring: true })
        }
    })

    // Stage 3: F1 = F0 + 0.1 * h1
    drawStageBox(boxXs[2]!, '3. Step F₁ = F₀ + ηh₁', 'MSE = 381.2', green, (area) => {
        const p = fig.plot(area, { x: [0.4, 5.6], y: [0, 70] })
        p.fn(() => 30, { color: blue, width: 1.2, dash: '3 3', opacity: 0.6 }, 2)
        p.curve(
            [
                [0.5, 28.5],
                [3.5, 28.5],
                [3.5, 33.0],
                [5.5, 33.0],
            ],
            { color: green, width: 2.2 },
        )
        for (let i = 0; i < 3; i++) {
            fig.line(p.px(xs[i]!), p.py(f1[i]!), p.px(xs[i]!), p.py(ys[i]!), {
                color: warm,
                width: 1.8,
                dash: '3 3',
            })
            p.point(xs[i]!, ys[i]!, { color: warm, r: 4.5 })
        }
    })

    // Stage 4: F4 after 4 sequential rounds
    drawStageBox(boxXs[3]!, '4. After 4 rounds (F₄)', 'MSE = 210.4', green, (area) => {
        const p = fig.plot(area, { x: [0.4, 5.6], y: [0, 70] })
        p.fn(() => 30, { color: blue, width: 1.1, dash: '3 3', opacity: 0.45 }, 2)
        p.curve(
            [
                [0.5, 24.84],
                [3.5, 24.84],
                [3.5, 40.32],
                [5.5, 40.32],
            ],
            { color: green, width: 2.5 },
        )
        for (let i = 0; i < 3; i++) {
            fig.line(p.px(xs[i]!), p.py(f4[i]!), p.px(xs[i]!), p.py(ys[i]!), {
                color: warm,
                width: 1.6,
                dash: '3 3',
            })
            p.point(xs[i]!, ys[i]!, { color: warm, r: 4.5 })
        }
    })

    // Sequential arrows between the 4 stages
    const arrowY = boxY + boxH / 2
    fig.arrow(boxXs[0]! + boxW + 4, arrowY, boxXs[1]! - 4, arrowY, { color: warm, width: 2, head: 6 })
    fig.arrow(boxXs[1]! + boxW + 4, arrowY, boxXs[2]! - 4, arrowY, { color: purple, width: 2, head: 6 })
    fig.arrow(boxXs[2]! + boxW + 4, arrowY, boxXs[3]! - 4, arrowY, {
        color: green,
        width: 2,
        dash: '4 3',
        head: 6,
    })

    return fig.render()
}

export default create
