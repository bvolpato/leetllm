import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 435
export const alt =
    'Calibrated 0 to 150 millisecond timeline for disaggregated prefill and decode. Top stacked bar spans prompt queue (20 ms), prefill (60 ms), KV handoff (40 ms), decode queue (15 ms), and next decode step (10 ms), totaling 145 ms. Early delivery emits token 1 at 80 ms (passing the 90 ms TTFT limit) and token 2 at 145 ms (65 ms gap, missing the 30 ms gap target). Buffered delivery emits token 1 at 135 ms (missing TTFT) and token 2 at 145 ms (10 ms gap, passing). Attention KV payload is 0.25 GiB at 4,096 tokens.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    const xLeft = 114
    const xRight = 720
    const xOf = (ms: number) => xLeft + (ms / 150) * (xRight - xLeft)

    // --- Header ---
    fig.text(28, 20, 'Disaggregated prefill → decode timeline (0–150 ms)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // Shaded TTFT <= 90 ms zone spanning the delivery tracks
    fig.rect(xOf(0), 178, xOf(90) - xOf(0), 184, {
        fill: tint(green, c.bg, theme === 'light' ? 0.08 : 0.11),
        radius: 4,
    })

    // Vertical grid & calibrated ms ticks (keep 90 ms limit line strictly in delivery section below y=154)
    for (const ms of [0, 30, 60, 90, 120, 150]) {
        const tx = xOf(ms)
        const isLimit = ms === 90
        fig.line(tx, isLimit ? 154 : 154, tx, 366, {
            color: isLimit ? green : c.borderSubtle,
            width: isLimit ? 1.75 : 1,
            dash: isLimit ? '5 4' : '3 3',
            opacity: isLimit ? 0.9 : 0.7,
        })
        fig.text(tx, 384, `${ms}`, {
            size: 13,
            weight: isLimit ? 700 : 400,
            color: isLimit ? green : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(xOf(150) + 14, 384, 'ms', { size: 13, color: c.textSecondary, mono: true })
    fig.text(xOf(90) - 6, 190, 'TTFT ≤ 90 ms zone', {
        size: 13,
        weight: 600,
        color: green,
        align: 'right',
    })

    // --- Track 1: Shared stage path (0..145 ms) ---
    fig.text(xLeft - 12, 78, 'Stages', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
    })

    const stages = [
        { from: 0, to: 20, label: '20', name: 'Prompt Q', color: c.textMuted },
        { from: 20, to: 80, label: '60 ms', name: 'Prefill', color: blue },
        { from: 80, to: 120, label: '40 ms', name: 'KV handoff', color: cyan },
        { from: 120, to: 135, label: '15', name: 'Dec Q', color: warm },
        { from: 135, to: 145, label: '10', name: 'Decode', color: green },
    ]
    const barY = 58
    const barH = 38
    stages.forEach((s) => {
        const sx = xOf(s.from)
        const sw = xOf(s.to) - sx
        fig.rect(sx, barY, sw, barH, {
            fill: tint(s.color, c.bg, theme === 'light' ? 0.75 : 0.84),
            stroke: c.bg,
            strokeWidth: 1.5,
            radius: 3,
        })
        fig.text(sx + sw / 2, barY + barH / 2, s.label, {
            size: 13,
            weight: 700,
            color: theme === 'light' ? '#ffffff' : '#0b0c10',
            align: 'center',
            mono: true,
        })
    })

    // Swatch legend cleanly underneath stage bar
    const legXs = [114, 224, 320, 444, 540]
    stages.forEach((s, i) => {
        const lx = legXs[i]!
        fig.rect(lx, 114, 11, 11, {
            fill: tint(s.color, c.bg, theme === 'light' ? 0.75 : 0.84),
            radius: 2,
        })
        fig.text(lx + 16, 120, s.name, { size: 13, color: c.textSecondary })
    })

    // Hairline separator
    fig.line(28, 152, 732, 152, { color: c.borderSubtle, width: 1 })

    // --- Delivery Track 1: Early Token-1 Delivery ---
    const t1Y = 232
    fig.text(xLeft - 12, t1Y - 9, 'Early', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
    })
    fig.text(xLeft - 12, t1Y + 11, 'delivery', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    fig.line(xOf(0), t1Y, xOf(145), t1Y, { color: c.borderLight, width: 2.5 })
    // Gap highlight band (80 -> 145 ms = 65 ms miss!)
    fig.rect(xOf(80), t1Y - 8, xOf(145) - xOf(80), 16, {
        fill: tint(red, c.bg, theme === 'light' ? 0.24 : 0.36),
        stroke: red,
        strokeWidth: 1.25,
        radius: 3,
    })
    fig.circle(xOf(80), t1Y, 6, { fill: blue, stroke: c.bg, width: 2 })
    fig.circle(xOf(145), t1Y, 6, { fill: green, stroke: c.bg, width: 2 })

    fig.text(xOf(80) - 8, t1Y - 19, 'Tok 1 · 80 ms (TTFT ✓)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(xOf(93), t1Y + 23, 'Gap 65 ms (misses ≤ 30 ms ✗)', {
        size: 13,
        weight: 700,
        color: red,
        align: 'left',
    })
    fig.text(xOf(145), t1Y - 19, 'Tok 2 · 145 ms', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })

    // --- Delivery Track 2: Buffered Token-1 Delivery ---
    const t2Y = 324
    fig.text(xLeft - 12, t2Y - 9, 'Buffered', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
    })
    fig.text(xLeft - 12, t2Y + 11, 'delivery', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    fig.line(xOf(0), t2Y, xOf(145), t2Y, { color: c.borderLight, width: 2.5 })
    // Gap highlight band (135 -> 145 ms = 10 ms pass!)
    fig.rect(xOf(135), t2Y - 8, xOf(145) - xOf(135), 16, {
        fill: tint(green, c.bg, theme === 'light' ? 0.26 : 0.4),
        stroke: green,
        strokeWidth: 1.25,
        radius: 3,
    })
    fig.circle(xOf(135), t2Y, 6, { fill: red, stroke: c.bg, width: 2 })
    fig.circle(xOf(145), t2Y, 6, { fill: green, stroke: c.bg, width: 2 })

    fig.text(xOf(135) - 10, t2Y - 19, 'Tok 1 · 135 ms (TTFT ✗)', {
        size: 13,
        weight: 700,
        color: red,
        align: 'right',
    })
    fig.text(xOf(145), t2Y + 23, 'Gap 10 ms (≤ 30 ms ✓)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
    })

    // Footer metric summary
    fig.text(
        380,
        416,
        'Targets: TTFT ≤ 90 ms & first gap ≤ 30 ms  ·  KV transfer: 0.25 GiB / 4,096 tokens',
        {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create
