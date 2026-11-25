import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 395
export const alt =
    'Weighted memory retrieval score decomposition (0.50 similarity + 0.30 recency + 0.20 importance) contrasting Record A (1.7h old, 0.90 cosine -> 0.882 total) against Record B (24h old, 0.95 cosine -> 0.610 total), showing rank reversal from cosine-only to multi-factor scoring.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    // Left: Stacked weighted horizontal contribution bars (frameless!)
    fig.text(24, 22, 'Weighted Score Decomposition', { size: 15, weight: 700, color: c.textPrimary })
    fig.math(24, 46, 's = 0.50\\,\\text{sim} + 0.30\\,\\text{rec} + 0.20\\,\\text{imp}', {
        size: 13.5,
        color: c.textSecondary,
    })

    const barX = 24
    const barW = 456
    const drawStacked = (
        y: number,
        title: string,
        total: string,
        totalTone: string,
        sim: number,
        rec: number,
        imp: number,
        eq: string,
    ) => {
        fig.text(barX, y, title, { size: 14, weight: 700, color: c.textPrimary })
        fig.text(barX + barW, y, `Total ${total}`, {
            size: 14,
            mono: true,
            weight: 700,
            color: totalTone,
            align: 'right',
        })
        const by = y + 16
        const bh = 32
        fig.rect(barX, by, barW, bh, {
            fill: tint(c.borderSubtle, c.bg, theme === 'light' ? 0.35 : 0.28),
            radius: 5,
        })
        const w1 = sim * barW
        const w2 = rec * barW
        const w3 = imp * barW
        fig.rect(barX, by, w1, bh, { fill: blue, radius: 5 })
        fig.rect(barX + w1, by, w2, bh, { fill: green })
        fig.rect(barX + w1 + w2, by, w3, bh, { fill: purple, radius: 5 })

        const onBar = theme === 'light' ? '#ffffff' : c.bg
        fig.text(barX + w1 / 2, by + bh / 2, sim.toFixed(3), {
            size: 12.5,
            mono: true,
            weight: 700,
            color: onBar,
            align: 'center',
        })
        if (w2 > 54) {
            fig.text(barX + w1 + w2 / 2, by + bh / 2, rec.toFixed(3), {
                size: 12.5,
                mono: true,
                weight: 700,
                color: onBar,
                align: 'center',
            })
        }
        if (w3 > 52) {
            fig.text(barX + w1 + w2 + w3 / 2, by + bh / 2, imp.toFixed(3), {
                size: 12.5,
                mono: true,
                weight: 700,
                color: onBar,
                align: 'center',
            })
        }
        fig.text(barX, by + bh + 18, eq, { size: 12.5, mono: true, color: c.textSecondary })
    }

    drawStacked(
        82,
        'Record A (1.7h old · fresh trace)',
        '0.882',
        green,
        0.45,
        0.272,
        0.16,
        '0.50×0.90 (0.450) + 0.30×0.91 (0.272) + 0.20×0.80 (0.160)',
    )
    drawStacked(
        196,
        'Record B (24h old · 2 half-lives)',
        '0.610',
        warm,
        0.475,
        0.075,
        0.06,
        '0.50×0.95 (0.475) + 0.30×0.25 (0.075) + 0.20×0.30 (0.060)',
    )

    // Shared 0..1.00 ruler below bars
    const ry = 304
    fig.line(barX, ry, barX + barW, ry, { color: c.textMuted, width: 1.2 })
    for (const tk of [0, 0.25, 0.5, 0.75, 1.0]) {
        const tx = barX + tk * barW
        fig.line(tx, ry, tx, ry + 5, { color: c.textMuted, width: 1 })
        fig.text(tx, ry + 18, tk.toFixed(2), { size: 12, mono: true, color: c.textSecondary, align: 'center' })
    }

    // Compact legend swatches
    const ly = 362
    const leg = [
        { x: 24, label: 'Similarity (0.50)', color: blue },
        { x: 184, label: 'Recency (0.30)', color: green },
        { x: 336, label: 'Importance (0.20)', color: purple },
    ]
    for (const item of leg) {
        fig.rect(item.x, ly - 7, 13, 13, { fill: item.color, radius: 3 })
        fig.text(item.x + 19, ly, item.label, { size: 12.5, weight: 600, color: item.color })
    }

    // Divider
    fig.line(510, 22, 510, 368, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // Right: Slope / Grouped comparison proving rank reversal!
    fig.text(704, 22, 'Cosine Only vs. Multi-Factor', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(704, 42, 'Rank flips once recency & importance apply', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const rArea = { x: 574, y: 74, width: 292, height: 244 }
    const rPlot = fig.plot(rArea, { x: [0, 4], y: [0, 1.05] })
    for (const tk of [0, 0.25, 0.5, 0.75, 1.0]) {
        const py = rPlot.py(tk)
        fig.line(rArea.x, py, rPlot.right, py, {
            color: tk === 0 ? c.textMuted : c.borderSubtle,
            width: tk === 0 ? 1.2 : 1,
            dash: tk === 0 ? undefined : '3 4',
        })
        fig.text(rArea.x - 8, py, tk.toFixed(2), {
            size: 12,
            mono: true,
            color: c.textSecondary,
            align: 'right',
        })
    }

    const rBars = [
        { label: 'A cos', val: 0.9, color: blue },
        { label: 'B cos', val: 0.95, color: warm },
        { label: 'A total', val: 0.882, color: green },
        { label: 'B total', val: 0.61, color: warm },
    ]
    const sw = rArea.width / 4
    const bw = 44
    rBars.forEach((b, i) => {
        const cx = rArea.x + i * sw + sw / 2
        const topY = rPlot.py(b.val)
        fig.rect(cx - bw / 2, topY, bw, rPlot.bottom - topY, { fill: b.color, radius: 5 })
        fig.text(cx, topY - 12, b.val.toFixed(i >= 2 ? 3 : 2), {
            size: 12.5,
            mono: true,
            weight: 700,
            color: b.color,
            align: 'center',
        })
        fig.text(cx, rPlot.bottom + 18, b.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    })
    fig.text(720, 362, 'Rank flip: B (0.95) → A wins (0.882)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
