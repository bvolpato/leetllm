import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 380
export const alt =
    'Horizontal stacked bar chart for four distinct shown suggestion IDs on a 0 to 45 character scale. ID A inserts 18 characters and retains 0 (all 18 deleted). ID B inserts and retains 4. ID C inserts 42, retaining 35 and deleting 7. ID D is dismissed with 0 inserted. Beside it, summary meters show 3 of 4 distinct IDs accepted (75.0%) versus 39 of 64 inserted characters retained (60.9%).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')

    // Left: Calibrated horizontal stacked bars (0..45 chars)
    fig.text(28, 22, 'Shown Cohort (Inserted vs Retained after 60 s)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot({ x: 112, y: 54, width: 404, height: 242 }, { x: [0, 45], y: [0, 4] })

    // Vertical grid & x-axis ticks
    for (const tick of [0, 10, 20, 30, 40]) {
        const tx = plot.px(tick)
        fig.line(tx, 54, tx, 296, { color: c.borderSubtle, width: 1 })
        fig.line(tx, 296, tx, 301, { color: c.textMuted, width: 1 })
        fig.text(tx, 315, String(tick), {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(plot.px(0), 296, plot.px(45), 296, { color: c.textMuted, width: 1 })
    fig.text(plot.px(22.5), 338, 'Characters inserted', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    const rows = [
        { id: 'ID A', ins: 18, kept: 0, del: 18, note: '0 kept · 18 deleted' },
        { id: 'ID B', ins: 4, kept: 4, del: 0, note: '4 kept' },
        { id: 'ID C', ins: 42, kept: 35, del: 7, note: '35 kept · 7 del' },
        { id: 'ID D', ins: 0, kept: 0, del: 0, note: 'Dismissed (0 ins)' },
    ]

    rows.forEach((r, i) => {
        const y = 70 + i * 56
        const h = 32
        fig.text(102, y + 10, r.id, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
            align: 'right',
        })
        fig.text(102, y + 27, `${r.ins} ch`, {
            size: 12,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })

        if (r.ins === 0) {
            fig.rect(plot.px(0), y + 4, 6, h - 8, { fill: c.border, radius: 2 })
            fig.text(plot.px(0) + 16, y + 16, r.note, {
                size: 13,
                color: c.textMuted,
                weight: 500,
            })
            return
        }

        const keptW = plot.px(r.kept) - plot.px(0)
        const delW = plot.px(r.ins) - plot.px(r.kept)

        if (r.kept > 0) {
            fig.rect(plot.px(0), y, keptW, h, {
                fill: green,
                opacity: 0.88,
                radius: 4,
            })
            if (keptW >= 62) {
                fig.text(plot.px(0) + keptW / 2, y + h / 2, `${r.kept} kept`, {
                    size: 12,
                    weight: 700,
                    color: c.bg,
                    align: 'center',
                    mono: true,
                })
            }
        }
        if (r.del > 0) {
            fig.rect(plot.px(r.kept) + (r.kept > 0 ? 1 : 0), y, delW - (r.kept > 0 ? 1 : 0), h, {
                fill: red,
                opacity: 0.85,
                radius: 4,
            })
            if (delW >= 54) {
                fig.text(plot.px(r.kept) + delW / 2, y + h / 2, `${r.del} del`, {
                    size: 12,
                    weight: 700,
                    color: c.bg,
                    align: 'center',
                    mono: true,
                })
            }
        }

        // Right-side inline annotation for narrow bars (B, or A emphasis)
        if (r.id === 'ID A') {
            fig.text(plot.px(r.ins) + 10, y + h / 2, 'accepted, then erased', {
                size: 12,
                weight: 600,
                color: red,
            })
        } else if (r.id === 'ID B') {
            fig.text(plot.px(r.ins) + 10, y + h / 2, '4 kept (100%)', {
                size: 12,
                weight: 600,
                color: green,
                mono: true,
            })
        }
    })

    // Legend below x-axis
    fig.rect(112, 358, 12, 12, { fill: green, radius: 3 })
    fig.text(130, 364, 'Retained characters', { size: 12, color: c.textSecondary })
    fig.rect(284, 358, 12, 12, { fill: red, radius: 3 })
    fig.text(302, 364, 'Deleted within 60 s', { size: 12, color: c.textSecondary })

    // Vertical divider
    fig.line(544, 18, 544, 366, { color: c.borderSubtle, width: 1.25 })

    // Right: Two KPI meters (frameless with clean progress tracks)
    fig.text(572, 22, 'Cohort Summary', { size: 15, weight: 700, color: c.textPrimary })

    const meterW = 236
    // Meter 1: Acceptance rate 3 / 4 = 75.0%
    fig.text(572, 68, 'Acceptance rate (by ID)', { size: 13, weight: 600, color: c.textSecondary })
    fig.text(572, 94, '75.0%', { size: 24, weight: 700, color: blue, mono: true })
    fig.text(668, 96, '3 / 4 IDs', { size: 14, weight: 600, color: c.textPrimary, mono: true })
    fig.rect(572, 114, meterW, 14, { fill: tint(blue, c.bg, 0.14), radius: 7 })
    fig.rect(572, 114, meterW * 0.75, 14, { fill: blue, radius: 7 })
    fig.text(572, 142, 'Partial accepts count as 1 ID', { size: 12, color: c.textMuted })

    // Meter 2: Character retention 39 / 64 = 60.9%
    fig.text(572, 194, 'Character retention (60 s)', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
    })
    fig.text(572, 220, '60.9%', { size: 24, weight: 700, color: green, mono: true })
    fig.text(668, 222, '39 / 64 ch', { size: 14, weight: 600, color: c.textPrimary, mono: true })
    fig.rect(572, 240, meterW, 14, { fill: tint(green, c.bg, 0.14), radius: 7 })
    fig.rect(572, 240, meterW * (39 / 64), 14, { fill: green, radius: 7 })
    fig.text(572, 268, 'Exposes ID A (18 ch deleted)', { size: 12, color: red, weight: 600 })

    // Bottom note
    fig.line(572, 304, 808, 304, { color: c.borderSubtle, width: 1 })
    fig.text(572, 326, 'Early-closed tabs treated as', { size: 12, color: c.textMuted })
    fig.text(572, 344, 'right-censored observations', { size: 12, color: c.textMuted })

    return fig.render()
}

export default create('dark')
