import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 400
export const alt =
    'Left: a 1,280-token prompt splits into 1,200 cached prefix tokens (93.8%) and 80 delta tokens. On a shared 0 to 100 ms axis, a cold miss spends 72 ms prefill plus 24 ms decode (96 ms total) while a warm hit spends 11 ms prefill plus the same 24 ms decode (35 ms total), saving 61 ms. Right: editing the prefix in PSM invalidates downstream suffix KV blocks, whereas suffix-first SPM keeps suffix KV warm.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // --- LEFT: Prompt Split + Aligned Cold vs Warm Bars ---
    fig.text(28, 22, '1. Service Time (1,280-token prompt)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Proportional prompt token strip: 1,200 cached (93.75%) + 80 delta (6.25%)
    const stripX = 28
    const stripW = 416
    const cachedW = Math.round((1200 / 1280) * stripW)
    const deltaW = stripW - cachedW
    fig.rect(stripX, 46, cachedW - 2, 26, {
        fill: tint(green, c.bg, 0.2),
        stroke: green,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text(stripX + cachedW / 2, 59, '1,200 cached prefix tokens (93.8%)', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.rect(stripX + cachedW, 46, deltaW, 26, {
        fill: tint(warm, c.bg, 0.26),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text(stripX + cachedW + deltaW / 2, 59, '80', {
        size: 11,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(stripX + stripW, 84, '80 delta', {
        size: 11,
        weight: 600,
        color: warm,
        align: 'right',
        mono: true,
    })

    // Calibrated 0..100 ms bar axis
    const barPlot = fig.plot({ x: 28, y: 112, width: 416, height: 192 }, { x: [0, 100], y: [0, 10] })

    // Subtle vertical grid lines
    for (const t of [0, 25, 50, 75, 100]) {
        const tx = barPlot.px(t)
        fig.line(tx, 112, tx, 304, { color: c.borderSubtle, width: 1 })
        fig.line(tx, 304, tx, 309, { color: c.textMuted, width: 1 })
        fig.text(tx, 323, `${t} ms`, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(barPlot.px(0), 304, barPlot.px(100), 304, { color: c.textMuted, width: 1 })

    // Bar 1: Cold miss (72 prefill + 24 decode = 96 ms)
    fig.text(28, 126, 'Cold miss (all 1,280 prefilled)', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(barPlot.px(96), 126, '96 ms', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'right',
        mono: true,
    })
    fig.rect(barPlot.px(0), 140, barPlot.px(72) - barPlot.px(0) - 1, 36, {
        fill: blue,
        opacity: 0.88,
        radius: 4,
    })
    fig.text((barPlot.px(0) + barPlot.px(72)) / 2, 158, '72 ms prefill', {
        size: 13,
        weight: 700,
        color: c.bg,
        align: 'center',
        mono: true,
    })
    fig.rect(barPlot.px(72), 140, barPlot.px(96) - barPlot.px(72), 36, {
        fill: purple,
        opacity: 0.9,
        radius: 4,
    })
    fig.text((barPlot.px(72) + barPlot.px(96)) / 2, 158, '24 ms', {
        size: 12,
        weight: 700,
        color: c.bg,
        align: 'center',
        mono: true,
    })

    // Bar 2: Warm hit (11 prefill + 24 decode = 35 ms)
    fig.text(28, 212, 'Warm hit (80 delta prefilled)', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(barPlot.px(96), 212, '35 ms', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.rect(barPlot.px(0), 226, barPlot.px(11) - barPlot.px(0) - 1, 36, {
        fill: green,
        opacity: 0.9,
        radius: 4,
    })
    fig.text((barPlot.px(0) + barPlot.px(11)) / 2, 244, '11', {
        size: 12,
        weight: 700,
        color: c.bg,
        align: 'center',
        mono: true,
    })
    fig.rect(barPlot.px(11), 226, barPlot.px(35) - barPlot.px(11), 36, {
        fill: purple,
        opacity: 0.9,
        radius: 4,
    })
    fig.text((barPlot.px(11) + barPlot.px(35)) / 2, 244, '24 ms', {
        size: 12,
        weight: 700,
        color: c.bg,
        align: 'center',
        mono: true,
    })

    // Brace highlighting the 61 ms saved (35 -> 96 ms)
    fig.brace(barPlot.px(35), 266, barPlot.px(96), 266, '61 ms saved (2.7x faster)', {
        side: 1,
        depth: 9,
        color: green,
        labelColor: green,
        labelSize: 13,
        labelGap: 14,
        weight: 700,
    })

    // Legend row bottom left
    fig.rect(28, 354, 12, 12, { fill: blue, radius: 3 })
    fig.text(46, 360, 'Cold prefill', { size: 12, color: c.textSecondary })
    fig.rect(144, 354, 12, 12, { fill: green, radius: 3 })
    fig.text(162, 360, 'Warm prefill', { size: 12, color: c.textSecondary })
    fig.rect(268, 354, 12, 12, { fill: purple, radius: 3 })
    fig.text(286, 360, 'Decode (24 ms fixed)', { size: 12, color: c.textSecondary })

    // Divider
    fig.line(478, 18, 478, 382, { color: c.borderSubtle, width: 1.25 })

    // --- RIGHT: Causal KV Invalidation (PSM vs SPM) ---
    fig.text(504, 22, '2. Causal KV Reuse: PSM vs SPM', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(504, 46, 'Editing prefix invalidates everything after it', {
        size: 13,
        color: c.textSecondary,
    })

    // PSM strip
    fig.text(504, 92, 'PSM: <PRE> Prefix <SUF> Suffix <MID>', {
        size: 13,
        weight: 700,
        color: red,
        mono: true,
    })
    fig.rect(504, 110, 152, 46, {
        fill: tint(warm, c.bg, 0.16),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(580, 127, 'Prefix (edited)', { size: 13, weight: 700, color: warm, align: 'center' })
    fig.text(580, 145, 'recompute', { size: 11, color: c.textSecondary, align: 'center' })

    fig.arrow(658, 133, 678, 133, { color: red, width: 1.6, head: 6 })

    fig.rect(680, 110, 156, 46, {
        fill: tint(red, c.bg, 0.14),
        stroke: red,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(758, 127, 'Suffix KV invalid', { size: 13, weight: 700, color: red, align: 'center' })
    fig.text(758, 145, 'full recompute', { size: 11, color: red, align: 'center' })
    fig.text(504, 174, 'Prefix sits first -> suffix KV misses every edit', {
        size: 12,
        color: c.textSecondary,
    })

    // Hairline separator
    fig.line(504, 204, 836, 204, { color: c.borderSubtle, width: 1 })

    // SPM strip
    fig.text(504, 232, 'SPM: <SUF> Suffix <PRE> Prefix <MID>', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
    })
    fig.rect(504, 250, 156, 46, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(582, 267, 'Suffix KV KEPT', { size: 13, weight: 700, color: green, align: 'center' })
    fig.text(582, 285, 'static across edits', { size: 11, color: green, align: 'center' })

    fig.arrow(662, 273, 682, 273, { color: c.textMuted, width: 1.5, head: 5 })

    fig.rect(684, 250, 152, 46, {
        fill: tint(warm, c.bg, 0.14),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(760, 267, 'Prefix (edited)', { size: 13, weight: 700, color: warm, align: 'center' })
    fig.text(760, 285, 'recompute tail only', {
        size: 11,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(504, 314, 'Suffix sits first -> KV stays warm while typing', {
        size: 12,
        color: green,
        weight: 600,
    })

    fig.text(504, 360, 'Excludes queue, network RTT, and UI paint', {
        size: 12,
        color: c.textMuted,
    })

    return fig.render()
}

export default create('dark')
