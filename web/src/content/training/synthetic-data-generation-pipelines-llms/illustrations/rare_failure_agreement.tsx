import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 370
export const alt =
    'A 10x10 grid of 100 evaluated synthetic rows shows 98 acceptable rows (green) and 2 severely flawed rows (red). Because an always-approve judge accepts all 100 rows, side-by-side metric bars on the right contrast 98% overall agreement (98/100) with 100% severe-flaw leakage (2/2), demonstrating why aggregate agreement hides rare failures.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const muted = c.textSecondary

    // Left: Clean 10x10 waffle grid of 100 rows (98 green, 2 red)
    const gx = 30
    const gy = 54
    const cell = 22
    const gap = 4

    fig.text(gx, 24, '100 evaluated rows (judge approves all 100)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    for (let r = 0; r < 10; r++) {
        for (let col = 0; col < 10; col++) {
            const idx = r * 10 + col
            const isBad = idx >= 98
            const x = gx + col * (cell + gap)
            const y = gy + r * (cell + gap)
            fig.rect(x, y, cell, cell, {
                fill: tint(isBad ? red : green, c.bg, isBad ? 0.45 : 0.24),
                stroke: isBad ? red : tint(green, c.bg, 0.55),
                strokeWidth: isBad ? 1.8 : 1,
                radius: 4,
            })
            if (isBad) {
                fig.text(x + cell / 2, y + cell / 2, '✕', {
                    size: 12,
                    weight: 700,
                    color: red,
                    align: 'center',
                })
            }
        }
    }

    // Legend under waffle grid
    const legY = gy + 10 * (cell + gap) + 14
    fig.rect(gx, legY - 6, 13, 13, {
        fill: tint(green, c.bg, 0.24),
        stroke: green,
        strokeWidth: 1.1,
        radius: 3,
    })
    fig.text(gx + 19, legY, '98 acceptable', { size: 12, weight: 600, color: green })
    fig.rect(gx + 128, legY - 6, 13, 13, {
        fill: tint(red, c.bg, 0.45),
        stroke: red,
        strokeWidth: 1.5,
        radius: 3,
    })
    fig.text(gx + 147, legY, '2 severe flaws (leaked)', { size: 12, weight: 700, color: red })

    // Curved callout from the 2 red cells to the right metric comparison
    const badCellX = gx + 9 * (cell + gap) + cell + 4
    const badCellY = gy + 9 * (cell + gap) + cell / 2
    fig.callout([badCellX, badCellY], [362, 232], '', {
        color: red,
        width: 1.8,
        bend: -0.18,
        arrow: 'source',
    })

    // Right: Direct comparative bars (Overall Agreement 98% vs Flaw Leakage 100%)
    const rx = 368
    const barW = 290

    fig.text(rx, 24, 'Same judge, two very different slices', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    // Metric 1: Overall Agreement (98%)
    const m1Y = 82
    fig.text(rx, m1Y, 'Overall agreement', { size: 15, weight: 700, color: c.textPrimary })
    fig.text(rx, m1Y + 20, '98 correct approvals out of 100 rows', { size: 12, color: muted })
    fig.rect(rx, m1Y + 38, barW, 32, { fill: tint(c.textMuted, c.bg, 0.08), radius: 5 })
    fig.rect(rx, m1Y + 38, barW * 0.98, 32, {
        fill: tint(green, c.bg, 0.34),
        stroke: green,
        strokeWidth: 1.6,
        radius: 5,
    })
    fig.text(rx + barW + 12, m1Y + 54, '98%', {
        size: 17,
        mono: true,
        weight: 700,
        color: green,
    })

    // Metric 2: Severe-Flaw Leakage (100%)
    const m2Y = 196
    fig.text(rx, m2Y, 'Severe-flaw admission rate', { size: 15, weight: 700, color: red })
    fig.text(rx, m2Y + 20, '2 false approvals out of 2 bad rows', { size: 12, color: muted })
    fig.rect(rx, m2Y + 38, barW, 32, { fill: tint(c.textMuted, c.bg, 0.08), radius: 5 })
    fig.rect(rx, m2Y + 38, barW, 32, {
        fill: tint(red, c.bg, 0.38),
        stroke: red,
        strokeWidth: 1.8,
        radius: 5,
    })
    fig.text(rx + barW + 12, m2Y + 54, '100%', {
        size: 17,
        mono: true,
        weight: 700,
        color: red,
    })

    // Shared 0..100% scale axis under bars
    const axY = 286
    fig.line(rx, axY, rx + barW, axY, { color: c.textMuted, width: 1 })
    ;[0, 50, 100].forEach((p) => {
        const px = rx + (p / 100) * barW
        fig.line(px, axY, px, axY + 4, { color: c.textMuted, width: 1 })
        fig.text(px, axY + 15, `${p}%`, { size: 11, mono: true, color: muted, align: 'center' })
    })

    fig.text(rx, 330, 'Track false-admission rate on critical slices separately.', {
        size: 13,
        weight: 600,
        color: muted,
    })

    return fig.render()
}

export default create('dark')
