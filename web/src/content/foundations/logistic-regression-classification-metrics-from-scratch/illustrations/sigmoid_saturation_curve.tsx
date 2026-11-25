import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 430
export const alt =
    'Aligned sigmoid curve sigma(z) above its derivative sigma\'(z) across logits z from -6 to +6. Shaded intervals highlight how an equal two-unit logit step produces a large probability shift of Delta p = 0.462 near the center (-1 to +1, where slope peaks at 0.25) versus only Delta p = 0.016 in the saturated positive tail (+4 to +6).'

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
const slope = (z: number) => {
    const p = sigmoid(z)
    return p * (1 - p)
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // Top plot: Sigmoid probability curve sigma(z)
    fig.text(70, 20, 'Probability σ(z) = 1 / (1 + e⁻ᶻ)', { size: 14, weight: 700, color: blue })

    const top = fig.plot(
        { x: 70, y: 42, width: 734, height: 196 },
        { x: [-6, 6], y: [-0.03, 1.06] },
    )

    // Shaded vertical comparison bands: [-1, 1] (active center) vs [4, 6] (saturated tail)
    fig.rect(top.px(-1), top.area.y, top.px(1) - top.px(-1), top.area.height, {
        fill: tint(green, c.bg, isLight ? 0.12 : 0.16),
    })
    fig.rect(top.px(4), top.area.y, top.px(6) - top.px(4), top.area.height, {
        fill: tint(warm, c.bg, isLight ? 0.12 : 0.16),
    })

    top.axes({
        xTicks: [-6, -4, -2, 0, 2, 4, 6],
        xFormat: () => '',
        yTicks: [0, 0.5, 1.0],
        yFormat: (v) => v.toFixed(1),
        grid: true,
        labelSize: 12,
    })

    // Draw 0.5 midline up to z = 1.55 so it stays completely clear of the Δp = 0.462 bracket label
    fig.line(top.px(-6), top.py(0.5), top.px(1.55), top.py(0.5), {
        color: c.textMuted,
        dash: '4 4',
        width: 1.2,
    })
    top.vline(0, undefined, { color: c.textMuted, dash: '4 4', width: 1.2 })
    top.fn(sigmoid, { color: blue, width: 2.8 }, 200)

    // Mark [-1, 1] probability rise Δp = 0.462 directly on the curve with a crisp bracket!
    const pM1 = sigmoid(-1)
    const pP1 = sigmoid(1)
    top.point(-1, pM1, { color: green, r: 5 })
    top.point(0, 0.5, { color: blue, r: 4.5, ring: true })
    top.point(1, pP1, { color: green, r: 5 })

    // Dashed horizontal projection guides for σ(-1) and σ(1) into right bracket
    fig.line(top.px(-1), top.py(pM1), top.px(1.55), top.py(pM1), {
        color: green,
        width: 1.2,
        dash: '3 3',
    })
    fig.line(top.px(1), top.py(pP1), top.px(1.55), top.py(pP1), {
        color: green,
        width: 1.2,
        dash: '3 3',
    })
    fig.brace(top.px(1.6), top.py(pP1), top.px(1.6), top.py(pM1), 'Δp = 0.462  (z: −1 → +1)', {
        side: -1,
        depth: 8,
        labelGap: 10,
        color: green,
        labelColor: green,
        labelSize: 13,
        weight: 700,
    })

    // Mark [4, 6] tiny shift Δp = 0.016 cleanly below the saturated tail with zero overlap
    const p4 = sigmoid(4)
    const p6 = sigmoid(6)
    top.point(4, p4, { color: warm, r: 5 })
    top.point(6, p6, { color: warm, r: 5 })
    fig.arrow(top.px(5), top.py(0.75), top.px(5), top.py(sigmoid(5)) + 7, {
        color: warm,
        width: 1.5,
        head: 6,
    })
    fig.text(top.px(4.95), top.py(0.65), 'Δp = 0.016  (z: 4 → 6)', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Bottom plot: Derivative curve σ'(z) = p(1 - p) on exact same x-axis
    fig.text(70, 268, 'Slope σ′(z) = p(1 − p)', { size: 14, weight: 700, color: green })

    const bot = fig.plot(
        { x: 70, y: 288, width: 734, height: 96 },
        { x: [-6, 6], y: [0, 0.28] },
    )

    // Area under derivative curve for [-1, 1] and [4, 6] (= exact probability integrals!)
    bot.fillArea(slope, {
        range: [-1, 1],
        fill: green,
        fillOpacity: isLight ? 0.28 : 0.36,
        samples: 60,
    })
    bot.fillArea(slope, {
        range: [4, 6],
        fill: warm,
        fillOpacity: isLight ? 0.32 : 0.42,
        samples: 40,
    })

    bot.axes({
        xTicks: [-6, -4, -2, 0, 2, 4, 6],
        yTicks: [0, 0.125, 0.25],
        yFormat: (v) => (v === 0 ? '0' : v === 0.25 ? '0.25' : ''),
        xLabel: 'Logit z = w₀ + w₁x₁ + w₂x₂',
        grid: true,
        labelSize: 12,
    })

    bot.vline(0, undefined, { color: c.textMuted, dash: '4 4', width: 1.2 })
    bot.fn(slope, { color: green, width: 2.6 }, 200)
    bot.point(0, 0.25, { color: green, r: 5.5 })

    fig.callout(
        [bot.px(0) + 6, bot.py(0.25)],
        [bot.px(2.1), bot.py(0.22)],
        'Peak slope = 0.25 at z = 0',
        {
            color: green,
            labelColor: green,
            align: 'left',
            size: 12,
            weight: 700,
            bend: -0.12,
        },
    )
    fig.text(bot.px(5), bot.py(0.08), 'flat tail (≈ 0)', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
    })

    return fig.render()
}

export default create
