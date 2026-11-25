import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 305
export const alt =
    'Per-rank VRAM check on TP=2 (80 GB cap per GPU): each rank starts with 35 GB weights, 16 GB reserve, and 29 GB free (58 GB combined free). An imbalanced 50 GB request placing 35 GB on Rank 0 and 15 GB on Rank 1 fits the 58 GB group sum yet overflows Rank 0 by 6 GB (86 > 80 GB) while leaving 14 GB unused on Rank 1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const neutral = c.textMuted
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('red')

    const fill = (col: string) => tint(col, c.bg, isLight ? 0.24 : 0.38)

    const barX = 118
    const barW = 472
    const maxGB = 90
    const px = (gb: number) => barX + (gb / maxGB) * barW

    // Theme-matched color swatch legend
    const legY = 20
    const leg = [
        { x: 56, label: 'Weights (35 GB)', col: purple },
        { x: 204, label: 'Reserve (16 GB)', col: neutral },
        { x: 354, label: 'Request KV', col: blue },
        { x: 478, label: 'Free', col: green },
        { x: 562, label: 'OOM overflow', col: red },
    ]
    for (const item of leg) {
        fig.rect(item.x, legY - 6, 13, 13, {
            fill: item.col === neutral ? (isLight ? '#e4e0d5' : '#252a36') : fill(item.col),
            stroke: item.col,
            strokeWidth: 1.4,
            radius: 3,
        })
        fig.text(item.x + 19, legY, item.label, { size: 12.5, weight: 600, color: item.col })
    }

    // Scale gridlines (0 .. 80 GB cap)
    const gridTop = 64
    const gridBot = 224
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

    const barH = 44

    // Rank 0: 35w + 16r + 29 fit + 6 OOM
    const y0 = 84
    fig.text(barX - 12, y0 + 14, 'Rank 0', {
        size: 14,
        weight: 700,
        color: red,
        align: 'right',
    })
    fig.text(barX - 12, y0 + 32, '+35 GB req', {
        size: 12,
        color: red,
        align: 'right',
        mono: true,
    })

    fig.rect(barX, y0, px(35) - barX, barH, { fill: fill(purple), stroke: purple, strokeWidth: 1.5, radius: 5 })
    fig.text((barX + px(35)) / 2, y0 + barH / 2, '35w', { size: 13, weight: 700, color: purple, align: 'center', mono: true })

    fig.rect(px(35) + 2, y0, px(51) - px(35) - 2, barH, {
        fill: isLight ? '#e4e0d5' : '#252a36',
        stroke: neutral,
        strokeWidth: 1.3,
        radius: 5,
    })
    fig.text((px(35) + px(51)) / 2, y0 + barH / 2, '16r', { size: 12.5, weight: 600, color: c.textSecondary, align: 'center', mono: true })

    fig.rect(px(51) + 2, y0, px(80) - px(51) - 2, barH, { fill: fill(blue), stroke: blue, strokeWidth: 1.5, radius: 5 })
    fig.text((px(51) + px(80)) / 2, y0 + barH / 2, '29 fit', { size: 13, weight: 700, color: blue, align: 'center', mono: true })

    fig.rect(px(80) + 2, y0, px(86) - px(80) - 2, barH, { fill: fill(red), stroke: red, strokeWidth: 1.6, radius: 5 })
    // Clean right-side callout completely clear of the 80 GB vertical rule!
    fig.text(px(86) + 12, y0 + barH / 2, '86 GB (+6 OOM)', {
        size: 13.5,
        weight: 700,
        color: red,
        mono: true,
    })

    // Rank 1: 35w + 16r + 15 req + 14 free
    const y1 = 156
    fig.text(barX - 12, y1 + 14, 'Rank 1', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(barX - 12, y1 + 32, '+15 GB req', {
        size: 12,
        color: green,
        align: 'right',
        mono: true,
    })

    fig.rect(barX, y1, px(35) - barX, barH, { fill: fill(purple), stroke: purple, strokeWidth: 1.5, radius: 5 })
    fig.text((barX + px(35)) / 2, y1 + barH / 2, '35w', { size: 13, weight: 700, color: purple, align: 'center', mono: true })

    fig.rect(px(35) + 2, y1, px(51) - px(35) - 2, barH, {
        fill: isLight ? '#e4e0d5' : '#252a36',
        stroke: neutral,
        strokeWidth: 1.3,
        radius: 5,
    })
    fig.text((px(35) + px(51)) / 2, y1 + barH / 2, '16r', { size: 12.5, weight: 600, color: c.textSecondary, align: 'center', mono: true })

    fig.rect(px(51) + 2, y1, px(66) - px(51) - 2, barH, { fill: fill(blue), stroke: blue, strokeWidth: 1.5, radius: 5 })
    fig.text((px(51) + px(66)) / 2, y1 + barH / 2, '15', { size: 13, weight: 700, color: blue, align: 'center', mono: true })

    fig.rect(px(66) + 2, y1, px(80) - px(66) - 2, barH, { fill: fill(green), stroke: green, strokeWidth: 1.5, radius: 5 })
    fig.text((px(66) + px(80)) / 2, y1 + barH / 2, '14', { size: 13, weight: 700, color: green, align: 'center', mono: true })

    fig.text(px(80) + 12, y1 + barH / 2, '66 GB (14 free)', {
        size: 13.5,
        weight: 700,
        color: green,
        mono: true,
    })

    // Compact bottom takeaway line (frameless)
    fig.line(24, 258, width - 24, 258, { color: c.borderSubtle, width: 1 })
    fig.text(
        width / 2,
        280,
        'Group free = 58 GB (> 50 GB request), yet Rank 0 OOMs: admission must check every rank',
        { size: 13, weight: 600, color: red, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
