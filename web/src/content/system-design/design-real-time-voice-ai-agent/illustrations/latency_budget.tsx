import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 395
export const alt =
    'Voice pipeline timeline starting at acoustic speech end (0 ms): turn commit 0 to 60 ms, STT finalization 0 to 100 ms, LLM first clause 60 to 240 ms, TTS first chunk 210 to 345 ms, and playout buffer 345 to 380 ms. First audio lands at 380 ms from speech end and 320 ms from turn commit.'

const STAGES = [
    { name: 'Turn commit', start: 0, end: 60, tone: 'warm' as const },
    { name: 'STT tail', start: 0, end: 100, tone: 'blue' as const },
    { name: 'LLM clause', start: 60, end: 240, tone: 'purple' as const },
    { name: 'TTS chunk', start: 210, end: 345, tone: 'green' as const },
    { name: 'Playout', start: 345, end: 380, tone: 'cyan' as const },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    const leftX = 148
    const rightX = 790
    const maxMs = 540
    const x = (ms: number) => leftX + (ms / maxMs) * (rightX - leftX)

    const topY = 96
    const rowStep = 44
    const barH = 28
    const axisY = topY + STAGES.length * rowStep + 6

    // --- Top Dual-Clock Span Indicators ---
    // User clock: 0 -> 380 ms
    fig.line(x(0), 26, x(380), 26, { color: green, width: 2 })
    fig.line(x(0), 21, x(0), 31, { color: green, width: 2 })
    fig.line(x(380), 21, x(380), 31, { color: green, width: 2 })
    fig.text((x(0) + x(380)) / 2, 14, 'User clock: 380 ms TTFA (from speech end)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        width: 340,
    })

    // Internal clock: 60 -> 380 ms
    fig.line(x(60), 60, x(380), 60, { color: blue, width: 2 })
    fig.line(x(60), 55, x(60), 65, { color: blue, width: 2 })
    fig.line(x(380), 55, x(380), 65, { color: blue, width: 2 })
    fig.text((x(60) + x(380)) / 2, 48, 'Internal clock: 320 ms (from turn commit)', {
        size: 13,
        weight: 600,
        color: blue,
        align: 'center',
        width: 320,
    })

    // --- Vertical Gridlines ---
    for (const t of [0, 100, 200, 300, 400, 500]) {
        fig.line(x(t), topY - 12, x(t), axisY, {
            color: c.borderSubtle,
            width: 1,
            dash: t === 0 ? undefined : '4 4',
        })
    }

    // Key reference lines: 60 ms (turn commit), 380 ms (first audio), 510 ms (serial total)
    fig.line(x(60), 65, x(60), axisY, { color: blue, width: 1.25, dash: '3 4', opacity: 0.7 })
    fig.line(x(380), 31, x(380), axisY, { color: green, width: 2, dash: '5 4' })
    fig.line(x(510), topY - 12, x(510), axisY, { color: warm, width: 1.5, dash: '4 4' })

    // Shaded 130 ms overlap savings zone (380 -> 510 ms)
    fig.rect(x(380), topY - 8, x(510) - x(380), axisY - (topY - 8), {
        fill: tint(purple, c.bg, 0.08),
        stroke: 'none',
        radius: 4,
    })
    fig.text((x(380) + x(510)) / 2, topY + 20, '-130 ms', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
        width: 120,
    })
    fig.text((x(380) + x(510)) / 2, topY + 40, 'saved vs serial', {
        size: 12,
        weight: 600,
        color: muted,
        align: 'center',
        width: 120,
    })
    fig.text(x(510), topY - 22, 'Serial: 510 ms', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
        width: 110,
    })

    // --- Stage Bars ---
    STAGES.forEach((st, i) => {
        const y = topY + i * rowStep
        const color = fig.tone(st.tone)
        const bx = x(st.start)
        const bw = Math.max(8, x(st.end) - bx)

        fig.text(24, y + barH / 2, st.name, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
        })

        fig.rect(bx, y, bw, barH, {
            fill: tint(color, c.bg, 0.22),
            stroke: color,
            strokeWidth: 1.75,
            radius: 6,
        })

        const dur = st.end - st.start
        const badge = `${st.start}-${st.end} ms (${dur} ms)`
        // Keep badges clear of the 380-510 ms savings callout
        if (st.end <= 240) {
            fig.text(bx + bw + 10, y + barH / 2, badge, {
                size: 13,
                weight: 600,
                color,
                mono: true,
            })
        } else {
            fig.text(bx - 10, y + barH / 2, badge, {
                size: 13,
                weight: 600,
                color,
                align: 'right',
                mono: true,
            })
        }
    })

    // --- Bottom Axis ---
    fig.line(leftX, axisY, rightX, axisY, { color: c.textMuted, width: 1.25 })
    for (const t of [0, 100, 200, 300, 400, 500]) {
        fig.line(x(t), axisY, x(t), axisY + 5, { color: c.textMuted, width: 1.25 })
        fig.text(x(t), axisY + 20, `${t} ms`, {
            size: 13,
            color: muted,
            align: 'center',
            mono: true,
            width: 60,
        })
    }
    fig.text(x(380) + 6, axisY - 12, '380 ms', {
        size: 12,
        weight: 700,
        color: green,
        align: 'left',
        mono: true,
    })
    fig.text((leftX + rightX) / 2, axisY + 46, 'Time after acoustic speech end (ms)', {
        size: 13,
        color: muted,
        align: 'center',
        width: 340,
    })

    return fig.render()
}

export default create()
