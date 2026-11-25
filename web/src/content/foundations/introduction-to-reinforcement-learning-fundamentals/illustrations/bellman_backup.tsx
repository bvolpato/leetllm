import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
import { solve } from './_parts/gridworld'
import { bellmanFilm } from './_parts/bellman-film'

export const width = 840
export const height = 395
export const alt =
    'Four synchronous Bellman sweeps propagate the +20 goal reward backward along the deterministic shortcut. State cells are shaded smoothly by value from 11.87 at Start (1,0) up to 20.00 at (1,3), with large backward arrows showing V(s) = -1 + 0.90 V(s\') across Sweep 1 through Sweep 4. Terminal continuation is zero.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    const { sweeps } = solve(0, 4)

    // Header + Bellman backup equation
    fig.text(24, 24, 'Bellman backup propagates value backward from goal', {
        size: 15,
        weight: 700,
    })
    fig.math(816, 24, 'V(s) = r + \\gamma\\,V(s\') = -1 + 0.90\\,V(s\')', {
        size: 14,
        color: warm,
        align: 'right',
    })

    // Four state cells with smooth value gradient shading + large crisp <- arrows
    const cellW = 148
    const cellH = 122
    const gap = 58
    const startX = 24
    const cellY = 82

    const values = [0, 1, 2, 3].map((i) => sweeps[4 - i]![4 + i]!)
    const vMin = 10
    const vMax = 21

    for (let i = 0; i < 4; i++) {
        const x = startX + i * (cellW + gap)
        const val = values[i]!
        const t = Math.max(0, Math.min(1, (val - vMin) / (vMax - vMin)))
        const fillAmount = isLight ? 0.08 + t * 0.24 : 0.12 + t * 0.3
        const accent = i === 0 ? blue : green
        const cellFill = tint(accent, c.bg, fillAmount)

        // State cell tinted smoothly by value
        fig.rect(x, cellY, cellW, cellH, {
            fill: cellFill,
            stroke: accent,
            strokeWidth: i === 0 ? 2.2 : 1.7,
            radius: 10,
        })

        // Coordinate label
        fig.text(x + cellW / 2, cellY + 24, i === 0 ? 'Start (1,0)' : `State (1,${i})`, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
            align: 'center',
        })

        // Value readout
        fig.text(x + cellW / 2, cellY + 64, val.toFixed(2), {
            size: 28,
            weight: 700,
            color: i === 0 ? blue : c.textPrimary,
            align: 'center',
            mono: true,
        })

        // Sweep tag inside bottom of cell
        fig.text(x + cellW / 2, cellY + 102, `Sweep ${4 - i}`, {
            size: 12,
            weight: 600,
            color: accent,
            align: 'center',
        })

        // Large bold backward arrow between cells (right-to-left)
        if (i < 3) {
            const arrowRight = x + cellW + gap - 6
            const arrowLeft = x + cellW + 6
            const arrowY = cellY + cellH / 2
            fig.arrow(arrowRight, arrowY, arrowLeft, arrowY, {
                color: warm,
                width: 3.5,
                head: 11,
            })
            fig.text((arrowLeft + arrowRight) / 2, arrowY - 22, '×0.9 − 1', {
                size: 11,
                weight: 700,
                color: warm,
                align: 'center',
                mono: true,
            })
        }
    }

    // Subtle Goal +20 entry tag on top-right pointing into (1,3)
    const lastCellX = startX + 3 * (cellW + gap)
    fig.text(lastCellX + cellW / 2, 62, 'Goal entry +20 (terminal V = 0)', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Clean aligned recurrence chain below the cells
    fig.line(24, 232, 816, 232, { color: c.borderSubtle, width: 1 })
    const eqs = [
        { sweep: 'Sweep 1', state: '(1,3)', expr: '20.00 = +20 + 0.90 × 0.00', tone: green },
        { sweep: 'Sweep 2', state: '(1,2)', expr: '17.00 =  −1 + 0.90 × 20.00', tone: green },
        { sweep: 'Sweep 3', state: '(1,1)', expr: '14.30 =  −1 + 0.90 × 17.00', tone: green },
        { sweep: 'Sweep 4', state: '(1,0)', expr: '11.87 =  −1 + 0.90 × 14.30', tone: blue },
    ]
    eqs.forEach((row, idx) => {
        const y = 258 + idx * 32
        fig.text(138, y, row.sweep, {
            size: 13,
            weight: 700,
            color: row.tone,
            align: 'right',
        })
        fig.text(162, y, row.state, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
            mono: true,
        })
        fig.text(236, y, row.expr, {
            size: 14,
            weight: idx === 3 ? 700 : 500,
            color: idx === 3 ? blue : c.textPrimary,
            mono: true,
        })
    })

    // Small value color-scale bar on bottom right
    const legX = 592
    const legW = 216
    const legY = 282
    fig.text(legX, legY - 22, 'State value gradient', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
    })
    const steps = 16
    for (let s = 0; s < steps; s++) {
        const frac = s / (steps - 1)
        const fillAmount = isLight ? 0.08 + frac * 0.24 : 0.12 + frac * 0.3
        fig.rect(legX + (s * legW) / steps, legY, legW / steps + 1, 14, {
            fill: tint(green, c.bg, fillAmount),
        })
    }
    fig.rect(legX, legY, legW, 14, { stroke: c.borderSubtle, strokeWidth: 1, radius: 3 })
    fig.text(legX, legY + 28, '11.87', { size: 12, color: blue, weight: 700, mono: true })
    fig.text(legX + legW, legY + 28, '20.00', {
        size: 12,
        color: green,
        weight: 700,
        align: 'right',
        mono: true,
    })
    fig.text(legX, legY + 62, 'Each hop discounts by γ = 0.90', {
        size: 12,
        color: c.textSecondary,
    })

    return fig.render()
}

export const createFilm = (theme: ThemeMode) => bellmanFilm(theme)
export default create()
