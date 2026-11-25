import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 390
export const alt =
    'Side-by-side comparison of sorted next-token probabilities [0.42, 0.28, 0.16, 0.08, 0.06] and renormalized top-p nucleus weights at p = 0.85. Shifting cumulative sum right keeps token #3 (prior sum 0.70 < 0.85, cumsum 0.86), yielding renormalized weights 48.8%, 32.6%, and 18.6% while cutting #4 and #5.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    const tokens = [
        { idx: '#1', raw: 42, cum: '0.42', renorm: 48.8, kept: true, boundary: false },
        { idx: '#2', raw: 28, cum: '0.70', renorm: 32.6, kept: true, boundary: false },
        { idx: '#3', raw: 16, cum: '0.86', renorm: 18.6, kept: true, boundary: true },
        { idx: '#4', raw: 8, cum: '0.94', renorm: 0, kept: false, boundary: false },
        { idx: '#5', raw: 6, cum: '1.00', renorm: 0, kept: false, boundary: false },
    ]

    const drawPanel = (areaX: number, title: string, sub: string, isRenorm: boolean) => {
        const area = { x: areaX, y: 74, width: 344, height: 244 }
        fig.text(area.x + area.width / 2, 24, title, {
            size: 15,
            weight: 700,
            color: isRenorm ? green : blue,
            align: 'center',
        })
        fig.text(area.x + area.width / 2, 46, sub, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })

        const plot = fig.plot(area, { x: [0, 5], y: [0, 60] })
        // Clean round ticks: 0, 20, 40, 60%
        for (const tk of [0, 20, 40, 60]) {
            const py = plot.py(tk)
            fig.line(area.x, py, plot.right, py, {
                color: tk === 0 ? c.textMuted : c.borderSubtle,
                width: tk === 0 ? 1.2 : 1,
                dash: tk === 0 ? undefined : '3 4',
            })
            fig.text(area.x - 8, py, `${tk}%`, {
                size: 12,
                mono: true,
                color: c.textSecondary,
                align: 'right',
            })
        }

        const slotW = area.width / 5
        const barW = 42
        tokens.forEach((t, i) => {
            const cx = area.x + i * slotW + slotW / 2
            const val = isRenorm ? t.renorm : t.raw
            const h = Math.max(val > 0 ? 4 : 2, (val / 60) * area.height)
            const topY = plot.bottom - h
            const fill = t.boundary ? (isRenorm ? warm : blue) : t.kept ? green : tint(red, c.bg, 0.55)
            fig.rect(cx - barW / 2, topY, barW, h, { fill, radius: 5 })
            fig.text(cx, topY - 12, isRenorm ? `${val.toFixed(val > 0 ? 1 : 0)}%` : `${val}%`, {
                size: 12.5,
                mono: true,
                weight: 700,
                color: t.kept ? (t.boundary ? (isRenorm ? warm : blue) : green) : red,
                align: 'center',
            })
            fig.text(cx, plot.bottom + 18, t.idx, {
                size: 13.5,
                mono: true,
                weight: 700,
                color: c.textPrimary,
                align: 'center',
            })
            fig.text(cx, plot.bottom + 36, isRenorm ? (t.kept ? 'kept' : 'cut') : `Σ${t.cum}`, {
                size: 11.5,
                mono: true,
                color: t.kept ? c.textSecondary : red,
                align: 'center',
            })
        })

        // Shifted top_p = 0.85 cutoff divider between #3 and #4
        const cutX = area.x + 3 * slotW
        fig.line(cutX, area.y, cutX, plot.bottom + 4, { color: warm, width: 1.8, dash: '5 4' })
        fig.text(cutX + 6, area.y + 12, 'p = 0.85 cutoff', {
            size: 12,
            weight: 700,
            color: warm,
        })
    }

    drawPanel(64, 'Sorted Next-Token P(v)', 'Prior sum at #3 is 0.70 < 0.85 → #3 stays', false)
    fig.arrow(428, 196, 476, 196, { color: green, width: 2.2, head: 7 })
    fig.text(452, 176, '÷ 0.86', { size: 13, mono: true, weight: 700, color: green, align: 'center' })
    drawPanel(524, 'Renormalized Nucleus (p = 0.85)', 'Sum 0.86 → 48.8%, 32.6%, 18.6%', true)

    return fig.render()
}

export default create('dark')
