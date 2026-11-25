import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 355
export const alt =
    'Four per-rank VRAM bars share a 0-to-90 GB scale with a dashed 80 GB cap. TP=1 requests 70 GB of weights plus 16 GB reserve (86 GB total), overflowing by 6 GB. TP=2 splits weights across ranks r0 and r1 (35 GB weights + 16 GB reserve), leaving 29 GB free per GPU. TP=4 shrinks weights to 17.5 GB per rank, leaving 46.5 GB free on each of the four GPUs.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const neutral = c.textMuted
    const green = fig.tone('green')
    const red = fig.tone('red')

    const fill = (col: string, strong = true) =>
        tint(col, c.bg, isLight ? (strong ? 0.24 : 0.12) : strong ? 0.38 : 0.2)

    const barX = 116
    const barW = 496
    const maxGB = 90
    const px = (gb: number) => barX + (gb / maxGB) * barW

    // Theme-matched color swatch legend (never hardcoded color names!)
    const legY = 20
    const leg = [
        { x: barX, label: 'Weights', col: purple },
        { x: barX + 108, label: '16 GB reserve', col: neutral },
        { x: barX + 252, label: 'Free KV pool', col: green },
        { x: barX + 392, label: 'OOM overflow', col: red },
    ]
    for (const item of leg) {
        fig.rect(item.x, legY - 6, 13, 13, {
            fill: fill(item.col),
            stroke: item.col,
            strokeWidth: 1.4,
            radius: 3,
        })
        fig.text(item.x + 19, legY, item.label, { size: 12.5, weight: 600, color: item.col })
    }

    // Scale gridlines & ticks
    const gridTop = 64
    const gridBot = 314
    for (const gb of [0, 20, 40, 60, 80]) {
        const x = px(gb)
        const isCap = gb === 80
        fig.line(x, gridTop, x, gridBot, {
            color: isCap ? red : c.borderSubtle,
            width: isCap ? 1.8 : 1,
            dash: isCap ? '5 4' : undefined,
        })
        fig.text(x, gridTop - 13, isCap ? '80 GB cap' : `${gb}`, {
            size: 12,
            weight: isCap ? 700 : 500,
            color: isCap ? red : c.textSecondary,
            align: 'center',
            mono: true,
        })
        fig.text(x, gridBot + 15, `${gb} GB`, {
            size: 12,
            weight: isCap ? 700 : 500,
            color: isCap ? red : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    const rows = [
        { name: 'TP=1 (1×)', w: 70, r: 10, f: 0, over: 6, badge: '86 GB (+6 OOM)', col: red },
        { name: 'TP=2 r0', w: 35, r: 16, f: 29, over: 0, badge: '29 GB free', col: green },
        { name: 'TP=2 r1', w: 35, r: 16, f: 29, over: 0, badge: '29 GB free', col: green },
        { name: 'TP=4 (×4)', w: 17.5, r: 16, f: 46.5, over: 0, badge: '46.5 GB free', col: green },
    ] as const

    const barH = 38
    rows.forEach((row, idx) => {
        const y = 80 + idx * 58
        fig.text(barX - 12, y + barH / 2, row.name, {
            size: 13.5,
            weight: 700,
            color: row.over > 0 ? red : c.textPrimary,
            align: 'right',
            mono: true,
        })

        // Weights segment
        const wEnd = px(row.w)
        fig.rect(barX, y, wEnd - barX, barH, {
            fill: fill(purple),
            stroke: purple,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text((barX + wEnd) / 2, y + barH / 2, `${row.w}w`, {
            size: 12.5,
            weight: 700,
            color: purple,
            align: 'center',
            mono: true,
        })

        // Reserve segment
        const rStart = wEnd + 2
        const rEnd = px(row.w + row.r)
        fig.rect(rStart, y, rEnd - rStart, barH, {
            fill: isLight ? '#e4e0d5' : '#252a36',
            stroke: neutral,
            strokeWidth: 1.3,
            radius: 5,
        })
        if (rEnd - rStart >= 46) {
            fig.text((rStart + rEnd) / 2, y + barH / 2, `${row.r}r`, {
                size: 12,
                weight: 600,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        }

        // Free KV segment OR OOM overflow segment
        if (row.f > 0) {
            const fStart = rEnd + 2
            const fEnd = px(80)
            fig.rect(fStart, y, fEnd - fStart, barH, {
                fill: fill(green),
                stroke: green,
                strokeWidth: 1.5,
                radius: 5,
            })
            fig.text((fStart + fEnd) / 2, y + barH / 2, `${row.f} free`, {
                size: 12.5,
                weight: 700,
                color: green,
                align: 'center',
                mono: true,
            })
        }
        if (row.over > 0) {
            const oStart = px(80) + 2
            const oEnd = px(86)
            fig.rect(oStart, y, oEnd - oStart, barH, {
                fill: fill(red),
                stroke: red,
                strokeWidth: 1.6,
                radius: 5,
            })
        }

        // Clean right-side status readout outside the bars (zero overlap!)
        const rightX = row.over > 0 ? px(86) + 12 : px(80) + 12
        fig.text(rightX, y + barH / 2, row.badge, {
            size: 13,
            weight: 700,
            color: row.col,
            mono: true,
        })
    })

    return fig.render()
}

export default create('dark')
