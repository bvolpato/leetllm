export { createFilm } from './_parts/threshold-film'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 360
export const alt =
    'Validation error cost breakdown across thresholds t = 0.20, 0.50, and 0.80, split into unnecessary-verification cost ($18 per FP) and missed-claim cost ($120 per FN). Totals are $36 (2 FP, 0 FN), $138 (1 FP, 1 FN), and $240 (0 FP, 2 FN), making t = 0.20 the lowest-cost choice.'

const POLICIES = [
    { t: 0.2, fp: 2, fn: 0 },
    { t: 0.5, fp: 1, fn: 1 },
    { t: 0.8, fp: 0, fn: 2 },
].map((item) => ({
    ...item,
    fpCost: item.fp * 18,
    fnCost: item.fn * 120,
    total: item.fp * 18 + item.fn * 120,
}))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const green = fig.tone('green')
    const isLight = theme === 'light'

    // Clean top legend row
    fig.text(28, 22, 'Validation error cost by threshold', { size: 15, weight: 700 })

    fig.rect(476, 16, 16, 12, {
        fill: tint(warm, c.bg, isLight ? 0.35 : 0.48),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 3,
    })
    fig.text(498, 22, 'FP: $18 each', { size: 13, weight: 600, color: warm })

    fig.rect(624, 16, 16, 12, {
        fill: tint(red, c.bg, isLight ? 0.32 : 0.45),
        stroke: red,
        strokeWidth: 1.4,
        radius: 3,
    })
    fig.text(646, 22, 'FN: $120 each', { size: 13, weight: 600, color: red })

    // Frameless horizontal stacked bar area on [0, 260] USD
    const barX = 122
    const barW = 556
    const maxUsd = 260
    const xOf = (usd: number) => barX + (usd / maxUsd) * barW

    const topY = 62
    const botY = 294

    // Subtle vertical gridlines and crisp dollar ticks
    for (const tick of [0, 60, 120, 180, 240]) {
        const px = xOf(tick)
        fig.line(px, topY, px, botY, {
            color: c.borderSubtle,
            width: tick === 0 ? 1.4 : 1,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(px, botY + 16, `$${tick}`, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(barX + barW / 2, botY + 38, 'Total validation error cost (USD)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    const trackFill = tint(c.textMuted, c.bg, isLight ? 0.06 : 0.1)

    POLICIES.forEach((p, idx) => {
        const y = 84 + idx * 74
        const isBest = idx === 0
        const barH = 26

        // Threshold label on left
        fig.text(barX - 16, y + barH / 2 - 4, `t = ${p.t.toFixed(2)}`, {
            size: 14,
            weight: 700,
            color: isBest ? green : c.textPrimary,
            align: 'right',
            mono: true,
        })
        if (isBest) {
            fig.text(barX - 16, y + barH / 2 + 13, 'lowest cost', {
                size: 11,
                weight: 700,
                color: green,
                align: 'right',
            })
        }

        // Light, clean track background (no muddy slab!)
        fig.rect(barX, y, barW, barH, {
            fill: trackFill,
            stroke: c.borderSubtle,
            strokeWidth: 0.8,
            radius: 5,
        })

        // FP cost segment (warm amber)
        const fpW = (p.fpCost / maxUsd) * barW
        const fnW = (p.fnCost / maxUsd) * barW

        if (p.fpCost > 0) {
            fig.rect(barX, y, fpW, barH, {
                fill: tint(warm, c.bg, isLight ? 0.34 : 0.46),
                stroke: warm,
                strokeWidth: 1.5,
                radius: 5,
            })
        }
        // FN cost segment (critical red)
        if (p.fnCost > 0) {
            fig.rect(barX + fpW, y, fnW, barH, {
                fill: tint(red, c.bg, isLight ? 0.3 : 0.44),
                stroke: red,
                strokeWidth: 1.5,
                radius: 5,
            })
        }

        // Total cost badge on right of bar
        const endX = xOf(p.total)
        fig.text(endX + 12, y + barH / 2, `$${p.total}`, {
            size: 16,
            weight: 700,
            color: isBest ? green : red,
            mono: true,
        })

        // Compact arithmetic breakdown directly under the bar
        const breakdown = `${p.fp} FP ($${p.fpCost}) + ${p.fn} FN ($${p.fnCost}) = $${p.total}`
        fig.text(barX + 2, y + barH + 15, breakdown, {
            size: 12,
            color: c.textSecondary,
            mono: true,
        })
    })

    return fig.render()
}

export default create
