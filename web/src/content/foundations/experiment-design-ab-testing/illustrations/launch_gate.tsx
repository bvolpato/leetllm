import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 435
export const alt =
    'Multi-metric launch forest plot for the 2,000-query RAG experiment. Resolution lift (+4.0 pp, 95% CI [+1.0, +7.0]) clears zero and the +2.0 pp target (PASS). Grounding failure delta (+0.05 pp, 95% CI [-0.60, +0.70]) crosses the +0.50 pp harm ceiling (HOLD). p95 latency (+80 ms vs +150 ms limit), session cost (+$0.006 vs +$0.010 limit), and human handoffs (-0.20 pp vs +0.50 pp limit) all pass, yet the grounding upper bound holds launch.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')
    const isLight = theme === 'light'

    const trackX = 196
    const trackW = 548
    const badgeX = 796

    // Header row
    fig.text(24, 24, 'Metric & role', { size: 13, weight: 700, color: c.textSecondary })
    fig.text(trackX + trackW / 2, 24, 'Observed effect vs decision boundary (n = 2,000 / arm)', {
        size: 13,
        weight: 700,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(badgeX, 24, 'Gate', { size: 13, weight: 700, color: c.textSecondary, align: 'center' })

    const drawGateTag = (y: number, text: string, pass: boolean) => {
        const tone = pass ? green : red
        fig.rect(badgeX - 36, y - 13, 72, 26, {
            fill: tint(tone, c.bg, isLight ? 0.16 : 0.25),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(badgeX, y, text, {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
        })
    }

    // Row 1: Resolution Lift (Primary OEC) on [-0.5, +8.0] pp
    {
        const y0 = 62
        const h = 58
        const plot = fig.plot({ x: trackX, y: y0, width: trackW, height: h }, { x: [-0.5, 8.0], y: [0, 2] })
        // Shaded target zone (>= +2.0 pp)
        fig.rect(plot.px(2.0), y0, plot.right - plot.px(2.0), h, {
            fill: tint(green, c.bg, isLight ? 0.1 : 0.14),
            radius: 4,
        })
        // Axis line + ticks
        fig.line(trackX, y0 + h, trackX + trackW, y0 + h, { color: c.borderSubtle, width: 1 })
        for (const t of [0, 2, 4, 6, 8]) {
            const px = plot.px(t)
            fig.line(px, y0 + h, px, y0 + h + 4, { color: c.textMuted, width: 1 })
            fig.text(px, y0 + h + 15, t === 0 ? '0' : `+${t}`, {
                size: 11,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        }
        // Reference lines: 0 and +2.0 target
        fig.line(plot.px(0), y0, plot.px(0), y0 + h, { color: c.textMuted, width: 1.25 })
        fig.line(plot.px(2.0), y0, plot.px(2.0), y0 + h, {
            color: green,
            width: 1.5,
            dash: '4 3',
        })
        fig.text(plot.px(2.0) - 8, y0 + 12, 'target >= +2.0 pp', {
            size: 11,
            weight: 600,
            color: green,
            align: 'right',
        })

        // Whisker [+1.0, +7.0], mid +4.0
        const cy = y0 + 38
        const xLo = plot.px(0.97)
        const xMid = plot.px(4.0)
        const xHi = plot.px(7.03)
        fig.line(xLo, cy, xHi, cy, { color: green, width: 3 })
        fig.line(xLo, cy - 7, xLo, cy + 7, { color: green, width: 2 })
        fig.line(xHi, cy - 7, xHi, cy + 7, { color: green, width: 2 })
        fig.circle(xMid, cy, 6, { fill: green, stroke: c.bg, width: 2 })
        fig.text(xMid, cy - 17, '+4.0 pp  [+1.0, +7.0]', {
            size: 12,
            weight: 700,
            color: green,
            align: 'center',
            mono: true,
        })

        fig.text(24, cy - 8, 'Resolution lift', { size: 14, weight: 700 })
        fig.text(24, cy + 10, 'Primary (superiority)', { size: 12, color: c.textSecondary })
        drawGateTag(cy, 'PASS', true)
    }

    // Row 2: Grounding Failure Delta (Non-inferiority guardrail) on [-1.0, +1.0] pp
    {
        const y0 = 162
        const h = 58
        const plot = fig.plot({ x: trackX, y: y0, width: trackW, height: h }, { x: [-1.0, 1.0], y: [0, 2] })
        // Shaded harm zone (>= +0.50 pp)
        fig.rect(plot.px(0.5), y0, plot.right - plot.px(0.5), h, {
            fill: tint(red, c.bg, isLight ? 0.13 : 0.2),
            radius: 4,
        })
        fig.line(trackX, y0 + h, trackX + trackW, y0 + h, { color: c.borderSubtle, width: 1 })
        for (const t of [-1.0, -0.5, 0, 0.5, 1.0]) {
            const px = plot.px(t)
            fig.line(px, y0 + h, px, y0 + h + 4, { color: c.textMuted, width: 1 })
            fig.text(px, y0 + h + 15, t === 0 ? '0' : t > 0 ? `+${t.toFixed(1)}` : t.toFixed(1), {
                size: 11,
                color: t === 0.5 ? red : c.textSecondary,
                align: 'center',
                mono: true,
            })
        }
        fig.line(plot.px(0), y0 + 22, plot.px(0), y0 + h, { color: c.textMuted, width: 1.25 })
        fig.line(plot.px(0.5), y0, plot.px(0.5), y0 + h, {
            color: red,
            width: 1.8,
            dash: '4 3',
        })
        fig.text(plot.px(0.5) + 6, y0 + 11, 'harm limit +0.50 pp', {
            size: 11,
            weight: 700,
            color: red,
        })

        // Whisker [-0.60, +0.70], mid +0.05
        const cy = y0 + 38
        const xLo = plot.px(-0.6)
        const xMid = plot.px(0.05)
        const xHi = plot.px(0.7)
        fig.line(xLo, cy, xHi, cy, { color: red, width: 3 })
        fig.line(xLo, cy - 7, xLo, cy + 7, { color: red, width: 2 })
        fig.line(xHi, cy - 7, xHi, cy + 7, { color: red, width: 2 })
        fig.circle(xMid, cy, 6, { fill: red, stroke: c.bg, width: 2 })
        fig.text(xMid - 10, cy - 22, '+0.05 pp  [-0.60, +0.70]', {
            size: 12,
            weight: 700,
            color: red,
            align: 'center',
            mono: true,
        })

        fig.text(24, cy - 8, 'Grounding fail', { size: 14, weight: 700, color: red })
        fig.text(24, cy + 10, '95% upper < +0.50 pp', { size: 12, color: c.textSecondary })
        drawGateTag(cy, 'HOLD', false)
    }

    // Row 3: p95 Latency Delta on [0, +200] ms
    {
        const y0 = 264
        const h = 44
        const plot = fig.plot({ x: trackX, y: y0, width: trackW, height: h }, { x: [0, 200], y: [0, 1] })
        fig.rect(plot.px(150), y0, plot.right - plot.px(150), h, {
            fill: tint(red, c.bg, isLight ? 0.1 : 0.16),
            radius: 4,
        })
        fig.line(trackX, y0 + h, trackX + trackW, y0 + h, { color: c.borderSubtle, width: 1 })
        for (const t of [0, 50, 100, 150, 200]) {
            const px = plot.px(t)
            fig.line(px, y0 + h, px, y0 + h + 4, { color: c.textMuted, width: 1 })
            fig.text(px, y0 + h + 14, t === 0 ? '0 ms' : `+${t}`, {
                size: 11,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        }
        fig.line(plot.px(150), y0, plot.px(150), y0 + h, { color: red, width: 1.5, dash: '4 3' })
        fig.text(plot.px(150) + 6, y0 + 11, 'max +150 ms', { size: 11, weight: 600, color: red })

        const cy = y0 + 24
        fig.rect(plot.px(0), cy - 8, plot.px(80) - plot.px(0), 16, {
            fill: tint(blue, c.bg, isLight ? 0.25 : 0.36),
            stroke: blue,
            strokeWidth: 1.4,
            radius: 4,
        })
        fig.text(plot.px(80) + 8, cy, '+80 ms (1,260 ms)', {
            size: 12,
            weight: 600,
            color: c.textPrimary,
            mono: true,
        })

        fig.text(24, cy - 7, 'p95 latency', { size: 14, weight: 700 })
        fig.text(24, cy + 10, 'Delta & absolute SLO', { size: 12, color: c.textSecondary })
        drawGateTag(cy, 'PASS', true)
    }

    // Row 4: Cost & Handoff compact paired guardrail strip
    {
        const y0 = 352
        const cy = y0 + 22
        fig.line(24, y0 - 8, 836, y0 - 8, { color: c.borderSubtle, width: 1 })
        fig.text(24, cy - 7, 'Cost & handoffs', { size: 14, weight: 700 })
        fig.text(24, cy + 10, 'Unit budget screens', { size: 12, color: c.textSecondary })

        // Cost mini bar
        const costX = trackX
        const costW = 248
        const costPlot = fig.plot({ x: costX, y: y0 + 8, width: costW, height: 28 }, { x: [0, 0.012], y: [0, 1] })
        fig.rect(costPlot.px(0.01), y0 + 8, costPlot.right - costPlot.px(0.01), 28, {
            fill: tint(red, c.bg, isLight ? 0.1 : 0.16),
            radius: 3,
        })
        fig.line(costPlot.px(0.01), y0 + 8, costPlot.px(0.01), y0 + 36, { color: red, width: 1.4, dash: '3 3' })
        fig.rect(costPlot.px(0), y0 + 15, costPlot.px(0.006) - costPlot.px(0), 14, {
            fill: tint(green, c.bg, isLight ? 0.25 : 0.36),
            stroke: green,
            strokeWidth: 1.3,
            radius: 3,
        })
        fig.text(costX, y0 + 50, 'Cost +$0.006 (limit <= $0.010)', {
            size: 12,
            weight: 600,
            color: c.textSecondary,
            mono: true,
        })

        // Handoff mini bar
        const handX = trackX + 292
        const handW = 256
        const handPlot = fig.plot({ x: handX, y: y0 + 8, width: handW, height: 28 }, { x: [-0.5, 0.7], y: [0, 1] })
        fig.rect(handPlot.px(0.5), y0 + 8, handPlot.right - handPlot.px(0.5), 28, {
            fill: tint(red, c.bg, isLight ? 0.1 : 0.16),
            radius: 3,
        })
        fig.line(handPlot.px(0), y0 + 8, handPlot.px(0), y0 + 36, { color: c.textMuted, width: 1.2 })
        fig.line(handPlot.px(0.5), y0 + 8, handPlot.px(0.5), y0 + 36, { color: red, width: 1.4, dash: '3 3' })
        fig.rect(handPlot.px(-0.2), y0 + 15, handPlot.px(0) - handPlot.px(-0.2), 14, {
            fill: tint(green, c.bg, isLight ? 0.25 : 0.36),
            stroke: green,
            strokeWidth: 1.3,
            radius: 3,
        })
        fig.text(handX, y0 + 50, 'Handoffs -0.20 pp (limit <= +0.50)', {
            size: 12,
            weight: 600,
            color: c.textSecondary,
            mono: true,
        })

        drawGateTag(cy, 'PASS', true)
    }

    return fig.render()
}

export default create
