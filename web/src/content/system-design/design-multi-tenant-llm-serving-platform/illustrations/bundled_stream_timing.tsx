import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 395
export const alt =
    'Aligned timeline comparing GPU engine decode steps against client-observed streamed events on a 0 to 240 ms axis. Arrival occurs at 0 ms, token 1 emits at 100 ms (TTFT), tokens 2 through 5 decode smoothly at 30 ms intervals on the engine but arrive bundled in a single frame at 220 ms, and the stream closes at 240 ms. Observed event gap is 120 ms while completion-based TPOT equals (240 - 100) / (5 - 1) = 35 ms per token.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const soft = (hex: string, a = 0.14) => tint(hex, c.bg, a)

    // Shared horizontal time coordinate system: 0..240 ms mapped cleanly to x = 144..704
    const plot = fig.plot({ x: 144, y: 54, width: 560, height: 222 }, { x: [0, 240], y: [0, 10] })

    const ticks = [0, 40, 80, 120, 160, 200, 240]
    for (const t of ticks) {
        const x = plot.px(t)
        fig.line(x, 54, x, 276, { color: c.borderSubtle, width: 1, opacity: 0.7 })
        fig.line(x, 276, x, 282, { color: c.textMuted, width: 1.2 })
        fig.text(x, 298, `${t}`, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
            width: 44,
        })
    }
    fig.line(plot.px(0), 276, plot.px(240), 276, { color: c.textMuted, width: 1.4 })
    fig.text(plot.px(120), 322, 'Elapsed time from gateway arrival (ms)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        width: 300,
    })

    // Milestone vertical reference hairlines at 100, 220, 240 ms
    for (const [ms, col] of [
        [100, blue],
        [220, purple],
        [240, green],
    ] as const) {
        fig.line(plot.px(ms), 44, plot.px(ms), 276, {
            color: col,
            width: 1.25,
            dash: '4 3',
            opacity: 0.75,
        })
    }

    // Top milestone headers (spaced cleanly with zero collisions)
    fig.text(plot.px(0), 28, 'Arrival (0)', {
        size: 13,
        color: c.textSecondary,
        align: 'left',
        weight: 600,
        width: 90,
    })
    fig.text(plot.px(100), 28, 'TTFT (100 ms)', {
        size: 13,
        color: blue,
        align: 'center',
        weight: 700,
        width: 120,
    })
    fig.text(plot.px(220) - 6, 28, 'Bundle (220)', {
        size: 13,
        color: purple,
        align: 'right',
        weight: 700,
        width: 110,
    })
    fig.text(plot.px(240) + 8, 28, 'EOF (240)', {
        size: 13,
        color: green,
        align: 'left',
        weight: 700,
        width: 82,
    })

    // Lane 1: GPU Engine (smooth autoregressive decode)
    const yEngine = 106
    fig.text(130, yEngine - 8, 'GPU Engine', {
        size: 14,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
        width: 115,
    })
    fig.text(130, yEngine + 12, 'decode steps', {
        size: 12,
        color: c.textSecondary,
        align: 'right',
        width: 115,
    })

    // Prefill bar (0..100 ms)
    const onBlue = getReadableTextColor(blue, c, c.bg)
    fig.rect(plot.px(0), yEngine - 14, plot.px(100) - plot.px(0), 28, {
        fill: blue,
        radius: 5,
    })
    fig.text((plot.px(0) + plot.px(100)) / 2, yEngine, 'Queue + Prefill (100 ms)', {
        size: 13,
        color: onBlue,
        align: 'center',
        weight: 600,
        width: 210,
    })

    // Decode track (100..220 ms) + 5 individual tokens
    fig.rect(plot.px(100), yEngine - 14, plot.px(220) - plot.px(100), 28, {
        fill: soft(green, theme === 'light' ? 0.12 : 0.18),
        stroke: tint(green, c.bg, 0.55),
        strokeWidth: 1.2,
        radius: 5,
    })
    const tokenTimes = [100, 130, 160, 190, 220]
    tokenTimes.forEach((ms, idx) => {
        const cx = plot.px(ms)
        fig.circle(cx, yEngine, 6.5, { fill: green, stroke: c.bg, width: 1.5 })
        fig.text(cx, yEngine - 26, `T${idx + 1}`, {
            size: 12,
            color: green,
            align: 'center',
            weight: 700,
            mono: true,
            width: 30,
        })
    })
    // Close segment (220..240 ms)
    fig.rect(plot.px(220), yEngine - 14, plot.px(240) - plot.px(220), 28, {
        fill: soft(green, 0.25),
        stroke: green,
        strokeWidth: 1,
        radius: 4,
    })
    fig.circle(plot.px(240), yEngine, 5, { fill: green })

    // Lane 2: Client Stream (buffered events)
    const yClient = 220
    fig.text(130, yClient - 8, 'Client Stream', {
        size: 14,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
        width: 115,
    })
    fig.text(130, yClient + 12, 'SSE frames', {
        size: 12,
        color: c.textSecondary,
        align: 'right',
        width: 115,
    })

    // Client wait (0..100 ms)
    fig.rect(plot.px(0), yClient - 14, plot.px(100) - plot.px(0), 28, {
        fill: soft(blue, theme === 'light' ? 0.1 : 0.16),
        stroke: tint(blue, c.bg, 0.45),
        strokeWidth: 1,
        radius: 5,
    })
    fig.text((plot.px(0) + plot.px(100)) / 2, yClient, 'Waiting for token 1', {
        size: 13,
        color: blue,
        align: 'center',
        weight: 500,
        width: 180,
    })

    // Observed 120 ms event gap (100..220 ms)
    fig.rect(plot.px(100), yClient - 14, plot.px(220) - plot.px(100), 28, {
        fill: soft(warm, theme === 'light' ? 0.14 : 0.22),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 5,
    })
    fig.text((plot.px(100) + plot.px(220)) / 2, yClient, 'Observed event gap: 120 ms', {
        size: 13,
        color: warm,
        align: 'center',
        weight: 700,
        width: 240,
    })

    // Close tail (220..240 ms)
    fig.rect(plot.px(220), yClient - 14, plot.px(240) - plot.px(220), 28, {
        fill: soft(green, 0.22),
        stroke: green,
        strokeWidth: 1,
        radius: 4,
    })
    fig.text(plot.px(240) + 8, yClient, 'Close: 20 ms', {
        size: 12,
        color: green,
        align: 'left',
        weight: 600,
        mono: true,
        width: 102,
    })

    // Funnel arrows from Engine T2..T5 down into Client 220ms bundle frame
    for (const ms of [130, 160, 190, 220]) {
        const sx = plot.px(ms)
        const tx = plot.px(220)
        fig.path(`M${sx} ${yEngine + 16}Q${(sx + tx) / 2 + 12} 162,${tx} ${yClient - 18}`, {
            color: purple,
            width: 1.4,
            dash: ms === 220 ? undefined : '4 3',
            opacity: 0.85,
        })
    }
    // Label placed cleanly in open space to the left of the funnel curves
    fig.text(plot.px(104), 162, '4 tokens bundled ->', {
        size: 12,
        color: purple,
        align: 'left',
        weight: 700,
        width: 155,
    })

    // Client frame markers
    fig.circle(plot.px(100), yClient, 7, { fill: blue, stroke: c.bg, width: 1.5 })
    fig.text(plot.px(100), yClient + 26, 'Frame 1: [T1]', {
        size: 12,
        color: blue,
        align: 'center',
        weight: 600,
        width: 100,
    })
    fig.circle(plot.px(220), yClient, 8.5, { fill: purple, stroke: c.bg, width: 1.5 })
    fig.text(plot.px(220) - 4, yClient + 26, 'Frame 2: [T2..T5]', {
        size: 12,
        color: purple,
        align: 'right',
        weight: 700,
        width: 130,
    })

    // Bottom TPOT formula strip (frameless MathJax)
    fig.math(
        410,
        362,
        String.raw`\text{TPOT} = \frac{240 - 100}{5 - 1} = 35\text{ ms/tok} \qquad\text{vs.}\qquad \text{Event gap} = 120\text{ ms}`,
        { size: 15, color: c.textPrimary, align: 'center' },
    )

    return fig.render()
}
