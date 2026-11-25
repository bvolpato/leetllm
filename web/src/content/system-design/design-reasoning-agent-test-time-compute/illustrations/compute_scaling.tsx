import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 395
export const alt =
    'A 4,000-token shared budget holds two 1,500-token reservations. After call A finishes using 900 tokens, call C reserves 1,500 and 100 tokens remain free.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const critical = fig.tone('critical')
    const muted = c.textSecondary

    const barX = 24
    const barW = 520 // 4,000 tokens -> 0.13 px/token
    const total = 4000
    const sx = (tok: number) => barX + (tok / total) * barW
    const sw = (tok: number) => (tok / total) * barW

    const cardX = 574
    const cardW = 242

    // Vertical gridlines across both phase bars (0, 1k, 2k, 3k, 4k)
    for (const t of [0, 1000, 2000, 3000, 4000]) {
        fig.line(sx(t), 46, sx(t), 334, {
            color: c.borderSubtle,
            width: 1,
            dash: t === 0 || t === 4000 ? undefined : '3 4',
        })
    }

    // --- Phase 1: Concurrent Reservation ---
    fig.text(barX, 24, 'Phase 1 · Concurrent Reservation (3,000 / 4,000 reserved)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const y1 = 56
    const barH = 48

    // Call A: 1,500 reserved
    fig.rect(sx(0), y1, sw(1500) - 2, barH, {
        fill: tint(blue, c.bg, 0.22),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(sx(750), y1 + 16, 'Call A', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        width: sw(1500) - 10,
    })
    fig.text(sx(750), y1 + 35, '1,500 reserved', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: sw(1500) - 10,
    })

    // Call B: 1,500 reserved
    fig.rect(sx(1500) + 2, y1, sw(1500) - 4, barH, {
        fill: tint(purple, c.bg, 0.22),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(sx(2250), y1 + 16, 'Call B', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        width: sw(1500) - 10,
    })
    fig.text(sx(2250), y1 + 35, '1,500 reserved', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: sw(1500) - 10,
    })

    // Free headroom: 1,000
    fig.rect(sx(3000) + 2, y1, sw(1000) - 2, barH, {
        fill: tint(c.textMuted, c.bg, 0.05),
        stroke: c.border,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(sx(3500), y1 + 24, '1,000 free', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'center',
        mono: true,
        width: sw(1000) - 8,
    })

    // Phase 1 Admission Outcome
    fig.rect(cardX, 34, cardW, 92, {
        fill: tint(critical, c.bg, 0.09),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(cardX + 14, 54, 'Call C (needs 1,500)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(cardX + 14, 78, 'Headroom: 1,000 < 1,500', {
        size: 12,
        color: muted,
        mono: true,
    })
    fig.text(cardX + 14, 104, 'BLOCKED · Waits in queue', {
        size: 13,
        weight: 700,
        color: critical,
    })

    // --- Transition Event ---
    fig.arrow(sx(900), 124, sx(900), 184, { color: green, width: 2.25, head: 6 })
    fig.text(sx(900) + 14, 146, 'Call A finishes using 900 tokens', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.text(sx(900) + 14, 168, 'Releases 600 unused tokens -> headroom rises to 1,600', {
        size: 13,
        color: c.textSecondary,
    })

    // --- Phase 2: Settlement & Call C Admission ---
    fig.text(barX, 208, 'Phase 2 · Settlement & Admission (3,900 / 4,000)', {
        size: 14,
        weight: 700,
        color: green,
    })

    const y2 = 240

    // A: 900 spent
    fig.rect(sx(0), y2, sw(900) - 2, barH, {
        fill: tint(green, c.bg, 0.24),
        stroke: green,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(sx(450), y2 + 16, 'A: 900', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
        width: sw(900) - 8,
    })
    fig.text(sx(450), y2 + 35, 'spent', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        width: sw(900) - 8,
    })

    // B: 1,500 reserved
    fig.rect(sx(900) + 2, y2, sw(1500) - 4, barH, {
        fill: tint(purple, c.bg, 0.22),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(sx(1650), y2 + 16, 'Call B', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        width: sw(1500) - 10,
    })
    fig.text(sx(1650), y2 + 35, '1,500 reserved', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: sw(1500) - 10,
    })

    // C: 1,500 admitted
    fig.rect(sx(2400) + 2, y2, sw(1500) - 4, barH, {
        fill: tint(blue, c.bg, 0.22),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(sx(3150), y2 + 16, 'Call C', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        width: sw(1500) - 10,
    })
    fig.text(sx(3150), y2 + 35, '1,500 reserved', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: sw(1500) - 10,
    })

    // 100 free sliver + clean callout above so zero overlap
    fig.rect(sx(3900) + 2, y2, sw(100) - 2, barH, {
        fill: tint(c.textMuted, c.bg, 0.14),
        stroke: c.textMuted,
        strokeWidth: 1.25,
        radius: 3,
    })
    fig.callout([sx(3950), y2 + 4], [sx(3950) - 34, y2 - 22], '100 free', {
        color: muted,
        labelColor: c.textPrimary,
        size: 12,
        weight: 700,
        mono: true,
        align: 'right',
        bend: -0.25,
        head: 5,
    })

    // Phase 2 Admission Outcome
    fig.rect(cardX, 218, cardW, 92, {
        fill: tint(green, c.bg, 0.09),
        stroke: green,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(cardX + 14, 238, 'Call C (1,500 reserved)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(cardX + 14, 262, 'Headroom: 1,600 >= 1,500', {
        size: 12,
        color: muted,
        mono: true,
    })
    fig.text(cardX + 14, 288, 'ADMITTED · 100 free left', {
        size: 13,
        weight: 700,
        color: green,
    })

    // --- Shared Calibrated Token Axis ---
    const axisY = 334
    fig.line(barX, axisY, barX + barW, axisY, { color: c.textMuted, width: 1.25 })
    for (const t of [0, 1000, 2000, 3000, 4000]) {
        fig.line(sx(t), axisY, sx(t), axisY + 5, { color: c.textMuted, width: 1.25 })
        fig.text(sx(t), axisY + 20, t === 0 ? '0' : `${t / 1000}k`, {
            size: 13,
            weight: 600,
            color: muted,
            align: 'center',
            mono: true,
            width: 44,
        })
    }
    fig.text(barX + barW / 2, axisY + 44, 'Shared request token budget (4,000-token hard cap)', {
        size: 13,
        color: muted,
        align: 'center',
        width: 440,
    })

    return fig.render()
}

export default create()
