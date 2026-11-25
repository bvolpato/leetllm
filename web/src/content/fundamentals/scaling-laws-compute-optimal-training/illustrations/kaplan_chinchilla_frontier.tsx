import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 400
export const alt =
    'Left: log-log plot comparing fitted allocation growth exponents across a 100-fold compute increase: Kaplan parameters grow with slope 0.73 to 28.84x, Chinchilla parameters and tokens both grow with slope 0.50 to 10x, and Kaplan tokens grow with slope 0.27 to 3.47x. Right: horizontal bar chart comparing historical token-to-parameter ratios (D/N) on a shared scale: GPT-3 at 1.7:1, Chinchilla at 20:1, and Llama 3 405B at 38.5:1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    // Left: log-log growth exponents plot
    const left = fig.plot(
        { x: 66, y: 46, width: 292, height: 282 },
        { x: [1, 240], y: [1, 120], xScale: 'log', yScale: 'log' },
    )

    left.logAxes({
        xTicks: [1, 10, 100],
        yTicks: [1, 10, 100],
        xFormat: (v) => `${v}×`,
        yFormat: (v) => `${v}×`,
        xLabel: 'Compute multiplier C',
        yLabel: 'Allocation multiplier',
        labelSize: 14,
        grid: true,
    })

    // Reference dashed vertical at C = 100x
    left.vline(100, undefined, { color: c.borderLight, width: 1.2, dash: '4 4' })

    const series = [
        { name: 'Kaplan N (0.73)', val: '28.8×', slope: 0.73, color: warm, dy: -16 },
        { name: 'Chinchilla N,D (0.50)', val: '10×', slope: 0.5, color: blue, dy: -14 },
        { name: 'Kaplan D (0.27)', val: '3.47×', slope: 0.27, color: purple, dy: 16 },
    ]

    for (const s of series) {
        const endY = 100 ** s.slope
        left.curve(
            [
                [1, 1],
                [100, endY],
            ],
            { color: s.color, width: 2.75 },
        )
        fig.circle(left.px(100), left.py(endY), 6, { fill: s.color, stroke: c.bg, width: 2 })
        fig.text(left.px(100) + 10, left.py(endY), s.val, {
            size: 13.5,
            color: s.color,
            weight: 700,
            mono: true,
        })
    }

    // Clean direct key in open upper-left space (zero crossings with any log-log slope line)
    const keyItems = [
        { label: 'Kaplan N (0.73)', color: warm, y: left.area.y + 16 },
        { label: 'Chinchilla N, D (0.50)', color: blue, y: left.area.y + 38 },
        { label: 'Kaplan D (0.27)', color: purple, y: left.area.y + 60 },
    ]
    const kx = left.area.x + 12
    for (const k of keyItems) {
        fig.line(kx, k.y, kx + 18, k.y, { color: k.color, width: 2.75 })
        fig.text(kx + 24, k.y, k.label, {
            size: 13.5,
            color: k.color,
            weight: 700,
            align: 'left',
        })
    }

    // Right: historical D/N ratio bars on a shared 0..44 scale
    const rx = 432
    const rw = 286
    const right = fig.plot({ x: rx, y: 72, width: rw, height: 256 }, { x: [0, 44], y: [0, 3] })

    fig.text(rx, 32, 'Historical D/N snapshots', {
        size: 15,
        color: c.textPrimary,
        weight: 700,
    })
    fig.text(rx, 52, 'Training tokens per parameter', {
        size: 13.5,
        color: c.textSecondary,
    })

    // Vertical gridlines & bottom ticks on right panel
    for (const tick of [0, 10, 20, 30, 40]) {
        const tx = right.px(tick)
        fig.line(tx, right.area.y, tx, right.bottom, {
            color: tick === 20 ? blue : c.borderSubtle,
            width: tick === 20 ? 1.4 : 1,
            dash: tick === 20 ? '4 4' : undefined,
            opacity: tick === 20 ? 0.75 : 1,
        })
        fig.text(tx, right.bottom + 15, tick === 0 ? '0' : `${tick}:1`, {
            size: 13.5,
            color: tick === 20 ? blue : c.textSecondary,
            align: 'center',
            mono: true,
            weight: tick === 20 ? 700 : 400,
        })
    }
    fig.line(rx, right.bottom, rx + rw, right.bottom, { color: c.textMuted, width: 1 })
    fig.text(rx + rw / 2, right.bottom + 36, 'Tokens per parameter (D / N)', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
    })

    const bars = [
        { name: 'GPT-3 (175B)', ratio: 1.7, label: '1.7:1', sub: 'undertrained', color: warm, row: 2.35 },
        {
            name: 'Chinchilla (70B)',
            ratio: 20,
            label: '20:1',
            sub: 'compute-optimal',
            color: blue,
            row: 1.45,
        },
        {
            name: 'Llama 3 405B',
            ratio: 38.5,
            label: '38.5:1',
            sub: 'overtrained',
            color: green,
            row: 0.55,
        },
    ]

    const barH = 26
    for (const b of bars) {
        const cy = right.py(b.row)
        const barW = Math.max(8, right.px(b.ratio) - rx)
        fig.text(rx, cy - 22, b.name, {
            size: 14,
            color: c.textPrimary,
            weight: 700,
        })
        fig.text(rx + rw, cy - 22, b.sub, {
            size: 13,
            color: b.color,
            align: 'right',
            weight: 600,
        })
        fig.rect(rx, cy - barH / 2, barW, barH, {
            fill: tint(b.color, c.bg, theme === 'dark' ? 0.36 : 0.25),
            stroke: b.color,
            strokeWidth: 1.75,
            radius: 4,
        })
        const valX = b.ratio > 32 ? rx + barW - 8 : rx + barW + 8
        const valAlign = b.ratio > 32 ? 'right' : 'left'
        fig.text(valX, cy, b.label, {
            size: 14,
            color: b.ratio > 32 ? c.textPrimary : b.color,
            align: valAlign,
            mono: true,
            weight: 700,
        })
    }

    return fig.render()
}

export default create('dark')
