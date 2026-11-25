import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 478
export const alt =
    'Both lanes use posterior mu = [0.400, -0.200] and sigma approximately [0.705, 1.051]. Top lane: Normal.sample draws z directly, so the red reconstruction gradient stops at a blocked barrier before mu and sigma. Bottom lane: Normal.rsample pulls external noise epsilon ~ N(0, I) into deterministic z = mu + sigma * epsilon, letting the green reconstruction gradient flow uninterrupted back to mu and sigma. Analytic KL gradients reach the encoder in both lanes.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const cyan = fig.tone('cyan')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    const node = (
        cx: number,
        cy: number,
        w: number,
        h: number,
        label: string,
        stroke: string,
        textColor: string,
        dashed = false,
        mono = false,
    ) => {
        fig.rect(cx - w / 2, cy - h / 2, w, h, {
            fill: tint(stroke, c.bg, isLight ? 0.1 : 0.17),
            stroke,
            strokeWidth: dashed ? 1.8 : 1.7,
            radius: 11,
        })
        if (dashed) {
            // Subtle inner dashed emphasis border
            fig.path(
                `M${cx - w / 2 + 3} ${cy - h / 2 + 3} H${cx + w / 2 - 3} V${cy + h / 2 - 3} H${cx - w / 2 + 3} Z`,
                { color: stroke, width: 1.2, dash: '5 4', opacity: 0.7 },
            )
        }
        fig.text(cx, cy, label, {
            size: 18,
            mono,
            weight: 700,
            color: textColor,
            align: 'center',
            width: w - 8,
        })
    }

    // ── Header with worked parameter values ─────────────────────────────────
    fig.text(22, 22, 'Sampling controls the reconstruction gradient path', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })
    fig.text(22, 50, 'μ=[0.40, −0.20] · σ≈[0.71, 1.05] · ε=[0.50, −1.00] → z≈[0.75, −1.25]', {
        size: 16,
        mono: true,
        color: c.textSecondary,
        weight: 600,
    })

    // Shared x positions for the 4 forward stages
    const xEnc = 104
    const xDraw = 318
    const xDec = 528
    const xLoss = 708

    // ── Lane 1: sample() (blocked gradient) ─────────────────────────────────
    const y1 = 132
    fig.text(22, 86, '1. Normal.sample(): stochastic node blocks backprop', {
        size: 18,
        weight: 700,
        color: red,
    })

    node(xEnc, y1, 118, 44, 'μ, σ', purple, purple, false, true)
    node(xDraw, y1, 146, 44, 'sample() → z', red, red, true)
    node(xDec, y1, 130, 44, 'Decoder', blue, blue)
    node(xLoss, y1, 134, 44, 'Recon loss', amberMark, amberText)

    // Forward arrows
    fig.arrow(xEnc + 61, y1, xDraw - 75, y1, { color: c.textMuted, width: 2.2, head: 6.5 })
    fig.arrow(xDraw + 75, y1, xDec - 67, y1, { color: c.textMuted, width: 2.2, head: 6.5 })
    fig.arrow(xDec + 67, y1, xLoss - 69, y1, { color: c.textMuted, width: 2.2, head: 6.5 })

    // Analytic KL gradient loop on left
    fig.rect(xEnc - 56, y1 + 48, 112, 32, {
        fill: tint(purple, c.bg, isLight ? 0.1 : 0.16),
        stroke: purple,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(xEnc, y1 + 64, 'KL loss', { size: 16, weight: 700, color: purple, align: 'center' })
    fig.arrow(xEnc, y1 + 46, xEnc, y1 + 24, { color: purple, width: 2.2, head: 6 })

    // Blocked red backward gradient arrow stopping at barrier
    const y1Grad = y1 + 58
    const barrierX = 240
    fig.arrow(xLoss, y1Grad, barrierX + 6, y1Grad, {
        color: red,
        width: 2.8,
        dash: '6 4',
        head: 7,
    })
    // Bold vertical red barrier bar
    fig.line(barrierX, y1Grad - 16, barrierX, y1Grad + 16, { color: red, width: 4 })
    fig.text(barrierX + 20, y1Grad + 24, 'Gradient stops at sample(), never reaches μ, σ', {
        size: 16,
        weight: 700,
        color: red,
    })

    // Divider
    fig.line(22, 240, width - 22, 240, { color: c.borderSubtle, width: 1.25 })

    // ── Lane 2: rsample() with explicit external noise node ─────────────────
    const y2 = 358
    fig.text(22, 268, '2. Normal.rsample(): external ε keeps path open', {
        size: 18,
        weight: 700,
        color: green,
    })

    // Explicit external noise node feeding from above into z = mu + sigma * eps
    const yEps = 294
    fig.rect(xDraw - 68, yEps - 18, 136, 36, {
        fill: tint(cyan, c.bg, isLight ? 0.12 : 0.18),
        stroke: cyan,
        strokeWidth: 1.6,
        radius: 18,
    })
    fig.text(xDraw, yEps, 'ε ~ N(0, I)', {
        size: 17,
        mono: true,
        weight: 750,
        color: cyan,
        align: 'center',
    })
    fig.arrow(xDraw, yEps + 20, xDraw, y2 - 24, { color: cyan, width: 2.2, head: 6 })
    fig.text(xDraw + 12, (yEps + y2) / 2 - 4, 'fixed draw', {
        size: 15,
        color: cyan,
        weight: 600,
    })

    node(xEnc, y2, 118, 44, 'μ, σ', purple, purple, false, true)
    node(xDraw, y2, 152, 44, 'z = μ + σ ⊙ ε', green, green, false, true)
    node(xDec, y2, 130, 44, 'Decoder', blue, blue)
    node(xLoss, y2, 134, 44, 'Recon loss', amberMark, amberText)

    // Forward arrows
    fig.arrow(xEnc + 61, y2, xDraw - 78, y2, { color: c.textMuted, width: 2.2, head: 6.5 })
    fig.arrow(xDraw + 78, y2, xDec - 67, y2, { color: c.textMuted, width: 2.2, head: 6.5 })
    fig.arrow(xDec + 67, y2, xLoss - 69, y2, { color: c.textMuted, width: 2.2, head: 6.5 })

    // Analytic KL loop on left
    fig.rect(xEnc - 56, y2 + 48, 112, 32, {
        fill: tint(purple, c.bg, isLight ? 0.1 : 0.16),
        stroke: purple,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(xEnc, y2 + 64, 'KL loss', { size: 16, weight: 700, color: purple, align: 'center' })
    fig.arrow(xEnc, y2 + 46, xEnc, y2 + 24, { color: purple, width: 2.2, head: 6 })

    // Flowing green backward gradient curving all the way into [μ, σ]
    const y2Grad = y2 + 58
    fig.path(
        `M${xLoss} ${y2Grad} H${xEnc + 84} Q${xEnc + 64} ${y2Grad} ${xEnc + 64} ${y2 + 34} V${y2 + 24}`,
        { color: green, width: 3.4 },
    )
    // Upward arrowhead landing right on bottom-right of [μ, σ]
    fig.path(
        `M${xEnc + 64} ${y2 + 18} L${xEnc + 59} ${y2 + 28} L${xEnc + 69} ${y2 + 28} Z`,
        { fill: green },
    )
    fig.text(448, y2Grad + 24, '∂z/∂μ = 1,  ∂z/∂σ = ε  (reconstruction flows back to μ, σ)', {
        size: 16,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
        width: 560,
    })

    return fig.render()
}

export default create('dark')
