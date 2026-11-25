import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 370
export const alt =
    'Dual-zoom FP8 E4M3 conversion boundary rulers. Left zoom magnifies 0 to the smallest E4M3 subnormal d = 2^-9: round-to-nearest-even maps tie midpoint 0.5d to signed zero (even) and 0.75d up to d. Right zoom spans 0 to 500 with S = 1: the finite E4M3 ceiling stops at 448, clamping unscaled input x = 500 to code q = 448 and reconstructing 448 without emitting NaN.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // --- Left Zoom: Subnormal RNE [0, d] ---
    fig.text(32, 22, 'Subnormal RNE boundary', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.math(248, 22, 'd = 2^{-9}', { size: 14, color: blue })

    const lLeft = 52
    const lRight = 342
    const lx = (t: number) => lLeft + t * (lRight - lLeft)
    const topRulerY = 124
    const botRulerY = 248

    // Subtle shaded rounding zones on top ruler
    fig.rect(lx(0), topRulerY - 11, lx(0.5) - lx(0), 22, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.14 : 0.2),
        radius: 4,
    })
    fig.rect(lx(0.5), topRulerY - 11, lx(1) - lx(0.5), 22, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.14 : 0.2),
        radius: 4,
    })

    // Top ruler (real input)
    fig.line(lLeft, topRulerY, lRight, topRulerY, { color: c.textMuted, width: 2 })
    fig.text(lLeft, topRulerY - 46, 'Real input', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
    })

    const subTicks = [
        { t: 0, label: '0', color: c.textPrimary },
        { t: 0.5, label: '0.5d', color: warm },
        { t: 0.75, label: '0.75d', color: blue },
        { t: 1, label: 'd', color: c.textPrimary },
    ]
    for (const st of subTicks) {
        const px = lx(st.t)
        fig.line(px, topRulerY - 10, px, topRulerY + 10, { color: st.color, width: 1.75 })
        fig.circle(px, topRulerY, st.t === 0.5 || st.t === 0.75 ? 5.5 : 4, {
            fill: st.color,
            stroke: c.bg,
            width: 1.75,
        })
        fig.text(px, topRulerY - 24, st.label, {
            size: 13,
            weight: 600,
            color: st.color,
            align: 'center',
            mono: true,
        })
    }

    // Bottom ruler (E4M3 output)
    fig.line(lLeft, botRulerY, lRight, botRulerY, { color: c.textMuted, width: 2 })
    fig.circle(lx(0), botRulerY, 5.5, { fill: warm, stroke: c.bg, width: 2 })
    fig.circle(lx(1), botRulerY, 5.5, { fill: green, stroke: c.bg, width: 2 })
    fig.text(lx(0), botRulerY + 24, '±0 (even)', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(lx(1), botRulerY + 24, 'd (odd)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    fig.text(lLeft, botRulerY + 52, 'RNE output: midpoint tie selects even code (±0)', {
        size: 12,
        color: c.textSecondary,
    })

    // Mapping arrows
    fig.arrow(lx(0.5) - 4, topRulerY + 14, lx(0) + 10, botRulerY - 12, {
        color: warm,
        width: 2,
        head: 6.5,
    })
    fig.text((lx(0.5) + lx(0)) / 2 - 36, (topRulerY + botRulerY) / 2 - 6, 'tie → ±0', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
    })

    fig.arrow(lx(0.75) + 4, topRulerY + 14, lx(1) - 8, botRulerY - 12, {
        color: blue,
        width: 2,
        head: 6.5,
    })
    fig.text((lx(0.75) + lx(1)) / 2 + 44, (topRulerY + botRulerY) / 2 - 4, 'round → d', {
        size: 12,
        weight: 600,
        color: blue,
        align: 'center',
    })

    // Vertical divider
    fig.line(386, 22, 386, 344, { color: c.borderSubtle, width: 1 })

    // --- Right Zoom: Saturation ceiling at 448 (S = 1) ---
    fig.text(412, 22, 'Finite ceiling saturation', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(728, 22, 'S = 1', {
        size: 14,
        weight: 600,
        color: warm,
        align: 'right',
        mono: true,
    })

    const rLeft = 424
    const rRight = 720
    const rx = (v: number) => rLeft + (v / 550) * (rRight - rLeft)
    const satY = 148

    // Finite range band [0, 448] vs saturated zone (448, 550]
    fig.rect(rx(0), satY - 12, rx(448) - rx(0), 24, {
        fill: tint(green, c.bg, theme === 'light' ? 0.14 : 0.2),
        radius: 4,
    })
    fig.rect(rx(448), satY - 12, rx(550) - rx(448), 24, {
        fill: tint(red, c.bg, theme === 'light' ? 0.18 : 0.26),
        radius: 4,
    })

    // Spine & ceiling wall
    fig.line(rLeft, satY, rRight, satY, { color: c.textMuted, width: 2 })
    fig.line(rx(0), satY - 10, rx(0), satY + 10, { color: c.textSecondary, width: 1.75 })
    fig.line(rx(448), satY - 26, rx(448), satY + 26, { color: red, width: 2.5 })

    fig.text(rx(0), satY + 26, '0', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    fig.text(rx(224), satY - 24, 'Finite E4M3 [0, 448]', {
        size: 12,
        weight: 600,
        color: green,
        align: 'center',
    })
    fig.text(rx(448), satY - 40, 'max = 448', {
        size: 13,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })

    // Point at x = 500 clamping back to 448
    fig.circle(rx(500), satY, 5.5, { fill: warm, stroke: c.bg, width: 2 })
    fig.circle(rx(448), satY, 5.5, { fill: red, stroke: c.bg, width: 2 })
    fig.text(rx(500), satY + 28, 'x = 500', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Curved clamp arrow 500 -> 448
    fig.path(
        `M${rx(500).toFixed(1)} ${(satY - 8).toFixed(1)} Q${rx(476).toFixed(1)} ${(satY - 34).toFixed(1)}, ${(rx(448) + 6).toFixed(1)} ${(satY - 10).toFixed(1)}`,
        { color: warm, width: 2 },
    )
    fig.arrow(rx(460), satY - 19, rx(448) + 4, satY - 8, { color: warm, width: 2, head: 6 })

    // Compact reconstruction trace below
    const traceY = 252
    const traceBox = (x: number, w: number, top: string, bot: string, tone: string) => {
        fig.rect(x, traceY - 22, w, 46, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.14 : 0.24),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(x + w / 2, traceY - 6, top, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
        fig.text(x + w / 2, traceY + 12, bot, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
    }
    traceBox(420, 82, 'Input', '500', warm)
    fig.arrow(504, traceY, 526, traceY, { color: c.textMuted, width: 1.6, head: 5.5 })
    traceBox(528, 86, 'E4M3 code', '448', red)
    fig.arrow(616, traceY, 638, traceY, { color: c.textMuted, width: 1.6, head: 5.5 })
    traceBox(640, 84, 'Restored', '448', red)

    fig.text(572, 304, 'Clamps to finite max 448 (error −52, no NaN)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create
