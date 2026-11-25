import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 430
export const alt =
    'Dual-clock point-in-time selection for job J-204 at 09:00 UTC. Left: 2D scatter of Event Time versus Availability Time zoomed on 08:00 to 10:00 shows the green eligible quadrant (both <= 09:00) containing the selected 08:30 heartbeat (available 08:31, age 0.5h), while the 08:50 heartbeat (available 09:15) falls into the red late-arrival leakage zone. Right: full-day dual-clock timeline of all four pings (01:00, 08:30, 08:50, and 12:00) against the 09:00 cutoff.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const isLight = theme === 'light'

    // Left: 2D Bi-temporal scatter plot (08:00 to 10:00 close-up, minutes 480..600)
    fig.text(78, 22, 'Dual-clock feasibility (08:00–10:00 UTC)', {
        size: 15,
        weight: 700,
    })

    const plot = fig.plot(
        { x: 80, y: 54, width: 392, height: 314 },
        { x: [480, 600], y: [480, 600] },
    )

    const cutoff = 540 // 09:00
    const xCut = plot.px(cutoff)
    const yCut = plot.py(cutoff)

    // Eligible quadrant (bottom-left: event <= 09:00 AND avail <= 09:00)
    fig.rect(plot.area.x, yCut, xCut - plot.area.x, plot.bottom - yCut, {
        fill: tint(green, c.bg, isLight ? 0.14 : 0.2),
    })
    // Late-arrival leakage quadrant (top-left: event <= 09:00 AND avail > 09:00)
    fig.rect(plot.area.x, plot.area.y, xCut - plot.area.x, yCut - plot.area.y, {
        fill: tint(red, c.bg, isLight ? 0.11 : 0.16),
    })
    // Future quadrant (top-right: event > 09:00 AND avail > 09:00)
    fig.rect(xCut, plot.area.y, plot.right - xCut, yCut - plot.area.y, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.08 : 0.12),
    })

    // Impossible triangle (avail < event) subtle tint + diagonal line
    fig.path(
        `M${plot.px(480)} ${plot.py(480)} L${plot.px(600)} ${plot.py(600)} L${plot.px(600)} ${plot.py(480)} Z`,
        {
            fill: tint(c.textMuted, c.bg, isLight ? 0.12 : 0.18),
            fillOpacity: 0.7,
        },
    )
    fig.line(plot.px(480), plot.py(480), plot.px(600), plot.py(600), {
        color: c.textMuted,
        width: 1.2,
        dash: '3 3',
    })
    fig.text(plot.px(572), plot.py(504), 'avail < event\n(impossible)', {
        size: 11,
        color: c.textMuted,
        align: 'center',
    })

    const fmtTime = (m: number) => {
        const hh = Math.floor(m / 60)
        const mm = m % 60
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
    }

    plot.axes({
        xTicks: [480, 510, 540, 570, 600],
        yTicks: [480, 510, 540, 570, 600],
        xFormat: fmtTime,
        yFormat: fmtTime,
        xLabel: 'Event time (UTC)',
        yLabel: 'Availability time',
        grid: false,
        labelSize: 12,
    })

    // 09:00 cutoff crosshairs
    fig.line(xCut, plot.area.y, xCut, plot.bottom, { color: warm, width: 2, dash: '5 4' })
    fig.line(plot.area.x, yCut, plot.right, yCut, { color: warm, width: 2, dash: '5 4' })

    // Quadrant zone labels
    fig.text(plot.area.x + 10, plot.area.y + 16, 'Late-arrival leakage', {
        size: 12,
        weight: 700,
        color: red,
    })
    fig.text(xCut + 8, plot.area.y + 16, 'Future events', {
        size: 12,
        weight: 600,
        color: c.textMuted,
        align: 'left',
    })
    fig.text(plot.area.x + 10, yCut + 16, 'Eligible at 09:00', {
        size: 12,
        weight: 700,
        color: green,
    })

    // Highlighted data points: (08:30, 08:31) and (08:50, 09:15)
    plot.point(510, 511, { color: green, r: 7 })
    fig.circle(plot.px(510), plot.py(511), 11, { stroke: green, width: 1.5, opacity: 0.7 })

    plot.point(530, 555, { color: red, r: 7 })

    // Crisp non-overlapping callouts
    fig.callout(
        [plot.px(510) + 8, plot.py(511) - 6],
        [plot.px(546), plot.py(530)],
        '08:30 (avail 08:31)',
        {
            color: green,
            labelColor: green,
            align: 'left',
            size: 12,
            weight: 700,
            bend: -0.15,
        },
    )
    fig.text(plot.px(546) + 6, plot.py(530) + 15, 'Selected -> age 0.5h', {
        size: 11,
        weight: 600,
        color: c.textSecondary,
    })

    fig.callout(
        [plot.px(530) - 7, plot.py(555) - 5],
        [plot.px(522), plot.py(576)],
        '08:50 (avail 09:15)',
        {
            color: red,
            labelColor: red,
            align: 'right',
            size: 12,
            weight: 700,
            bend: 0.16,
        },
    )
    fig.text(plot.px(522) - 6, plot.py(576) + 15, 'Blocked: arrived late', {
        size: 11,
        weight: 600,
        color: red,
        align: 'right',
    })

    // Vertical divider
    fig.line(500, 32, 500, 398, { color: c.borderSubtle, width: 1 })

    // Right: Full-day 4-ping dual-clock ledger (visual arrows, no prose cards)
    const rx = 524
    const rw = 314
    fig.text(rx, 22, 'All J-204 pings vs 09:00 cutoff', {
        size: 15,
        weight: 700,
    })

    // Map 00:00..13:00 to [rx + 60, rx + rw]
    const tlX0 = rx + 58
    const tlW = rw - 66
    const tx = (hr: number) => tlX0 + (hr / 13) * tlW
    const cutX = tx(9)

    // Subtle eligible vs excluded background columns
    fig.rect(tlX0, 56, cutX - tlX0, 286, {
        fill: tint(green, c.bg, isLight ? 0.06 : 0.09),
        radius: 5,
    })
    fig.rect(cutX, 56, tlX0 + tlW - cutX, 286, {
        fill: tint(red, c.bg, isLight ? 0.06 : 0.09),
        radius: 5,
    })

    // Vertical 09:00 cutoff line
    fig.line(cutX, 52, cutX, 348, { color: warm, width: 2, dash: '5 4' })
    fig.text(cutX, 362, '09:00', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(tlX0, 362, '00:00', { size: 11, color: c.textMuted, align: 'center', mono: true })
    fig.text(tlX0 + tlW, 362, '13:00', { size: 11, color: c.textMuted, align: 'center', mono: true })

    // 4 pings with event circle -> availability diamond/square
    const pings = [
        {
            y: 94,
            ev: 1.0,
            av: 1.02,
            label: '01:00',
            status: 'Earlier eligible',
            tone: blue,
        },
        {
            y: 162,
            ev: 8.5,
            av: 8.52,
            label: '08:30',
            status: 'Selected (0.5h)',
            tone: green,
        },
        {
            y: 230,
            ev: 8.83,
            av: 9.25,
            label: '08:50',
            status: 'Late (avail 09:15)',
            tone: red,
        },
        {
            y: 298,
            ev: 12.0,
            av: 12.02,
            label: '12:00',
            status: 'Future',
            tone: red,
        },
    ]

    for (const p of pings) {
        fig.line(tlX0, p.y, tlX0 + tlW, p.y, { color: c.borderSubtle, width: 1 })
        fig.text(tlX0 - 8, p.y, p.label, {
            size: 13,
            weight: 700,
            color: p.tone,
            align: 'right',
            mono: true,
        })
        const ex = tx(p.ev)
        const ax = tx(p.av)
        if (ax - ex > 5) {
            fig.arrow(ex + 5, p.y, ax - 4, p.y, { color: p.tone, width: 2, head: 5 })
            fig.circle(ex, p.y, 4.5, { fill: c.bg, stroke: p.tone, width: 2 })
            fig.circle(ax, p.y, 5, { fill: p.tone })
        } else {
            fig.circle(ex, p.y, 5.5, { fill: p.tone, stroke: c.bg, width: 1.5 })
        }
        // Keep status cleanly inside bounds and off the 09:00 line
        if (p.label === '08:30') {
            fig.text(ex - 8, p.y - 17, p.status, {
                size: 12,
                weight: 700,
                color: p.tone,
                align: 'right',
            })
        } else if (p.label === '08:50') {
            fig.text(cutX - 8, p.y - 17, p.status, {
                size: 12,
                weight: 600,
                color: p.tone,
                align: 'right',
            })
        } else if (p.label === '12:00') {
            fig.text(tlX0 + tlW - 4, p.y - 18, p.status, {
                size: 12,
                weight: 600,
                color: p.tone,
                align: 'right',
            })
        } else {
            fig.text(Math.max(ex, ax) + 10, p.y - 16, p.status, {
                size: 12,
                weight: 600,
                color: p.tone,
                align: 'left',
            })
        }
    }

    // Compact legend for event vs availability dot
    fig.circle(rx + 10, 396, 4, { fill: c.bg, stroke: c.textSecondary, width: 1.8 })
    fig.text(rx + 20, 396, 'event time', { size: 11, color: c.textSecondary })
    fig.circle(rx + 114, 396, 4.5, { fill: c.textSecondary })
    fig.text(rx + 124, 396, 'available in store', { size: 11, color: c.textSecondary })

    return fig.render()
}

export default create
