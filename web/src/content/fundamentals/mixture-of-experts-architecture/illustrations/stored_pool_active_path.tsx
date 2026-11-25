import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 310
export const alt =
    'Aligned BF16 memory comparison against a 14 GB GPU VRAM cap: the stored resident pool totals 38 GB (6 GB shared + 8 GB for 2 active experts + 24 GB for 6 idle experts), exceeding the 14 GB cap by 24 GB even though each token computes with only 14 GB of active weights (7B of 19B parameters).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    const fill = (col: string, strong = false) =>
        tint(col, c.bg, isLight ? (strong ? 0.22 : 0.1) : strong ? 0.36 : 0.18)

    const barX = 160
    const barW = 552
    const maxGB = 40
    const px = (gb: number) => barX + (gb / maxGB) * barW

    // Top compact legend
    const legY = 20
    const leg = [
        { x: 112, label: 'Shared (6 GB)', col: purple },
        { x: 266, label: '2 active (8 GB)', col: blue },
        { x: 434, label: '6 idle resident (24 GB)', col: warm },
    ]
    for (const item of leg) {
        fig.rect(item.x, legY - 7, 14, 14, {
            fill: fill(item.col, true),
            stroke: item.col,
            strokeWidth: 1.4,
            radius: 3,
        })
        fig.text(item.x + 21, legY, item.label, { size: 14, weight: 600, color: item.col })
    }

    // Scale gridlines & ticks (0 .. 40 GB)
    const gridTop = 68
    const gridBot = 228
    for (const gb of [0, 14, 20, 30, 38, 40]) {
        const x = px(gb)
        const isCap = gb === 14
        fig.line(x, gridTop, x, gridBot, {
            color: isCap ? red : c.borderSubtle,
            width: isCap ? 1.8 : 1,
            dash: isCap ? '5 4' : undefined,
        })
        if (gb !== 38) {
            fig.text(x, gridTop - 15, isCap ? '14 GB cap' : `${gb}`, {
                size: 14,
                weight: isCap ? 700 : 500,
                color: isCap ? red : c.textSecondary,
                align: 'center',
                mono: true,
            })
        }
    }

    const barH = 44

    // Row 1: Stored resident pool (38 GB)
    const y1 = 86
    fig.text(barX - 14, y1 + 12, 'Stored pool', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
    })
    fig.text(barX - 14, y1 + 33, '19B · 38 GB', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    fig.rect(barX, y1, px(6) - barX, barH, {
        fill: fill(purple, true),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text((barX + px(6)) / 2, y1 + barH / 2, '6 GB', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })

    fig.rect(px(6) + 2, y1, px(14) - px(6) - 4, barH, {
        fill: fill(blue, true),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text((px(6) + px(14)) / 2, y1 + barH / 2, '8 GB', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    fig.rect(px(14) + 2, y1, px(38) - px(14) - 2, barH, {
        fill: fill(warm, true),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text((px(14) + px(38)) / 2, y1 + barH / 2, '24 GB idle experts (in VRAM)', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Row 2: Active compute per token (14 GB)
    const y2 = 162
    fig.text(barX - 14, y2 + 12, 'Active compute', {
        size: 15,
        weight: 700,
        color: blue,
        align: 'right',
    })
    fig.text(barX - 14, y2 + 33, '7B · 14 GB/tok', {
        size: 14,
        color: blue,
        align: 'right',
        mono: true,
    })

    fig.rect(barX, y2, px(6) - barX, barH, {
        fill: fill(purple, true),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text((barX + px(6)) / 2, y2 + barH / 2, '6 GB', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })

    fig.rect(px(6) + 2, y2, px(14) - px(6) - 4, barH, {
        fill: fill(blue, true),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text((px(6) + px(14)) / 2, y2 + barH / 2, '8 GB', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    // Dashed shortfall zone on Row 2 showing why 14 GB VRAM still OOMs
    fig.rect(px(14) + 2, y2, px(38) - px(14) - 2, barH, {
        fill: tint(red, c.bg, isLight ? 0.08 : 0.14),
        stroke: red,
        strokeWidth: 1.25,
        radius: 5,
    })
    fig.text((px(14) + px(38)) / 2, y2 + barH / 2, '24 GB shortfall on 14 GB GPU', {
        size: 14,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Curly brace spanning 14..38 GB
    fig.brace(px(14) + 2, gridBot + 10, px(38), gridBot + 10, 'Sparse compute ≠ sparse VRAM residency', {
        side: 1,
        depth: 10,
        color: red,
        labelColor: red,
        labelSize: 14.5,
        labelGap: 16,
    })

    return fig.render()
}

export default create('dark')
