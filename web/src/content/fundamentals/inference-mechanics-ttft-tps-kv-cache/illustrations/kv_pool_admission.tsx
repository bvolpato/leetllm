import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 435
export const alt =
    'A 12 GB pool limit is compared on one scale with 40 current 4,096-token reservations totaling 10.737 GB (10,737,418,240 bytes). Adding 16,384 tokens reaches 11.811 GB and fits; adding 65,536 reaches 15.032 GB and exceeds the pool. Separately, 17 logical positions round to two 16-token pages: 32 allocated, with a 15-token unused tail.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    const currentGb = (40 * 4096 * 65_536) / 1e9 // 10.7374
    const req16Gb = (16_384 * 65_536) / 1e9 // 1.0737
    const req64Gb = (65_536 * 65_536) / 1e9 // 4.2950
    const limitGb = 12
    const maxGb = 16

    const barX = 148
    const barW = 540
    const toW = (gb: number) => (gb / maxGb) * barW
    const limitX = barX + toW(limitGb)

    // === Top: Pool Admission Scale (0..16 GB) ===
    fig.text(24, 22, 'KV pool admission follows reserved bytes (12 GB cap)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Top axis ticks (stop cleanly below 3rd bar so bottom label is unobstructed)
    const tickY = 48
    for (const gb of [0, 4, 8, 12, 16]) {
        const tx = barX + toW(gb)
        fig.line(tx, tickY + 12, tx, 204, {
            color: gb === 12 ? red : c.borderSubtle,
            width: gb === 12 ? 1.8 : 1,
            dash: gb === 12 ? '5 3' : undefined,
        })
        fig.text(tx, tickY, gb === 12 ? '12 GB cap' : `${gb}`, {
            size: 14.5,
            weight: gb === 12 ? 700 : 500,
            color: gb === 12 ? red : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    const curW = toW(currentGb)
    const rows = [
        {
            y: 70,
            label: 'Active (40×4K)',
            extra: 0,
            totalText: '10.74 GB',
            tone: blue,
        },
        {
            y: 120,
            label: '+16K request',
            extra: req16Gb,
            totalText: '11.81 GB · fits',
            tone: green,
        },
        {
            y: 170,
            label: '+64K request',
            extra: req64Gb,
            totalText: '15.03 GB (+3.03 over)',
            tone: red,
        },
    ]

    for (const r of rows) {
        fig.text(24, r.y + 15, r.label, {
            size: 14.5,
            weight: 700,
            color: r.tone,
        })
        // Base active bar
        fig.rect(barX, r.y, curW, 30, {
            fill: tint(blue, c.bg, isLight ? 0.2 : 0.34),
            stroke: blue,
            strokeWidth: 1.5,
            radius: 5,
        })
        if (r.extra > 0) {
            const within = Math.min(r.extra, Math.max(0, limitGb - currentGb))
            const over = Math.max(0, currentGb + r.extra - limitGb)
            if (within > 0) {
                fig.rect(barX + curW + 2, r.y, toW(within) - 2, 30, {
                    fill: tint(over > 0 ? warm : green, c.bg, isLight ? 0.24 : 0.38),
                    stroke: over > 0 ? warm : green,
                    strokeWidth: 1.5,
                    radius: 4,
                })
            }
            if (over > 0) {
                fig.rect(limitX + 2, r.y, toW(over) - 2, 30, {
                    fill: tint(red, c.bg, isLight ? 0.24 : 0.38),
                    stroke: red,
                    strokeWidth: 1.6,
                    radius: 4,
                })
            }
        }
        // Label inside base bar or to right
        if (r.extra === 0) {
            fig.text(barX + curW / 2, r.y + 15, r.totalText, {
                size: 14.5,
                weight: 700,
                color: blue,
                align: 'center',
                mono: true,
            })
        } else if (r.extra < 2) {
            fig.text(barX + curW + toW(r.extra) + 10, r.y + 15, r.totalText, {
                size: 14.5,
                weight: 700,
                color: green,
                mono: true,
            })
        } else {
            fig.text(barX + curW / 2, r.y + 15, '10.74 GB', {
                size: 14.5,
                weight: 600,
                color: blue,
                align: 'center',
                mono: true,
            })
            fig.text(barX + barW, r.y + 44, r.totalText, {
                size: 14.5,
                weight: 700,
                color: red,
                align: 'right',
                mono: true,
            })
        }
    }

    // === Bottom: Page Rounding (17 tokens -> two 16-token pages) ===
    const sepY = 250
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })
    fig.text(24, sepY + 24, 'Page rounding: 17 logical tokens -> 32 allocated slots', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const cellW = 18
    const cellGap = 3
    const p1X = 24
    const p2X = 368
    const pY = sepY + 72

    fig.text(p1X, pY - 14, 'Page 1: 16 used', { size: 14.5, weight: 700, color: blue })
    fig.text(p2X, pY - 14, 'Page 2: 1 used + 15 tail', { size: 14.5, weight: 700, color: warm })

    for (let i = 0; i < 16; i++) {
        fig.rect(p1X + i * (cellW + cellGap), pY, cellW, 28, {
            fill: tint(blue, c.bg, isLight ? 0.24 : 0.4),
            stroke: blue,
            strokeWidth: 1.2,
            radius: 3,
        })
        const used = i === 0
        fig.rect(p2X + i * (cellW + cellGap), pY, cellW, 28, {
            fill: tint(used ? green : c.textMuted, c.bg, isLight ? (used ? 0.28 : 0.09) : used ? 0.44 : 0.16),
            stroke: used ? green : c.border,
            strokeWidth: used ? 1.4 : 1,
            radius: 3,
        })
    }

    const tailStart = p2X + (cellW + cellGap)
    const tailEnd = p2X + 16 * cellW + 15 * cellGap
    fig.brace(tailStart, pY + 34, tailEnd, pY + 34, '15 unused slots (internal fragmentation)', {
        side: 1,
        depth: 8,
        color: warm,
        labelColor: warm,
        labelSize: 14.5,
        labelGap: 16,
    })

    return fig.render()
}

export default create('dark')
