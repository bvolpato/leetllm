import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 370
export const alt =
    'Client confirms playout through 520 ms when barge-in occurs at 650 ms while generated audio reaches 1120 ms. History retains Incident is open and discards the unconfirmed database failover clause.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const critical = fig.tone('critical')
    const muted = c.textSecondary

    const leftX = 36
    const rightX = 804
    const maxMs = 1120
    const x = (ms: number) => leftX + (ms / maxMs) * (rightX - leftX)

    const barY = 96
    const barH = 54
    const axisY = 176

    // --- Timeline Markers Above ---
    fig.line(x(520), 46, x(520), axisY, { color: green, width: 2, dash: '5 4' })
    fig.text(x(520) - 8, 34, 'Playout ACK: 520 ms', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })

    fig.line(x(650), 64, x(650), axisY, { color: warm, width: 2, dash: '5 4' })
    fig.text(x(650) + 8, 56, 'User barge-in: 650 ms', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'left',
    })

    // --- Generated Audio Timeline Segments ---
    // Confirmed (0..520 ms)
    fig.rect(x(0), barY, x(520) - x(0), barH, {
        fill: tint(green, c.bg, 0.22),
        stroke: green,
        strokeWidth: 2,
        radius: 6,
    })
    fig.text((x(0) + x(520)) / 2, barY + 18, 'Confirmed playout (0-520 ms)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        width: x(520) - x(0) - 12,
    })
    fig.text((x(0) + x(520)) / 2, barY + 39, 'Caller heard this span', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        width: x(520) - x(0) - 12,
    })

    // Unconfirmed in-flight (520..650 ms)
    fig.rect(x(520) + 2, barY, x(650) - x(520) - 2, barH, {
        fill: tint(warm, c.bg, 0.16),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 4,
    })
    fig.text((x(520) + x(650)) / 2, barY + 27, 'In-flight', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
        width: x(650) - x(520) - 6,
    })

    // Cancelled / unplayed (650..1120 ms)
    fig.rect(x(650) + 2, barY, x(1120) - x(650) - 2, barH, {
        fill: tint(critical, c.bg, 0.13),
        stroke: critical,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text((x(650) + x(1120)) / 2, barY + 18, 'Unplayed / cancelled (650-1120 ms)', {
        size: 13,
        weight: 700,
        color: critical,
        align: 'center',
        width: x(1120) - x(650) - 12,
    })
    fig.text((x(650) + x(1120)) / 2, barY + 39, 'Buffer purged on interrupt', {
        size: 12,
        color: muted,
        align: 'center',
        width: x(1120) - x(650) - 12,
    })

    // --- Calibrated Axis ---
    fig.line(leftX, axisY, rightX, axisY, { color: c.textMuted, width: 1.25 })
    const ticks = [
        { ms: 0, label: '0 ms', color: muted, align: 'left' as const },
        { ms: 520, label: '520 ms', color: green, align: 'center' as const },
        { ms: 650, label: '650 ms', color: warm, align: 'center' as const },
        { ms: 1120, label: '1120 ms (generated)', color: muted, align: 'right' as const },
    ]
    for (const tk of ticks) {
        fig.line(x(tk.ms), axisY, x(tk.ms), axisY + 5, { color: tk.color, width: 1.25 })
        fig.text(x(tk.ms), axisY + 18, tk.label, {
            size: 12,
            weight: tk.color === muted ? 500 : 700,
            color: tk.color,
            align: tk.align,
            mono: true,
        })
    }

    // --- Aligned History Outcome Panels (Direct Drop from 520 ms Split) ---
    const outY = 224
    const outH = 124
    const splitX = x(520)

    // Left: Kept in History
    fig.rect(leftX, outY, splitX - leftX - 10, outH, {
        fill: tint(green, c.bg, 0.08),
        stroke: green,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.rect(leftX, outY, 4, outH, { fill: green, radius: 2 })
    fig.text(leftX + 18, outY + 24, 'Kept in Conversation History', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.text(leftX + 18, outY + 58, '"Incident is open"', {
        size: 17,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(leftX + 18, outY + 96, 'Confirmed played -> next LLM turn knows caller heard it', {
        size: 12,
        color: muted,
        width: splitX - leftX - 34,
    })

    // Right: Discarded from History
    const rLeft = splitX + 10
    const rW = rightX - rLeft
    fig.rect(rLeft, outY, rW, outH, {
        fill: tint(critical, c.bg, 0.07),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.rect(rLeft, outY, 4, outH, { fill: critical, radius: 2 })
    fig.text(rLeft + 18, outY + 24, 'Discarded from Conversation History', {
        size: 14,
        weight: 700,
        color: critical,
    })
    fig.text(rLeft + 18, outY + 58, '"...because the database failover is still running."', {
        size: 15,
        weight: 600,
        color: c.textSecondary,
        width: rW - 30,
    })
    fig.text(rLeft + 18, outY + 96, 'Unconfirmed tail purged -> model never assumes caller heard it', {
        size: 12,
        color: muted,
        width: rW - 30,
    })

    return fig.render()
}

export default create()
