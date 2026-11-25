import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 380
export const alt =
    'Bar chart of agent promotion suite outcomes: 68% clean pass, 14% retry loop, 11% argument error, and 7% safety/policy violations that trigger an automatic release block despite the 68% pass rate.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const red = fig.tone('red')

    const area = { x: 86, y: 42, width: 630, height: 274 }
    const plot = fig.plot(area, { x: [0, 4], y: [0, 80] })

    // Clean round y-axis ticks 0, 20, 40, 60, 80%
    for (const tk of [0, 20, 40, 60, 80]) {
        const y = plot.py(tk)
        fig.line(area.x, y, plot.right, y, {
            color: tk === 0 ? c.textMuted : c.borderSubtle,
            width: tk === 0 ? 1.25 : 1,
            dash: tk === 0 ? undefined : '3 4',
        })
        fig.text(area.x - 10, y, `${tk}%`, {
            size: 13,
            mono: true,
            color: c.textSecondary,
            align: 'right',
        })
    }
    fig.line(area.x, area.y, area.x, plot.bottom, { color: c.textMuted, width: 1.2 })
    fig.text(area.x, area.y - 16, 'Suite Share (%)', { size: 13.5, color: c.textSecondary })

    const bars = [
        { label: 'Clean Pass', value: 68, color: green },
        { label: 'Retry Loop', value: 14, color: warm },
        { label: 'Arg Error', value: 11, color: blue },
        { label: 'Policy Block', value: 7, color: red },
    ]
    const slotW = area.width / bars.length
    const barW = 78

    bars.forEach((b, i) => {
        const cx = area.x + i * slotW + slotW / 2
        const topY = plot.py(b.value)
        const h = plot.bottom - topY
        fig.rect(cx - barW / 2, topY, barW, h, { fill: b.color, radius: 6 })
        fig.text(cx, topY - 14, `${b.value}%`, {
            size: 15,
            mono: true,
            weight: 700,
            color: b.color,
            align: 'center',
        })
        fig.text(cx, plot.bottom + 20, b.label, {
            size: 14,
            weight: i === 3 ? 700 : 600,
            color: i === 3 ? red : c.textPrimary,
            align: 'center',
        })
    })

    // Crisp callout pointing to the 7% release blocker
    const blockerX = area.x + 3.5 * slotW
    fig.callout([blockerX, plot.py(7) - 24], [blockerX - 108, plot.py(42)], 'Any > 0% blocks release', {
        color: red,
        labelColor: red,
        size: 13.5,
        weight: 700,
        align: 'center',
        bend: -0.2,
    })

    return fig.render()
}

export default create('dark')
