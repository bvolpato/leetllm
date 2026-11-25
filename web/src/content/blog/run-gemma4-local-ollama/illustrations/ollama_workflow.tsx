import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 340
export const alt =
    'Unified-memory budget on a 0 to 20 GiB scale with a 16 GiB capacity line. One request uses 4 GiB OS and apps, 7 GiB weights, 1 GiB runtime, and 4 GiB KV cache (16 GiB total, no safety margin). Two independent requests double KV cache to 8 GiB, pushing total demand to 20 GiB (4 GiB over capacity).'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const purple = f.tone('purple')
    const blue = f.tone('blue')
    const green = f.tone('green')
    const warm = f.tone('warm')
    const red = f.tone('critical')

    // Compact top legend (single row, zero outer border, zero footer disclaimer)
    const legend = [
        { label: 'OS + apps', color: c.textSecondary, x: 18 },
        { label: 'Weights', color: purple, x: 142 },
        { label: 'Runtime', color: blue, x: 256 },
        { label: 'KV cache (fits)', color: green, x: 372 },
        { label: 'KV cache (overflow)', color: red, x: 526 },
    ] as const
    legend.forEach((item) => {
        f.rect(item.x, 18, 16, 14, {
            fill: tint(item.color, c.bg, 0.72),
            stroke: item.color,
            strokeWidth: 1.2,
            radius: 3,
        })
        f.text(item.x + 22, 25, item.label, {
            size: 13.5,
            weight: 600,
            color: item.color,
        })
    })

    const barLeft = 18
    const barW = 736
    const maxGib = 20
    const px = (v: number) => barLeft + (barW * v) / maxGib

    // 16 GiB capacity line
    const capX = px(16)
    f.line(capX, 58, capX, 294, {
        color: warm,
        width: 2,
        dash: '5 4',
    })
    f.rect(capX - 66, 48, 132, 24, {
        fill: tint(warm, c.bg, 0.2),
        stroke: warm,
        strokeWidth: 1.25,
        radius: 12,
    })
    f.text(capX, 60, '16 GiB capacity', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
    })

    const rows = [
        {
            title: '1 request · 16 GiB total',
            status: '0 GiB margin',
            statusColor: warm,
            y: 118,
            segs: [
                { val: 4, label: '4 GiB', color: c.textMuted },
                { val: 7, label: '7 GiB', color: purple },
                { val: 1, label: '1', color: blue },
                { val: 4, label: '4 GiB KV', color: green },
            ],
        },
        {
            title: '2 independent requests · 20 GiB total',
            status: '+4 GiB over',
            statusColor: red,
            y: 230,
            segs: [
                { val: 4, label: '4 GiB', color: c.textMuted },
                { val: 7, label: '7 GiB', color: purple },
                { val: 1, label: '1', color: blue },
                { val: 4, label: '4 GiB KV', color: green },
                { val: 4, label: '+4 GiB KV', color: red },
            ],
        },
    ] as const

    const barH = 44

    rows.forEach((row) => {
        f.text(barLeft, row.y - 20, row.title, {
            size: 16,
            weight: 700,
            color: c.textPrimary,
        })
        f.text(barLeft + barW, row.y - 20, row.status, {
            size: 14.5,
            weight: 700,
            color: row.statusColor,
            align: 'right',
        })

        // Full 20 GiB background rail
        f.rect(barLeft, row.y, barW, barH, {
            fill: tint(c.textMuted, c.bg, 0.06),
            radius: 6,
        })

        let cursor = 0
        row.segs.forEach((seg, idx) => {
            const x0 = px(cursor)
            const x1 = px(cursor + seg.val)
            const segW = x1 - x0
            f.rect(x0 + (idx > 0 ? 1.5 : 0), row.y, segW - (idx > 0 ? 1.5 : 0), barH, {
                fill: tint(seg.color, c.bg, idx === 0 ? 0.38 : 0.62),
                stroke: seg.color,
                strokeWidth: 1.3,
                radius: 4,
            })
            f.text((x0 + x1) / 2, row.y + barH / 2, seg.label, {
                size: seg.val <= 1 ? 13 : 14.5,
                weight: 700,
                color: c.textPrimary,
                align: 'center',
                mono: true,
                width: segW - 4,
            })
            cursor += seg.val
        })
    })

    // Bottom axis ticks (0..20 GiB)
    for (const tick of [0, 4, 8, 12, 16, 20]) {
        const x = px(tick)
        f.line(x, 294, x, 300, { color: c.textMuted, width: 1.2 })
        f.text(x, 316, `${tick} GiB`, {
            size: 13.5,
            weight: tick === 16 ? 700 : 400,
            color: tick === 16 ? warm : c.textSecondary,
            align: tick === 0 ? 'left' : tick === 20 ? 'right' : 'center',
            mono: true,
        })
    }

    return f.render()
}

export default create('dark')
