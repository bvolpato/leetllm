import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 385
export const alt =
    'Exact fair-coin sign-test null distributions comparing d = 1 disagreement against d = 16 disagreements. Left: with 1 disagreement, 0 and 1 B wins each have probability 0.500, giving one-sided p = 0.500. Right: with 16 disagreements, the binomial distribution peaks at 8 wins (0.196), and the highlighted right tail from 13 to 16 wins sums to exact p = 0.0106.'

function binomHalf(n: number, k: number): number {
    let coeff = 1
    for (let i = 1; i <= k; i += 1) {
        coeff = (coeff * (n - i + 1)) / i
    }
    return coeff / 2 ** n
}

const BINOM16 = Array.from({ length: 17 }, (_, k) => ({ k, p: binomHalf(16, k) }))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // Left: d = 1 disagreement
    fig.text(54, 24, 'd = 1 disagreement', { size: 15, weight: 700 })
    fig.text(54, 44, 'H₀: Binomial(1, 0.5)', { size: 12, color: c.textSecondary, mono: true })

    const leftPlot = fig.plot(
        { x: 64, y: 74, width: 204, height: 232 },
        { x: [-0.6, 1.6], y: [0, 0.62] },
    )
    leftPlot.axes({
        yTicks: [0.2, 0.4, 0.6],
        yFormat: (v) => v.toFixed(1),
        xLabel: 'Model B wins',
        grid: true,
        labelSize: 12,
    })

    const leftBars = [
        { k: 0, p: 0.5, hl: false },
        { k: 1, p: 0.5, hl: true },
    ]
    for (const b of leftBars) {
        const cx = leftPlot.px(b.k)
        const yTop = leftPlot.py(b.p)
        const yBot = leftPlot.py(0)
        const tone = b.hl ? warm : blue
        fig.rect(cx - 28, yTop, 56, yBot - yTop, {
            fill: tint(tone, c.bg, b.hl ? (isLight ? 0.28 : 0.4) : isLight ? 0.16 : 0.24),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(cx, yTop - 14, '0.50', {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
        fig.text(cx, leftPlot.bottom + 15, `${b.k}`, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(166, 360, 'P(B >= 1) = 0.500 (coin flip)', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Divider
    fig.line(302, 28, 302, 362, { color: c.borderSubtle, width: 1 })

    // Right: d = 16 disagreements
    fig.text(356, 24, 'd = 16 disagreements', { size: 15, weight: 700 })
    fig.text(356, 44, 'H₀: Binomial(16, 0.5)', { size: 12, color: c.textSecondary, mono: true })

    // Offset x-domain to [-0.8, 16.8] and omit 0 on yTicks so 0/0 corner never touches!
    const rightPlot = fig.plot(
        { x: 374, y: 74, width: 438, height: 232 },
        { x: [-0.8, 16.8], y: [0, 0.22] },
    )
    rightPlot.axes({
        xTicks: [0, 4, 8, 12, 16],
        yTicks: [0.05, 0.1, 0.15, 0.2],
        yFormat: (v) => v.toFixed(2),
        xLabel: 'Model B wins (out of 16 discordant tasks)',
        grid: true,
        labelSize: 12,
    })

    // Highlighted right-tail shaded background for k >= 13
    const tailX = rightPlot.px(12.5)
    fig.rect(tailX, rightPlot.area.y, rightPlot.right - tailX, rightPlot.area.height, {
        fill: tint(warm, c.bg, isLight ? 0.1 : 0.16),
        radius: 4,
    })
    fig.line(tailX, rightPlot.area.y, tailX, rightPlot.bottom, {
        color: warm,
        width: 1.6,
        dash: '4 3',
    })

    const bw = 17
    for (const pt of BINOM16) {
        const cx = rightPlot.px(pt.k)
        const yTop = rightPlot.py(pt.p)
        const yBot = rightPlot.py(0)
        const inTail = pt.k >= 13
        const tone = inTail ? warm : blue
        fig.rect(cx - bw / 2, yTop, bw, Math.max(1.5, yBot - yTop), {
            fill: tint(tone, c.bg, inTail ? (isLight ? 0.34 : 0.48) : isLight ? 0.22 : 0.34),
            stroke: tone,
            strokeWidth: inTail ? 1.5 : 1.1,
            radius: 2.5,
        })
    }

    // Peak label at k = 8
    fig.text(rightPlot.px(8), rightPlot.py(0.1964) - 14, 'peak k = 8 (0.196)', {
        size: 12,
        weight: 600,
        color: blue,
        align: 'center',
        mono: true,
    })

    // Clean callout for right-tail mass 13..16 (well clear of k = 12.5 line and arrow)
    fig.callout(
        [rightPlot.px(13.5), rightPlot.py(0.016)],
        [rightPlot.px(13.0), rightPlot.py(0.125)],
        'Tail k = 13..16',
        {
            color: warm,
            labelColor: warm,
            align: 'left',
            size: 12,
            weight: 700,
            bend: 0.14,
        },
    )
    fig.text(rightPlot.px(13.0) + 6, rightPlot.py(0.125) + 16, 'p = 0.0106', {
        size: 13,
        weight: 700,
        color: warm,
        mono: true,
    })

    fig.text(593, 360, 'Exact right tail (13..16): P(B >= 13) = 0.0106', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create
