import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
import data from '../assets/figure_data.json'

export const width = 820
export const height = 435
export const alt =
    'Growth targets 10, 20, and 60 mm are plotted against 1, 2, and 5 sunlight hours. All predictions begin at 30 mm. A stump averages residuals into corrections minus 15, minus 15, and plus 30. Learning rate 0.1 moves the predictions by delta arrows to 28.5, 28.5, and 33.0 mm, leaving shorter dashed vertical residual stems.'

export function create(mode: ThemeMode = 'dark') {
    const fig = new Figure(mode, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const isLight = mode === 'light'

    // Clean legend row across top
    fig.circle(78, 22, 5.5, { fill: c.bg, stroke: blue, width: 2 })
    fig.text(90, 22, 'Initial F₀ = 30 mm', { size: 13, weight: 600, color: blue })

    fig.rect(254, 16, 12, 12, { fill: green, radius: 2 })
    fig.text(274, 22, 'Updated F₁ (η = 0.10)', { size: 13, weight: 600, color: green })

    fig.circle(458, 22, 6, { fill: warm })
    fig.text(472, 22, 'Target growth y', { size: 13, weight: 600, color: warm })

    fig.line(606, 22, 632, 22, { color: warm, width: 2, dash: '4 4' })
    fig.text(640, 22, 'Remaining residual', { size: 13, color: c.textSecondary })

    // Frameless plot on transparent ground
    const plot = fig.plot(
        { x: 76, y: 54, width: 528, height: 318 },
        { x: [0.3, 5.7], y: [0, 70] },
    )
    plot.axes({
        xTicks: [1, 2, 3, 4, 5],
        yTicks: [0, 10, 20, 30, 40, 50, 60, 70],
        xLabel: 'Sunlight (hours per day)',
        yLabel: 'Growth (mm)',
        grid: true,
        labelSize: 13,
    })

    // Initial prediction baseline at y = 30
    fig.line(plot.area.x, plot.py(30), plot.px(5.15), plot.py(30), {
        color: blue,
        dash: '6 5',
        width: 1.75,
    })
    fig.text(plot.area.x + 6, plot.py(30) - 11, 'F₀ = 30', {
        size: 12,
        weight: 600,
        color: blue,
    })

    // Step line of updated F1 predictions
    plot.curve(
        [
            [0.45, 28.5],
            [3.5, 28.5],
            [3.5, 33.0],
            [5.15, 33.0],
        ],
        { color: green, width: 1.8, opacity: 0.55 },
    )

    // Plot each plant's target, initial, delta arrow, updated square, and remaining residual
    data.sunlight.forEach((hours: number, i: number) => {
        const target = data.growth[i]!
        const updated = data.rounds[1]![i]!
        const px = plot.px(hours)
        const yInit = plot.py(30)
        const yUpd = plot.py(updated)
        const yTgt = plot.py(target)
        const delta = updated - 30

        // Remaining residual dashed stem from updated prediction to target
        fig.line(px, yUpd, px, yTgt, {
            color: warm,
            width: 2.2,
            dash: '5 4',
        })

        // Offset delta arrow showing the small eta * h1 step from 30 -> updated
        const arrowX = px + 18
        fig.arrow(arrowX, yInit, arrowX, yUpd + (delta > 0 ? -3 : 3), {
            color: green,
            width: 2.2,
            head: 6,
        })

        // Markers: target dot, initial hollow dot, updated green square
        fig.circle(px, yTgt, 6.5, { fill: warm, stroke: c.bg, width: 1.8 })
        fig.circle(px, yInit, 5.5, { fill: c.bg, stroke: blue, width: 2.2 })
        fig.rect(px - 6, yUpd - 6, 12, 12, { fill: green, stroke: c.bg, strokeWidth: 1.5, radius: 2 })

        // Clean non-colliding value labels
        const tgtOffsetY = target < 30 ? 18 : -16
        fig.text(px, yTgt + tgtOffsetY, `${target} mm`, {
            size: 13,
            weight: 700,
            color: warm,
            align: 'center',
            mono: true,
        })

        // Offset updated value labels clearly away from vertical dashed stems!
        if (i === 0) {
            fig.text(px + 28, yUpd + 10, '28.5', {
                size: 13,
                weight: 700,
                color: green,
                mono: true,
            })
            fig.text(px + 28, yUpd + 25, '(−1.5)', {
                size: 11,
                color: green,
                mono: true,
            })
        } else if (i === 1) {
            fig.text(px + 28, yUpd + 10, '28.5', {
                size: 13,
                weight: 700,
                color: green,
                mono: true,
            })
            fig.text(px + 28, yUpd + 25, '(−1.5)', {
                size: 11,
                color: green,
                mono: true,
            })
        } else {
            // Offset 33.0 cleanly to the right of x=5 with full clearance from lines
            fig.text(px + 26, yUpd - 10, '33.0', {
                size: 13,
                weight: 700,
                color: green,
                mono: true,
            })
            fig.text(px + 26, yUpd + 7, '(+3.0)', {
                size: 11,
                color: green,
                mono: true,
            })
        }
    })

    // Right-hand side clean algebraic step summary (frameless subtle tint strip, no heavy slab)
    const sx = 632
    const sw = 172
    fig.line(616, 60, 616, 368, { color: c.borderSubtle, width: 1 })

    fig.text(sx, 68, 'Round 1 stump', { size: 14, weight: 700 })
    fig.text(sx, 92, 'Split: sunlight <= 3.5h', { size: 12, color: c.textSecondary, mono: true })

    // Left leaf cardless block
    fig.rect(sx, 118, sw, 82, {
        fill: tint(green, c.bg, isLight ? 0.08 : 0.12),
        stroke: tint(green, c.borderSubtle, 0.4),
        strokeWidth: 1,
        radius: 6,
    })
    fig.text(sx + 10, 134, 'Left leaf (1h, 2h)', { size: 12, weight: 700, color: c.textPrimary })
    fig.text(sx + 10, 155, 'mean res = −15.0', { size: 12, color: warm, mono: true })
    fig.text(sx + 10, 178, '30 + 0.1(−15) = 28.5', { size: 12, weight: 700, color: green, mono: true })

    // Right leaf block
    fig.rect(sx, 218, sw, 82, {
        fill: tint(green, c.bg, isLight ? 0.08 : 0.12),
        stroke: tint(green, c.borderSubtle, 0.4),
        strokeWidth: 1,
        radius: 6,
    })
    fig.text(sx + 10, 234, 'Right leaf (5h)', { size: 12, weight: 700, color: c.textPrimary })
    fig.text(sx + 10, 255, 'mean res = +30.0', { size: 12, color: warm, mono: true })
    fig.text(sx + 10, 278, '30 + 0.1(+30) = 33.0', { size: 12, weight: 700, color: green, mono: true })

    fig.text(sx, 330, 'MSE drops:', { size: 12, color: c.textSecondary })
    fig.text(sx, 350, '466.7 -> 381.2', { size: 14, weight: 700, color: blue, mono: true })

    return fig.render()
}

export default create()

export { boostingFilm as createFilm } from './_parts/boosting-film'
