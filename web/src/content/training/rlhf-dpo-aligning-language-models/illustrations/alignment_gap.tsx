import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 350
export const alt =
    'A single softmax overflow prompt branches into two answers: A (chosen) subtracts max(z) before exp(z) with score 1.80, and B (rejected) casts after exp(z) with score 0.70. On the right, a shared score axis marks the 1.10 reward margin mapping through Bradley-Terry to P(A preferred over B) = sigma(1.10) approximately 0.750.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    // Left: Prompt box
    const px = 20
    const py = 114
    const pw = 178
    const ph = 92
    fig.rect(px, py, pw, ph, {
        fill: tint(blue, c.bg, 0.12),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(px + 12, py + 22, 'Shared prompt', { size: 13, weight: 700, color: blue })
    fig.text(px + 12, py + 48, '“Prevent overflow in', { size: 13, weight: 600 })
    fig.text(px + 12, py + 68, 'Python softmax(z)?”', { size: 13, weight: 600 })

    // Middle: Two candidate responses
    const cx = 248
    const cw = 218
    const ch = 82
    const topY = 44
    const botY = 194

    // Arrows from prompt to A and B
    fig.arrow(px + pw + 2, py + 30, cx - 4, topY + ch / 2, {
        color: green,
        width: 2,
        head: 7,
    })
    fig.arrow(px + pw + 2, py + 62, cx - 4, botY + ch / 2, {
        color: red,
        width: 2,
        head: 7,
    })

    // Candidate A (Chosen)
    fig.rect(cx, topY, cw, ch, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(cx + 12, topY + 20, 'A · Chosen', { size: 13, weight: 700, color: green })
    fig.text(cx + 12, topY + 43, 'Subtract max(z)', { size: 15, weight: 700 })
    fig.text(cx + 12, topY + 64, 'before calling exp(z)', { size: 13, color: muted })

    // Candidate B (Rejected)
    fig.rect(cx, botY, cw, ch, {
        fill: tint(red, c.bg, 0.12),
        stroke: red,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(cx + 12, botY + 20, 'B · Rejected', { size: 13, weight: 700, color: red })
    fig.text(cx + 12, botY + 43, 'Cast after exp(z)', { size: 15, weight: 700 })
    fig.text(cx + 12, botY + 64, 'still overflows float32', { size: 13, color: muted })

    // Right: Vertical reward scale (0.0 to 2.2) showing margin Δr = 1.10
    const scaleX = 548
    const sTop = 44
    const sBot = 266
    const sy = (r: number) => sBot - ((r - 0) / 2.2) * (sBot - sTop)

    fig.text(scaleX, 22, 'Reward score r', { size: 13, weight: 700, color: muted, align: 'center' })
    fig.line(scaleX, sTop, scaleX, sBot, { color: c.textMuted, width: 1.5 })
    ;[0, 0.5, 1.0, 1.5, 2.0].forEach((tick) => {
        const ty = sy(tick)
        fig.line(scaleX - 5, ty, scaleX, ty, { color: c.textMuted, width: 1.2 })
        fig.text(scaleX - 10, ty, tick.toFixed(1), {
            size: 12,
            mono: true,
            color: muted,
            align: 'right',
        })
    })

    const yA = sy(1.8)
    const yB = sy(0.7)

    // Connectors from cards to score dots
    fig.arrow(cx + cw + 2, topY + ch / 2, scaleX - 36, yA, {
        color: green,
        width: 1.6,
        head: 6,
        dash: '4 3',
    })
    fig.arrow(cx + cw + 2, botY + ch / 2, scaleX - 36, yB, {
        color: red,
        width: 1.6,
        head: 6,
        dash: '4 3',
    })

    // Margin segment & dots
    fig.line(scaleX, yA, scaleX, yB, { color: purple, width: 4.5 })
    fig.circle(scaleX, yA, 6.5, { fill: green, stroke: c.bg, width: 1.5 })
    fig.circle(scaleX, yB, 6.5, { fill: red, stroke: c.bg, width: 1.5 })

    fig.text(scaleX + 14, yA, 'r(A) = 1.80', { size: 14, mono: true, weight: 700, color: green })
    fig.text(scaleX + 14, yB, 'r(B) = 0.70', { size: 14, mono: true, weight: 700, color: red })

    // Curly brace on margin
    fig.brace(scaleX + 12, yA + 8, scaleX + 12, yB - 8, String.raw`\Delta r = 1.10`, {
        color: purple,
        labelColor: purple,
        depth: 10,
        side: -1,
        tex: true,
        labelSize: 15,
        labelGap: 14,
    })

    // Bottom Bradley-Terry equation
    fig.line(20, 294, width - 20, 294, { color: c.borderSubtle, width: 1 })
    fig.math(
        width / 2,
        324,
        String.raw`P(A \succ B) = \sigma(1.80 - 0.70) = \sigma(1.10) \approx 0.750`,
        { size: 17, color: c.textPrimary, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
