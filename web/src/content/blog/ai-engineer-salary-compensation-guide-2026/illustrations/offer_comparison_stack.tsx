import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 380
export const alt =
    'Annual offer stacks share a 350 thousand dollar scale. Offer A totals 311,250 dollars in years 1 and 2, 321,250 in year 3, and 331,250 in year 4 as 10,000 and then 20,000 dollars of purple refreshers vest. Offer B shows 209,000 dollars of target cash plus 95,000 of hatched illiquid private option value each year.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const cyan = f.tone('cyan')
    const green = f.tone('green')
    const purple = f.tone('purple')
    const warm = f.tone('warm')

    const colors = [blue, cyan, green, purple, warm] as const
    const legendItems = [
        { label: 'Base pay', color: blue, hatched: false },
        { label: 'Bonus', color: cyan, hatched: false },
        { label: 'Initial RSUs', color: green, hatched: false },
        { label: 'Refresher', color: purple, hatched: false },
        { label: 'Illiquid options', color: warm, hatched: true },
    ] as const

    // Compact single-row legend at top
    const legendX = [18, 148, 254, 398, 536]
    legendItems.forEach((item, i) => {
        const lx = legendX[i]!
        if (item.hatched) {
            f.rect(lx, 17, 18, 14, {
                fill: tint(item.color, c.bg, 0.22),
                stroke: item.color,
                strokeWidth: 1.4,
                radius: 3,
            })
            f.line(lx + 3, 30, lx + 12, 18, { color: item.color, width: 1.4 })
            f.line(lx + 9, 30, lx + 17, 20, { color: item.color, width: 1.4 })
        } else {
            f.rect(lx, 17, 18, 14, {
                fill: i === 3 ? item.color : tint(item.color, c.bg, 0.78),
                stroke: item.color,
                strokeWidth: 1.2,
                radius: 3,
            })
        }
        f.text(lx + 25, 24, item.label, {
            size: 14,
            weight: i >= 3 ? 600 : 500,
            color: i >= 3 ? item.color : c.textSecondary,
        })
    })

    const barLeft = 148
    const barW = 550
    const maxVal = 350
    const px = (v: number) => barLeft + (barW * v) / maxVal

    // Vertical gridlines across the bar area
    const gridTop = 58
    const gridBot = 336
    for (const tick of [0, 100, 200, 300, 350]) {
        const x = px(tick)
        f.line(x, gridTop, x, gridBot, {
            color: c.borderSubtle,
            width: 1,
            dash: tick === 0 ? undefined : '3 4',
            opacity: tick === 0 ? 0.9 : 0.7,
        })
        f.text(x, 354, tick === 0 ? '$0' : `$${tick}k`, {
            size: 13.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    const rows = [
        { title: 'Offer A · Yr 1-2', values: [175, 26.25, 110, 0, 0], total: '$311.25k', y: 92 },
        { title: 'Offer A · Yr 3', values: [175, 26.25, 110, 10, 0], total: '$321.25k', y: 156 },
        { title: 'Offer A · Yr 4', values: [175, 26.25, 110, 20, 0], total: '$331.25k', y: 220 },
        { title: 'Offer B · /year', values: [190, 19, 0, 0, 95], total: '$304k', y: 298 },
    ] as const

    // Hairline separator between Offer A and Offer B
    f.line(18, 260, width - 18, 260, { color: c.borderSubtle, width: 1.25, dash: '4 4' })

    const barH = 34

    rows.forEach((row) => {
        f.text(barLeft - 14, row.y, row.title, {
            size: 15,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
        })

        // Faint full-scale track
        f.rect(barLeft, row.y - barH / 2, barW, barH, {
            fill: tint(c.textMuted, c.bg, 0.06),
            radius: 4,
        })

        let cursor = 0
        row.values.forEach((v, j) => {
            if (!v) return
            const x0 = px(cursor)
            const x1 = px(cursor + v)
            const segW = x1 - x0
            const y0 = row.y - barH / 2

            if (j === 4) {
                // Offer B illiquid options: tinted fill + diagonal hatching + dashed border
                f.rect(x0 + 1, y0, segW - 1, barH, {
                    fill: tint(warm, c.bg, 0.2),
                    radius: 3,
                })
                const step = 11
                for (let d = -barH; d < segW + barH; d += step) {
                    const lx1 = Math.max(x0 + 2, x0 + d)
                    const ly1 = y0 + barH - Math.max(0, x0 + 2 - (x0 + d))
                    const lx2 = Math.min(x1 - 2, x0 + d + barH)
                    const ly2 = y0 + Math.max(0, x0 + d + barH - (x1 - 2))
                    if (lx2 > lx1 && ly1 > ly2) {
                        f.line(lx1, ly1, lx2, ly2, {
                            color: warm,
                            width: 1.35,
                            opacity: 0.6,
                        })
                    }
                }
                f.path(
                    `M${x0 + 1} ${y0} H${x1} V${y0 + barH} H${x0 + 1} Z`,
                    { color: warm, width: 1.6, dash: '4 3' },
                )
                const tagW = 94
                f.rect((x0 + x1) / 2 - tagW / 2, row.y - 10, tagW, 20, {
                    fill: c.bg,
                    radius: 4,
                    opacity: 0.92,
                })
                f.text((x0 + x1) / 2, row.y, '$95k options', {
                    size: 12.5,
                    weight: 700,
                    color: warm,
                    align: 'center',
                })
            } else if (j === 3) {
                // High-contrast purple refresher slice with crisp outline
                f.rect(x0 + 1, y0 - 1, Math.max(segW - 1, 6), barH + 2, {
                    fill: purple,
                    stroke: c.bg,
                    strokeWidth: 1.25,
                    radius: 3,
                })
                // Crisp callout label directly above the slice
                f.text((x0 + x1) / 2, y0 - 14, `+$${v}k`, {
                    size: 13,
                    weight: 700,
                    color: purple,
                    align: 'center',
                    mono: true,
                })
            } else {
                f.rect(x0 + (cursor > 0 ? 1 : 0), y0, segW - (cursor > 0 ? 1 : 0), barH, {
                    fill: tint(colors[j]!, c.bg, 0.78),
                    stroke: colors[j],
                    strokeWidth: 1,
                    radius: 2,
                })
            }

            cursor += v
        })

        f.text(px(cursor) + 12, row.y, row.total, {
            size: 15.5,
            weight: 700,
            color: c.textPrimary,
            mono: true,
        })
    })

    return f.render()
}

export default create('dark')
