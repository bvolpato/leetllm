import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'Raw logits for result (2.0), value (1.2), None (0.1), and banana (-2.0) map through softmax to positive probabilities 0.618, 0.278, 0.092, and 0.011 summing to 1.000.'

export const width = 780
export const height = 350

const TOKENS = [
    { label: 'result', logit: 2.0, prob: 0.618 },
    { label: 'value', logit: 1.2, prob: 0.278 },
    { label: 'None', logit: 0.1, prob: 0.092 },
    { label: 'banana', logit: -2.0, prob: 0.011 },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const critical = fig.tone('critical')
    const purple = fig.tone('purple')

    // Left: Diverging horizontal raw logit bars around z = 0
    fig.text(215, 22, 'Raw logits z ∈ (−∞, ∞)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    const leftX = 114
    const leftW = 222
    const zeroX = leftX + leftW / 2 // maps [-2.5, 2.5] -> [leftX, leftX + leftW]
    const mapZ = (z: number) => leftX + ((z + 2.75) / 5.5) * leftW

    // Axis ticks at bottom of left panel
    const rowTop = 64
    const rowStep = 56
    const axisY = rowTop + TOKENS.length * rowStep + 4

    for (const tick of [-2, -1, 0, 1, 2]) {
        const tx = mapZ(tick)
        fig.line(tx, rowTop - 10, tx, axisY, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.5 : 1,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(tx, axisY + 16, tick > 0 ? `+${tick}` : String(tick), {
            size: 12,
            color: c.textSecondary,
            mono: true,
            align: 'center',
        })
    }
    fig.line(leftX, axisY, leftX + leftW, axisY, { color: c.textMuted, width: 1 })
    fig.text(zeroX, axisY + 38, 'Order matches · unbounded & unnormalized', {
        size: 12,
        color: c.textMuted,
        align: 'center',
    })

    // Right: Aligned horizontal softmax probability bars on the exact same 4 rows
    const rightX = 456
    const rightW = 216
    const maxP = 0.7
    const mapP = (p: number) => rightX + (p / maxP) * rightW

    fig.text(rightX + rightW / 2, 22, 'Softmax probability P(token)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    for (const tick of [0, 0.2, 0.4, 0.6]) {
        const tx = mapP(tick)
        fig.line(tx, rowTop - 10, tx, axisY, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.5 : 1,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(tx, axisY + 16, tick.toFixed(1), {
            size: 12,
            color: c.textSecondary,
            mono: true,
            align: 'center',
        })
    }
    fig.line(rightX, axisY, rightX + rightW, axisY, { color: c.textMuted, width: 1 })
    fig.text(rightX + rightW / 2, axisY + 38, 'Positive · ∑ P = 1.000', {
        size: 12.5,
        weight: 600,
        color: purple,
        align: 'center',
    })

    // Draw rows across both panels
    TOKENS.forEach((tok, i) => {
        const cy = rowTop + i * rowStep + 22
        const col = tok.logit >= 0 ? blue : critical

        // Token label on far left
        fig.text(leftX - 14, cy, tok.label, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
            mono: true,
            align: 'right',
        })

        // Left diverging bar
        const zx = mapZ(tok.logit)
        const bx = Math.min(zeroX, zx)
        const bw = Math.max(4, Math.abs(zx - zeroX))
        fig.rect(bx, cy - 11, bw, 22, { fill: col, radius: 4 })
        fig.text(
            tok.logit >= 0 ? zx + 6 : zx - 6,
            cy,
            tok.logit > 0 ? `+${tok.logit.toFixed(1)}` : tok.logit.toFixed(1),
            {
                size: 12.5,
                weight: 700,
                color: col,
                mono: true,
                align: tok.logit >= 0 ? 'left' : 'right',
            },
        )

        // Subtle connecting hairline across the middle
        fig.line(leftX + leftW + 14, cy, rightX - 14, cy, {
            color: c.borderSubtle,
            width: 1,
            dash: '2 4',
            opacity: 0.7,
        })

        // Right probability bar
        const pw = Math.max(4, (tok.prob / maxP) * rightW)
        fig.rect(rightX, cy - 11, rightW, 22, {
            fill: tint(purple, c.bg, 0.08),
            radius: 4,
        })
        fig.rect(rightX, cy - 11, pw, 22, { fill: purple, radius: 4 })
        fig.text(rightX + pw + 8, cy, tok.prob.toFixed(3), {
            size: 13,
            weight: 700,
            color: purple,
            mono: true,
            align: 'left',
        })
    })

    // Center softmax transformation badge
    const midX = (leftX + leftW + rightX) / 2
    const midY = rowTop + 1.5 * rowStep + 22
    fig.rect(midX - 42, midY - 30, 84, 60, {
        fill: tint(purple, c.bg, theme === 'dark' ? 0.18 : 0.11),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 10,
    })
    fig.math(midX, midY - 4, String.raw`\frac{e^{z_i}}{\sum_j e^{z_j}}`, {
        size: 15,
        color: purple,
        align: 'center',
    })
    fig.arrow(midX - 40, midY + 42, midX + 40, midY + 42, {
        color: purple,
        width: 2.2,
        head: 7,
    })

    // Brace on right highlighting Δz = 0.8 -> 2.23× ratio between result and value
    fig.brace(
        rightX + rightW + 46,
        rowTop + 22,
        rightX + rightW + 46,
        rowTop + rowStep + 22,
        '2.23×',
        {
            side: -1,
            depth: 8,
            color: purple,
            labelColor: purple,
            labelSize: 13,
            weight: 700,
            labelGap: 10,
        },
    )
    fig.text(rightX + rightW + 76, rowTop + rowStep * 0.5 + 39, 'e⁰·⁸', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create()
