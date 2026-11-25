import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 430
export const alt =
    'Log-log allocation geometry for a 100-fold training compute increase. Along the shared iso-FLOP contour N times D equals 100, Kaplan fitted growth sits at 28.84x parameters and 3.47x tokens, Chinchilla balanced growth sits at 10x each on the 1:1 diagonal, and an inference-aware overtrained regime sits at 2.5x parameters and 40x tokens. Side proportion bars show each regime’s share of the log-compute budget.'

const allocations = [
    {
        key: 'K',
        name: 'Kaplan',
        sub: 'N ∝ C⁰·⁷³ · D ∝ C⁰·²⁷',
        n: 100 ** 0.73,
        d: 100 ** 0.27,
        nText: '28.84×',
        dText: '3.47×',
        nShare: 0.73,
        tone: 'warm' as const,
        dx: 14,
        dy: -16,
    },
    {
        key: 'C',
        name: 'Chinchilla',
        sub: 'N ∝ C⁰·⁵⁰ · D ∝ C⁰·⁵⁰',
        n: 10,
        d: 10,
        nText: '10×',
        dText: '10×',
        nShare: 0.5,
        tone: 'blue' as const,
        dx: 14,
        dy: -16,
    },
    {
        key: 'A',
        name: 'Overtrained',
        sub: 'Inference-aware shift',
        n: 2.5,
        d: 40,
        nText: '2.5×',
        dText: '40×',
        nShare: Math.log10(2.5) / 2,
        tone: 'green' as const,
        dx: 14,
        dy: -16,
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const plot = fig.plot(
        { x: 74, y: 36, width: 320, height: 320 },
        { x: [1, 100], y: [1, 100], xScale: 'log', yScale: 'log' },
    )

    plot.logAxes({
        xTicks: [1, 10, 100],
        yTicks: [1, 10, 100],
        xFormat: (v) => `${v}×`,
        yFormat: (v) => `${v}×`,
        xLabel: 'Parameter multiplier N',
        yLabel: 'Token multiplier D',
        labelSize: 14,
        grid: true,
        minorGrid: true,
    })

    // Subtle secondary iso-FLOP reference contours (10x and 1000x)
    plot.curve(
        [
            [1, 10],
            [10, 1],
        ],
        { color: c.borderLight, width: 1, dash: '3 4', opacity: 0.7 },
    )
    fig.text(plot.px(2.4), plot.py(4.2) + 12, '10×', {
        size: 13,
        color: c.textMuted,
        align: 'center',
        mono: true,
    })

    plot.curve(
        [
            [10, 100],
            [100, 10],
        ],
        { color: c.borderLight, width: 1, dash: '3 4', opacity: 0.7 },
    )
    fig.text(plot.px(42), plot.py(24) - 12, '1000×', {
        size: 13,
        color: c.textMuted,
        align: 'center',
        mono: true,
    })

    // 1:1 balanced diagonal (N = D)
    plot.curve(
        [
            [1, 1],
            [100, 100],
        ],
        { color: fig.tone('blue'), width: 1.2, dash: '3 5', opacity: 0.45 },
    )
    fig.text(plot.px(56), plot.py(68), 'N = D', {
        size: 13,
        color: fig.tone('blue'),
        align: 'right',
        weight: 600,
    })

    // Main 100x iso-FLOP contour (N * D = 100)
    plot.curve(
        [
            [1, 100],
            [100, 1],
        ],
        { color: c.textPrimary, width: 2.25, dash: '6 4', opacity: 0.9 },
    )
    fig.text(plot.px(24), plot.py(18), 'N × D = 100', {
        size: 13.5,
        color: c.textPrimary,
        align: 'left',
        weight: 700,
        mono: true,
    })

    // Rays from origin (1x, 1x) to each allocation on the 100x contour
    for (const item of allocations) {
        const col = fig.tone(item.tone)
        plot.curve(
            [
                [1, 1],
                [item.n, item.d],
            ],
            { color: col, width: 2.2, opacity: 0.85 },
        )
        const px = plot.px(item.n)
        const py = plot.py(item.d)
        fig.circle(px, py, 7.5, { fill: col, stroke: c.bg, width: 2.25 })
        fig.text(px + item.dx, py + item.dy, item.key, {
            size: 16,
            color: col,
            weight: 800,
            mono: true,
        })
    }

    // Right column: frameless breakdown of each allocation + log-budget split bar
    const rx = 426
    const rw = 274

    fig.math(rx, 46, String.raw`N \times D = 100\times`, {
        size: 16,
        color: c.textPrimary,
        align: 'left',
    })
    fig.text(rx, 72, 'Same compute, different N / D split', {
        size: 13.5,
        color: c.textSecondary,
        weight: 500,
    })
    fig.line(rx, 88, rx + rw, 88, { color: c.borderSubtle, width: 1 })

    const barH = 12
    allocations.forEach((item, idx) => {
        const y0 = 114 + idx * 92
        const col = fig.tone(item.tone)
        const soft = tint(col, c.bg, 0.22)

        fig.circle(rx + 6, y0, 5.5, { fill: col })
        fig.text(rx + 20, y0, `${item.key}  ${item.name}`, {
            size: 15,
            color: col,
            weight: 700,
        })
        fig.text(rx + rw, y0, `${item.nText} N · ${item.dText} D`, {
            size: 13.5,
            color: c.textPrimary,
            align: 'right',
            mono: true,
            weight: 600,
        })
        fig.text(rx + 20, y0 + 21, item.sub, {
            size: 13,
            color: c.textSecondary,
        })

        // Visual log-compute split bar: left portion = log N share, right portion = log D share
        const barY = y0 + 38
        const nW = Math.round(rw * item.nShare)
        const dW = rw - nW
        fig.rect(rx, barY, nW - 1, barH, { fill: col, radius: 3 })
        fig.rect(rx + nW + 1, barY, Math.max(2, dW - 1), barH, {
            fill: soft,
            stroke: col,
            strokeWidth: 1,
            radius: 3,
        })
        fig.text(rx, barY + 23, `N: ${Math.round(item.nShare * 100)}%`, {
            size: 13,
            color: col,
            mono: true,
            weight: 600,
        })
        fig.text(rx + rw, barY + 23, `D: ${Math.round((1 - item.nShare) * 100)}%`, {
            size: 13,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    })

    return fig.render()
}

export default create('dark')
