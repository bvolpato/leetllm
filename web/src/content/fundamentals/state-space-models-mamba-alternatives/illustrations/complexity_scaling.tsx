import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Per-request cache memory across 128 to 64K context tokens on a log-spaced context axis: 32-layer attention KV cache climbs linearly to 32 GiB and a 4-attention plus 28-SSM hybrid reaches 4.004 GiB, while a pure 32-layer SSM stays constant at 5 MiB across all context lengths (shown in the zoomed 0 to 10 MiB inset).'

const lengths = [128, 512, 2048, 8192, 65536] as const
const attnGiB = [0.0625, 0.25, 1.0, 4.0, 32.0] as const
const hybridGiB = [0.012, 0.036, 0.129, 0.504, 4.004] as const
const ssmGiB = [0.005, 0.005, 0.005, 0.005, 0.005] as const

const fmtLen = (v: number) => (v >= 1024 ? `${Math.round(v / 1024)}K` : String(v))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const red = fig.tone('red')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    // Left main plot: true log-spaced context length (128 .. 64K) vs GiB (0 .. 32)
    fig.text(62, 20, 'Per-request cache memory (GiB)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const mainPlot = fig.plot(
        { x: 62, y: 46, width: 390, height: 280 },
        { x: [128, 65536], y: [0, 34], xScale: 'log', yScale: 'linear' },
    )
    mainPlot.axes({
        xTicks: [128, 512, 2048, 8192, 32768, 65536],
        yTicks: [0, 8, 16, 24, 32],
        xFormat: fmtLen,
        yFormat: (v) => `${v}`,
        xLabel: 'Context length L (tokens, log scale)',
        grid: true,
        labelSize: 12.5,
    })

    // Smooth analytic curves (linear in L, plotted on log-x axis)
    mainPlot.fillArea((L) => (L / 65536) * 32.0, {
        fill: red,
        fillOpacity: isLight ? 0.1 : 0.16,
        stroke: { color: red, width: 2.5 },
        samples: 140,
    })
    mainPlot.fn((L) => (L / 65536) * 4.0 + 0.004, { color: warm, width: 2.4 }, 140)
    mainPlot.fn(() => 0.005, { color: green, width: 2.5 }, 40)

    lengths.forEach((L, i) => {
        mainPlot.point(L, attnGiB[i]!, { color: red, r: 3.8 })
        mainPlot.point(L, hybridGiB[i]!, { color: warm, r: 3.5 })
        mainPlot.point(L, ssmGiB[i]!, { color: green, r: 3.2 })
    })

    // Direct curve labels inside/beside plot
    fig.callout([mainPlot.px(32768), mainPlot.py(16)], [mainPlot.px(4096), mainPlot.py(23)], '32L Attn KV: 32 GiB @ 64K', {
        color: red,
        size: 13,
        weight: 700,
        bend: -0.15,
        align: 'right',
    })
    fig.callout([mainPlot.px(45000), mainPlot.py(2.9)], [mainPlot.px(12000), mainPlot.py(11.5)], 'Hybrid (4 Attn + 28 SSM): 4.0 GiB', {
        color: warm,
        size: 13,
        weight: 700,
        bend: -0.15,
        align: 'right',
    })

    // Right zoom inset: 32-layer SSM constant 5 MiB state (0 .. 10 MiB)
    const zoomX = 526
    fig.text(zoomX, 20, 'SSM state zoom (MiB)', {
        size: 14.5,
        weight: 700,
        color: green,
    })

    const zoomPlot = fig.plot(
        { x: zoomX, y: 46, width: 206, height: 280 },
        { x: [0, 5], y: [0, 10] },
    )
    zoomPlot.axes({
        xTicks: [],
        yTicks: [0, 2, 4, 6, 8, 10],
        yFormat: (v) => `${v}`,
        xLabel: 'Context length L',
        grid: true,
        labelSize: 12.5,
    })

    zoomPlot.hline(5, '5 MiB constant O(1)', {
        color: green,
        dash: '4 4',
        labelPosition: 'left',
        labelSize: 12.5,
        labelOffset: 12,
        weight: 700,
    })

    const barW = 26
    lengths.forEach((L, i) => {
        const cx = zoomPlot.px(i + 0.5)
        const topY = zoomPlot.py(5)
        const barH = zoomPlot.bottom - topY
        fig.rect(cx - barW / 2, topY, barW, barH, {
            fill: tint(green, c.bg, isLight ? 0.24 : 0.36),
            stroke: green,
            strokeWidth: 1.4,
            radius: 4,
        })
        fig.text(cx, zoomPlot.bottom + 15, fmtLen(L), {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    // Dashed zoom leader from green flat line on left plot to green zoom panel
    fig.arrow(mainPlot.px(65536) + 8, mainPlot.py(0.005), zoomX - 36, zoomPlot.py(5), {
        color: green,
        width: 1.4,
        dash: '4 3',
        head: 6,
    })

    return fig.render()
}

export default create('dark')
