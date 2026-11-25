import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 425
export const alt =
    'Aligned two-layer timeline on a shared 0 to 500 millisecond clock compares coarse network/SSE chunk timestamps against per-token event logs for request r01. The upper layer bundles all five tokens into one coarse SSE frame timestamp, hiding internal jitter. The lower layer resolves the exact five token arrivals at 240, 280, 320, 440, and 480 ms, exposing inter-token gaps of 40, 40, 120, and 40 ms.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')

    fig.text(20, 20, 'Same 5 tokens: coarse SSE chunk vs per-token event log (r01)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    // Shared horizontal timeline x-mapping: 0..500 ms -> x = 168..716 (room on right for 'done 500')
    const axisX = 168
    const axisW = 548
    const tToX = (ms: number) => axisX + (ms / 500) * axisW
    const tokens = [
        { id: 't1', ms: 240 },
        { id: 't2', ms: 280 },
        { id: 't3', ms: 320 },
        { id: 't4', ms: 440 },
        { id: 't5', ms: 480 },
    ] as const

    // Vertical faint alignment guides for the 5 true token arrival times
    for (const tok of tokens) {
        fig.line(tToX(tok.ms), 58, tToX(tok.ms), 354, {
            color: c.borderSubtle,
            width: 1,
            dash: '3 4',
        })
    }
    // Send line at 0 ms and terminal line at 500 ms
    fig.line(tToX(0), 58, tToX(0), 354, { color: c.borderLight, width: 1.25 })
    fig.line(tToX(500), 58, tToX(500), 354, { color: c.borderSubtle, width: 1, dash: '3 4' })

    // ─── Layer 1: Coarse SSE / TCP chunk view ───
    const lane1Y = 98
    fig.text(20, lane1Y - 10, 'Layer 1 · SSE / TCP', {
        size: 14.5,
        weight: 700,
        color: purple,
    })
    fig.text(20, lane1Y + 11, '1 frame timestamp', {
        size: 12.5,
        color: c.textSecondary,
    })

    // Lane baseline
    fig.line(tToX(0), lane1Y, tToX(500), lane1Y, { color: c.borderLight, width: 1.5 })
    fig.circle(tToX(0), lane1Y, 4.5, { fill: c.textSecondary })
    fig.text(tToX(0) + 8, lane1Y - 16, 'send', { size: 12, color: c.textSecondary })

    // Single coarse chunk box spanning t1..t5 (240..480 ms) with one frame arrival stamp
    const chunkX = tToX(240)
    const chunkW = tToX(480) - tToX(240)
    const chunkH = 46
    fig.path(
        `M${chunkX + 6} ${lane1Y - chunkH / 2}H${chunkX + chunkW - 6}Q${chunkX + chunkW} ${lane1Y - chunkH / 2} ${chunkX + chunkW} ${lane1Y - chunkH / 2 + 6}V${lane1Y + chunkH / 2 - 6}Q${chunkX + chunkW} ${lane1Y + chunkH / 2} ${chunkX + chunkW - 6} ${lane1Y + chunkH / 2}H${chunkX + 6}Q${chunkX} ${lane1Y + chunkH / 2} ${chunkX} ${lane1Y + chunkH / 2 - 6}V${lane1Y - chunkH / 2 + 6}Q${chunkX} ${lane1Y - chunkH / 2} ${chunkX + 6} ${lane1Y - chunkH / 2}Z`,
        { fill: tint(purple, c.bg, 0.16), color: purple, width: 1.75, dash: '5 3' },
    )
    fig.text(chunkX + chunkW / 2, lane1Y - 8, '1 coarse SSE chunk (5 tokens bundled)', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(chunkX + chunkW / 2, lane1Y + 11, 'Inner per-token ITL gaps hidden', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
    })
    // Single read timestamp pin at end of chunk
    fig.circle(tToX(480), lane1Y, 5.5, { fill: purple })
    fig.text(tToX(480), lane1Y - 34, 'Single frame read', {
        size: 12,
        weight: 600,
        color: purple,
        align: 'right',
    })

    // Horizontal divider between Layer 1 and Layer 2
    fig.line(20, 174, width - 20, 174, { color: c.borderSubtle, width: 1 })

    // ─── Layer 2: Per-token event log (r01) ───
    const lane2Y = 252
    fig.text(20, lane2Y - 10, 'Layer 2 · Token log', {
        size: 14.5,
        weight: 700,
        color: green,
    })
    fig.text(20, lane2Y + 11, 'True per-token ITL', {
        size: 12.5,
        color: c.textSecondary,
    })

    // Baseline
    fig.line(tToX(0), lane2Y, tToX(500), lane2Y, { color: c.borderLight, width: 1.5 })

    // TTFT bar from 0 to 240 ms
    fig.rect(tToX(0), lane2Y - 12, tToX(240) - tToX(0), 24, {
        fill: tint(blue, c.bg, 0.16),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 4,
    })
    fig.text((tToX(0) + tToX(240)) / 2, lane2Y, 'TTFT · 240 ms', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })

    // Inter-token gap bands (40, 40, 120, 40 ms)
    const gaps = [
        { a: 240, b: 280, label: '40', color: green, stall: false },
        { a: 280, b: 320, label: '40', color: green, stall: false },
        { a: 320, b: 440, label: '120 ms stall', color: red, stall: true },
        { a: 440, b: 480, label: '40', color: green, stall: false },
    ]
    for (const g of gaps) {
        const gx1 = tToX(g.a)
        const gx2 = tToX(g.b)
        fig.rect(gx1 + 2, lane2Y - 12, gx2 - gx1 - 4, 24, {
            fill: tint(g.color, c.bg, g.stall ? 0.28 : 0.2),
            stroke: g.color,
            strokeWidth: g.stall ? 1.8 : 1.35,
            radius: 4,
        })
        fig.text((gx1 + gx2) / 2, lane2Y, g.label, {
            size: g.stall ? 13 : 11.5,
            weight: 700,
            color: g.color,
            align: 'center',
            mono: true,
        })
    }

    // Individual token pins & exact timestamps above/below
    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i]!
        const tx = tToX(tok.ms)
        const pinColor = tok.ms === 440 ? red : blue
        fig.circle(tx, lane2Y, 3.8, { fill: pinColor, stroke: c.bg, width: 1.25 })
        // Alternate slight vertical staggering only if adjacent pins are close (240, 280, 320)
        const topOffset = i % 2 === 0 ? 30 : 48
        fig.line(tx, lane2Y - 12, tx, lane2Y - topOffset + 9, {
            color: pinColor,
            width: 1.1,
            opacity: 0.75,
        })
        fig.text(tx, lane2Y - topOffset, `${tok.id}: ${tok.ms}`, {
            size: 12,
            weight: 700,
            color: pinColor,
            align: 'center',
            mono: true,
        })
    }

    // Terminal marker at 500 ms (cleanly to the right of the dot, zero stem overlap)
    fig.circle(tToX(500), lane2Y, 4.5, { fill: c.textSecondary })
    fig.text(tToX(500) + 8, lane2Y, 'done', {
        size: 11.5,
        weight: 600,
        color: c.textSecondary,
        align: 'left',
    })
    fig.text(tToX(500) + 8, lane2Y + 14, '500 ms', {
        size: 11,
        color: c.textMuted,
        align: 'left',
        mono: true,
    })

    // Summary brace beneath the 4 inter-token gaps
    fig.brace(tToX(240), lane2Y + 22, tToX(480), lane2Y + 22, 'ITL gaps: 40, 40, 120, 40 ms (TPOT = 60 ms)', {
        side: 1,
        depth: 10,
        labelGap: 14,
        color: green,
        labelColor: c.textPrimary,
        labelSize: 13,
        weight: 600,
    })

    // Shared bottom millisecond clock axis
    const axisY = 360
    fig.line(tToX(0), axisY, tToX(500), axisY, { color: c.textMuted, width: 1.25 })
    for (const tick of [0, 100, 200, 300, 400, 500]) {
        const x = tToX(tick)
        fig.line(x, axisY, x, axisY + 5, { color: c.textMuted, width: 1.25 })
        fig.text(x, axisY + 18, `${tick} ms`, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(axisX + axisW / 2, axisY + 40, 'Shared request clock (ms)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
