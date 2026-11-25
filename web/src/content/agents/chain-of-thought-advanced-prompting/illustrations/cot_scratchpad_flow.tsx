import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 385
export const alt =
    'Self-consistency majority voting over five sampled CoT traces. Traces T1 through T3 agree on 42, T4 errs to 36, and T5 fails answer extraction. Dividing over all 5 traces yields 60% share for 42, below the 80% abstention threshold, whereas dropping invalid T5 would falsely inflate confidence to 75%.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')
    const blue = fig.tone('blue')

    // Left: 5 Sampled CoT Traces
    fig.text(146, 22, '1. Sampled CoT Traces (N = 5, T = 0.7)', {
        size: 14.5,
        weight: 700,
        color: blue,
        align: 'center',
    })

    const traces = [
        { id: 'T1', expr: '7 × 6 = 42', bucket: 0, tone: green },
        { id: 'T2', expr: '21 × 2 = 42', bucket: 0, tone: green },
        { id: 'T3', expr: '30 + 12 = 42', bucket: 0, tone: green },
        { id: 'T4', expr: '30 + 6 = 36 (slip)', bucket: 1, tone: warm },
        { id: 'T5', expr: 'No #### tag (invalid)', bucket: 2, tone: red },
    ]
    const traceY = (i: number) => 56 + i * 54
    traces.forEach((t, i) => {
        const y = traceY(i)
        fig.rect(20, y, 252, 40, {
            fill: tint(t.tone, c.bg, theme === 'light' ? 0.09 : 0.14),
            stroke: t.tone,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(34, y + 20, `${t.id}:`, { size: 13.5, mono: true, weight: 700, color: t.tone })
        fig.text(68, y + 20, t.expr, { size: 13, mono: true, color: c.textPrimary })
    })

    // Right: Vote Share Bars with explicit 80% Abstain Threshold
    fig.text(634, 22, '2. Vote Share Over Full Denominator (N = 5)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const area = { x: 432, y: 58, width: 416, height: 248 }
    const plot = fig.plot(area, { x: [0, 100], y: [0, 3] })

    // Vertical grid & round x-ticks
    for (const tk of [0, 20, 40, 60, 80, 100]) {
        const x = plot.px(tk)
        fig.line(x, area.y, x, plot.bottom, {
            color: tk === 80 ? red : c.borderSubtle,
            width: tk === 80 ? 1.8 : 1,
            dash: tk === 0 ? undefined : '4 4',
        })
        fig.text(x, plot.bottom + 16, `${tk}%`, {
            size: 12.5,
            mono: true,
            weight: tk === 80 ? 700 : 400,
            color: tk === 80 ? red : c.textSecondary,
            align: 'center',
        })
    }
    fig.line(area.x, plot.bottom, plot.right, plot.bottom, { color: c.textMuted, width: 1.2 })
    fig.text(plot.px(80) - 6, area.y - 6, '80% abstain floor', {
        size: 12.5,
        weight: 700,
        color: red,
        align: 'right',
    })

    const buckets = [
        { label: '42 (valid)', pct: 60, frac: '3 / 5', y: 98, tone: green },
        { label: '36 (err)', pct: 20, frac: '1 / 5', y: 184, tone: warm },
        { label: 'Invalid', pct: 20, frac: '1 / 5', y: 264, tone: red },
    ]

    // Smooth curved connectors from traces to vote buckets
    traces.forEach((t, i) => {
        const x1 = 274
        const y1 = traceY(i) + 20
        const x2 = 354
        const y2 = buckets[t.bucket]!.y
        const mx = (x1 + x2) / 2
        fig.path(`M${x1} ${y1}C${mx} ${y1},${mx} ${y2},${x2} ${y2}`, {
            color: t.tone,
            width: 1.6,
            opacity: 0.8,
        })
    })

    for (const b of buckets) {
        fig.text(422, b.y, b.label, {
            size: 13.5,
            weight: 700,
            color: b.tone,
            align: 'right',
        })
        const barH = 34
        fig.rect(area.x, b.y - barH / 2, area.width, barH, {
            fill: tint(b.tone, c.bg, theme === 'light' ? 0.06 : 0.08),
            radius: 5,
        })
        const bw = plot.px(b.pct) - area.x
        fig.rect(area.x, b.y - barH / 2, bw, barH, { fill: b.tone, radius: 5 })
        if (b.pct >= 50) {
            fig.text(area.x + bw - 10, b.y, `${b.pct}% (${b.frac})`, {
                size: 13.5,
                mono: true,
                weight: 700,
                color: theme === 'light' ? '#ffffff' : c.bg,
                align: 'right',
            })
        } else {
            fig.text(area.x + bw + 10, b.y, `${b.pct}% (${b.frac})`, {
                size: 13.5,
                mono: true,
                weight: 700,
                color: b.tone,
            })
        }
    }

    // Ghost marker showing inflated filtered denominator 3/4 = 75% on row 0
    const ghostX = plot.px(75)
    fig.line(ghostX, 98 - 20, ghostX, 98 + 20, { color: warm, width: 2, dash: '3 3' })
    fig.text(ghostX - 6, 98 + 31, 'if T5 dropped: 3/4 = 75%', {
        size: 12,
        mono: true,
        color: warm,
        align: 'right',
    })

    // Bottom takeaway line (clean, no outer card)
    fig.text(
        450,
        362,
        'True agreement 3/5 = 60% (< 80% threshold) → Abstain rather than silently dropping malformed traces.',
        { size: 13.5, weight: 600, color: red, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
