import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 436
export const alt =
    'A calibrated 0 to 1 maximum document score scale divides into three CRAG routes at thresholds 0.2 and 0.7: 0.17 falls in Incorrect (below 0.2, discard internal passages), 0.45 falls in Ambiguous (0.2 to 0.7 inclusive, refine and merge), and 0.81 falls in Correct (above 0.7, keep refined internal strips). Both Incorrect and Ambiguous routes pass through an explicit external permission check before running public web fallback.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const blue = fig.tone('blue')

    // ── Top: Calibrated 0..1 Max Document Score Scale ────────────────────────
    fig.text(24, 18, 'CRAG Routing by Max Document Score', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.math(width - 24, 18, '\\delta_L = 0.2,\\;\\;\\delta_U = 0.7', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
    })

    const axisX = 32
    const axisW = width - 64 // 676px
    const xAt = (v: number) => axisX + v * axisW
    const barY = 92
    const barH = 34

    // Three contiguous zone bands
    fig.rect(axisX, barY, axisW * 0.2, barH, {
        fill: withColorAlpha(red, 0.2),
        stroke: red,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.rect(xAt(0.2) + 2, barY, axisW * 0.5 - 4, barH, {
        fill: withColorAlpha(warm, 0.18),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.rect(xAt(0.7) + 2, barY, axisW * 0.3 - 2, barH, {
        fill: withColorAlpha(green, 0.2),
        stroke: green,
        strokeWidth: 1.5,
        radius: 5,
    })

    // Zone labels centered inside each band
    fig.text(xAt(0.1), barY + barH / 2, 'INCORRECT', {
        size: 13,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.text(xAt(0.45), barY + barH / 2, 'AMBIGUOUS', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(xAt(0.85), barY + barH / 2, 'CORRECT', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Sample score pins dropping cleanly from above
    const pins = [
        { val: 0.17, color: red },
        { val: 0.45, color: warm },
        { val: 0.81, color: green },
    ] as const
    for (const p of pins) {
        const px = xAt(p.val)
        fig.text(px, 54, p.val.toFixed(2), {
            size: 15,
            mono: true,
            weight: 700,
            color: p.color,
            align: 'center',
        })
        fig.line(px, 68, px, barY, { color: p.color, width: 2.2 })
        fig.circle(px, barY, 4.5, { fill: p.color, stroke: c.bg, width: 1.4 })
    }

    // Threshold ticks below bar
    const ticks = [
        { v: 0, label: '0.0', color: c.textMuted, align: 'left' as const },
        { v: 0.2, label: '0.2', color: c.textPrimary, align: 'center' as const },
        { v: 0.7, label: '0.7', color: c.textPrimary, align: 'center' as const },
        { v: 1.0, label: '1.0', color: c.textMuted, align: 'right' as const },
    ] as const
    for (const t of ticks) {
        const tx = xAt(t.v)
        fig.line(tx, barY + barH, tx, barY + barH + 6, { color: c.textMuted, width: 1.25 })
        fig.text(tx, barY + barH + 18, t.label, {
            size: 13,
            mono: true,
            weight: t.v === 0.2 || t.v === 0.7 ? 700 : 500,
            color: t.color,
            align: t.align,
        })
    }

    // ── Middle: 3 Aligned Route Action Strips ────────────────────────────────
    const colY = 186
    const colH = 82
    const cols = [
        {
            x: 24,
            w: 214,
            anchorX: xAt(0.1),
            title: 'Incorrect (< 0.2)',
            line1: 'Discard internal passages',
            line2: 'Trigger external fallback',
            color: red,
        },
        {
            x: 263,
            w: 214,
            anchorX: xAt(0.45),
            title: 'Ambiguous (0.2–0.7)',
            line1: 'Refine internal strips',
            line2: 'Merge external evidence',
            color: warm,
        },
        {
            x: 502,
            w: 214,
            anchorX: xAt(0.85),
            title: 'Correct (> 0.7)',
            line1: 'Decompose & recompose',
            line2: 'Stay strictly internal',
            color: green,
        },
    ] as const

    for (const col of cols) {
        const cx = col.x + col.w / 2
        fig.arrow(col.anchorX, 160, cx, colY - 4, { color: col.color, width: 1.8, head: 7 })
        fig.rect(col.x, colY, col.w, colH, {
            fill: withColorAlpha(col.color, 0.09),
            stroke: withColorAlpha(col.color, 0.65),
            strokeWidth: 1.5,
            radius: 8,
        })
        fig.text(cx, colY + 20, col.title, {
            size: 14,
            weight: 700,
            color: col.color,
            align: 'center',
        })
        fig.text(cx, colY + 44, col.line1, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(cx, colY + 64, col.line2, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // ── Bottom: External Permission Branch (Incorrect & Ambiguous only) ──────
    const gateY = 334
    const gateH = 74
    const gateX = 24
    const gateW = 216

    // Arrows converging from Incorrect & Ambiguous into External Permission Check
    fig.arrow(131, colY + colH + 4, 131, gateY - 4, { color: red, width: 1.8, head: 7 })
    fig.path(
        `M370 ${colY + colH + 4}L370 ${colY + colH + 30}L175 ${colY + colH + 30}L175 ${gateY - 10}`,
        { color: warm, width: 1.8 },
    )
    fig.arrow(175, gateY - 16, 175, gateY - 4, { color: warm, width: 1.8, head: 7 })

    fig.rect(gateX, gateY, gateW, gateH, {
        fill: withColorAlpha(blue, 0.12),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(gateX + gateW / 2, gateY + 25, 'External Permission', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(gateX + gateW / 2, gateY + 49, 'Required before egress', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Two clean outcome branches: Permitted (top) and Denied (bottom)
    const branchX = 310
    const branchW = 406

    // Permitted branch
    fig.arrow(gateX + gateW + 4, gateY + 20, branchX - 4, gateY + 18, {
        color: green,
        width: 1.8,
        head: 7,
    })
    fig.rect(branchX, gateY, branchW, 33, {
        fill: withColorAlpha(green, 0.12),
        stroke: withColorAlpha(green, 0.65),
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(branchX + 12, gateY + 17, 'ALLOWED', {
        size: 12,
        mono: true,
        weight: 700,
        color: green,
    })
    fig.text(branchX + 94, gateY + 17, 'Query approved public web sources', {
        size: 13,
        color: c.textPrimary,
    })

    // Denied branch
    fig.arrow(gateX + gateW + 4, gateY + 54, branchX - 4, gateY + 56, {
        color: red,
        width: 1.8,
        head: 7,
    })
    fig.rect(branchX, gateY + 41, branchW, 33, {
        fill: tint(c.border, c.bg, 0.25),
        stroke: withColorAlpha(red, 0.6),
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(branchX + 12, gateY + 58, 'DENIED', {
        size: 12,
        mono: true,
        weight: 700,
        color: red,
    })
    fig.text(branchX + 94, gateY + 58, 'Keep query internal · report evidence gap', {
        size: 13,
        color: c.textPrimary,
    })

    return fig.render()
}

export default create('dark')
