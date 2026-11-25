import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 500
export const alt =
    'Top: a five-by-twenty candidate pool grid shows 20 passing programs (highlighted in blue) among 100 generated candidates. Bottom: clean smooth curves on a 0 to 100 percent scale compare unbiased without-replacement pass@k (reaching 90.5 percent at k=10 and 99.3 percent at k=20) against the slightly lower plug-in estimator.'

const N = 100
const C_PASS = 20

function passAtK(k: number): number {
    let allFail = 1
    for (let i = 0; i < k; i++) allFail *= (N - C_PASS - i) / (N - i)
    return (1 - allFail) * 100
}

function pluginAtK(k: number): number {
    return (1 - (1 - C_PASS / N) ** k) * 100
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')

    // Top section: 5x20 candidate pool matrix (20 passing of 100)
    fig.text(64, 20, 'Observed candidate pool: 20 passing of 100 generated (n = 100, c = 20)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const gridX = 64
    const gridY = 44
    const cell = 18
    const gap = 4
    const cols = 20
    const rows = 5
    const passFill = tint(blue, c.bg, 0.45)
    const failFill = tint(c.textMuted, c.bg, 0.1)

    for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
            const isPass = r === 0
            fig.rect(gridX + col * (cell + gap), gridY + r * (cell + gap), cell, cell, {
                fill: isPass ? passFill : failFill,
                stroke: isPass ? blue : c.borderSubtle,
                strokeWidth: isPass ? 1.25 : 0.75,
                radius: 3,
            })
        }
    }

    // Side braces/labels on the pool grid
    const gridRight = gridX + cols * (cell + gap) - gap
    fig.text(gridRight + 16, gridY + cell / 2, '20 pass', {
        size: 13.5,
        weight: 700,
        color: blue,
    })
    fig.brace(
        gridRight + 10,
        gridY + (cell + gap),
        gridRight + 10,
        gridY + rows * (cell + gap) - gap,
        '80 fail',
        { side: -1, depth: 8, color: c.textMuted, labelColor: c.textSecondary, labelSize: 13.5 },
    )

    // Bottom section: Smooth pass@k curve on clean 0, 25, 50, 75, 100% scale
    const plot = fig.plot(
        { x: 64, y: 196, width: 660, height: 248 },
        { x: [0, 20.4], y: [0, 100] },
    )
    plot.axes({
        xTicks: [1, 5, 10, 15, 20],
        xFormat: (k) => `k=${k}`,
        yTicks: [0, 25, 50, 75, 100],
        yFormat: (v) => `${v}%`,
        xLabel: 'Sample budget k (draws without replacement)',
        yLabel: 'Probability of >= 1 pass (%)',
        grid: true,
        labelSize: 13.5,
    })

    const ks = Array.from({ length: 20 }, (_, i) => i + 1)
    const unbiasedPts = ks.map((k) => [k, passAtK(k)] as const)
    const pluginPts = ks.map((k) => [k, pluginAtK(k)] as const)

    plot.fillArea(unbiasedPts, { fill: blue, fillOpacity: 0.1, smooth: true })
    plot.smoothCurve(pluginPts, { color: warm, width: 2, dash: '6 4' })
    plot.smoothCurve(unbiasedPts, { color: blue, width: 2.5 })

    // Mark key k values on unbiased curve
    for (const k of [1, 5, 10, 15, 20]) {
        plot.point(k, passAtK(k), { color: blue, r: 4.5 })
    }

    // Callouts for exact lesson values (k=10: 90.5%, k=20: 99.3%)
    fig.callout(
        [plot.px(10), plot.py(passAtK(10)) + 6],
        [plot.px(11.6), plot.py(64)],
        'k = 10: 90.5% unbiased',
        { color: blue, size: 13.5, weight: 700, bend: 0.16, align: 'left' },
    )
    fig.callout(
        [plot.px(20) - 4, plot.py(passAtK(20)) + 6],
        [plot.px(16.8), plot.py(82)],
        'k = 20: 99.3%',
        { color: blue, size: 13.5, weight: 700, bend: -0.15, align: 'right' },
    )
    fig.text(plot.px(5) - 10, plot.py(passAtK(5)) - 14, '68.1%', {
        size: 13,
        weight: 600,
        color: blue,
        align: 'right',
        mono: true,
    })
    fig.text(plot.px(1) + 10, plot.py(passAtK(1)) + 2, '20.0%', {
        size: 13,
        weight: 600,
        color: blue,
        mono: true,
    })

    // Compact legend in open lower-right area
    const legX = plot.px(11.6)
    const legY = plot.py(34)
    fig.line(legX, legY, legX + 24, legY, { color: blue, width: 2.5 })
    fig.text(legX + 32, legY, 'Unbiased (without replacement)', {
        size: 13,
        weight: 600,
        color: blue,
    })
    fig.line(legX, legY + 24, legX + 24, legY + 24, { color: warm, width: 2, dash: '6 4' })
    fig.text(legX + 32, legY + 24, 'Plug-in 1 - (1 - c/n)^k (biased low)', {
        size: 13,
        weight: 600,
        color: warm,
    })

    return fig.render()
}

export default create('dark')
