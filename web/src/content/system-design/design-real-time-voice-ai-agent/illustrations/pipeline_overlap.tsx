import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 395
export const alt =
    'Comparison on a 0 to 520 ms clock: serial execution finishes at 510 ms, while overlapping STT finalization, LLM clause streaming, and TTS synthesis delivers first audio at 380 ms, saving 130 ms.'

const STAGE_META = [
    { name: 'Turn (60 ms)', tone: 'warm' as const },
    { name: 'STT (100 ms)', tone: 'blue' as const },
    { name: 'LLM (180 ms)', tone: 'purple' as const },
    { name: 'TTS (135 ms)', tone: 'green' as const },
    { name: 'Playout (35 ms)', tone: 'cyan' as const },
] as const

const SERIAL: readonly (readonly [number, number])[] = [
    [0, 60],
    [60, 160],
    [160, 340],
    [340, 475],
    [475, 510],
]

const OVERLAP: readonly (readonly [number, number])[] = [
    [0, 60],
    [0, 100],
    [60, 240],
    [210, 345],
    [345, 380],
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const muted = c.textSecondary

    const leftX = 186
    const rightX = 804
    const maxMs = 540
    const x = (ms: number) => leftX + (ms / maxMs) * (rightX - leftX)

    // --- Top Inline Legend ---
    const legXs = [186, 304, 422, 542, 666] as const
    STAGE_META.forEach((st, i) => {
        const lx = legXs[i]!
        const color = fig.tone(st.tone)
        fig.rect(lx, 16, 14, 14, {
            fill: tint(color, c.bg, 0.25),
            stroke: color,
            strokeWidth: 1.5,
            radius: 3,
        })
        fig.text(lx + 20, 23, st.name, { size: 12, weight: 600, color: c.textPrimary })
    })

    const gridTop = 52
    const axisY = 342

    // Vertical gridlines
    for (const t of [0, 100, 200, 300, 400, 500]) {
        fig.line(x(t), gridTop, x(t), axisY, {
            color: c.borderSubtle,
            width: 1,
            dash: t === 0 ? undefined : '3 4',
        })
    }

    // --- Upper Section: Serial Execution (510 ms) ---
    const serTop = 62
    fig.text(24, serTop + 20, 'Serial Pipeline', { size: 15, weight: 700, color: warm })
    fig.text(24, serTop + 44, 'Each stage waits', { size: 13, color: muted })
    fig.text(24, serTop + 68, 'Total: 510 ms', {
        size: 14,
        weight: 700,
        color: warm,
        mono: true,
    })

    SERIAL.forEach(([a, b], i) => {
        const color = fig.tone(STAGE_META[i]!.tone)
        const y = serTop + i * 24
        fig.rect(x(a), y, Math.max(6, x(b) - x(a)), 18, {
            fill: tint(color, c.bg, 0.24),
            stroke: color,
            strokeWidth: 1.5,
            radius: 4,
        })
    })
    fig.line(x(510), serTop - 6, x(510), axisY, { color: warm, width: 1.75, dash: '5 4' })
    fig.text(x(510) - 8, serTop + 10, '510 ms', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'right',
        mono: true,
    })

    // Subtle horizontal separator
    fig.line(24, 196, rightX, 196, { color: c.borderSubtle, width: 1 })

    // --- Lower Section: Overlapped Streaming (380 ms) ---
    const ovTop = 212
    fig.text(24, ovTop + 20, 'Overlapped Stream', { size: 15, weight: 700, color: green })
    fig.text(24, ovTop + 44, 'Concurrent STT & TTS', { size: 13, color: muted })
    fig.text(24, ovTop + 68, 'Total: 380 ms', {
        size: 14,
        weight: 700,
        color: green,
        mono: true,
    })

    // Shaded savings region between 380 ms and 510 ms
    fig.rect(x(380), ovTop - 2, x(510) - x(380), 120, {
        fill: tint(green, c.bg, 0.1),
        stroke: 'none',
        radius: 6,
    })
    fig.arrow(x(510) - 4, ovTop + 56, x(380) + 4, ovTop + 56, {
        color: green,
        width: 2.25,
        head: 6,
    })
    fig.text((x(380) + x(510)) / 2, ovTop + 34, '-130 ms', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
        width: 130,
    })
    fig.text((x(380) + x(510)) / 2, ovTop + 78, '25% faster TTFA', {
        size: 12,
        weight: 600,
        color: green,
        align: 'center',
        width: 130,
    })

    OVERLAP.forEach(([a, b], i) => {
        const color = fig.tone(STAGE_META[i]!.tone)
        const y = ovTop + i * 24
        fig.rect(x(a), y, Math.max(6, x(b) - x(a)), 18, {
            fill: tint(color, c.bg, 0.24),
            stroke: color,
            strokeWidth: 1.5,
            radius: 4,
        })
    })
    fig.line(x(380), ovTop - 6, x(380), axisY, { color: green, width: 2, dash: '5 4' })
    fig.text(x(380) - 8, ovTop + 10, '380 ms', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    // --- Shared Bottom Axis ---
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
    fig.text((leftX + rightX) / 2, axisY + 42, 'Elapsed time from acoustic speech end (identical stage durations)', {
        size: 12,
        color: muted,
        align: 'center',
        width: 480,
    })

    return fig.render()
}

export default create()
