import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 400
export const alt =
    'Conventional FP16 cache for one sequence. At 32K, 64K, 96K, and 128K token slots, Qwen3.6-27B uses 2, 4, 6, and 8 GiB; 35B-A3B uses 0.625, 1.25, 1.875, and 2.5 GiB. K means 1024. Weights, recurrent state, checkpoints, and buffers are excluded.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const purple = fig.tone('purple')
    const teal = fig.tone('green')

    const plot = fig.plot(
        { x: 84, y: 52, width: 470, height: 274 },
        { x: [0, 128], y: [0, 8.6] },
    )

    plot.axes({
        xTicks: [0, 32, 64, 96, 128],
        xFormat: (v) => (v === 0 ? '0' : `${v}K`),
        yTicks: [0, 2, 4, 6, 8],
        yFormat: (v) => `${v} GiB`,
        xLabel: 'Token slots per sequence (K = 1,024)',
        yLabel: 'Conventional FP16 attention KV cache',
        grid: true,
        labelSize: 13,
    })

    const pts27B: [number, number][] = [
        [0, 0],
        [32, 2],
        [64, 4],
        [96, 6],
        [128, 8],
    ]
    const pts35B: [number, number][] = [
        [0, 0],
        [32, 0.625],
        [64, 1.25],
        [96, 1.875],
        [128, 2.5],
    ]

    // Soft shaded saving band between the two linear cache curves
    plot.band(pts35B, pts27B, {
        fill: purple,
        fillOpacity: theme === 'light' ? 0.08 : 0.12,
    })
    plot.fillArea(pts35B, {
        fill: teal,
        fillOpacity: theme === 'light' ? 0.12 : 0.15,
        stroke: false,
    })

    plot.curve(pts27B, { color: purple, width: 2.75 })
    plot.curve(pts35B, { color: teal, width: 2.75 })

    for (const [x, y] of pts27B.slice(1)) {
        plot.point(x, y, { color: purple, r: 4.5 })
    }
    for (const [x, y] of pts35B.slice(1)) {
        plot.point(x, y, { color: teal, r: 4.5 })
    }

    // Direct endpoint annotations cleanly positioned in the right gutter
    const rightX = plot.right + 14
    fig.text(rightX, plot.py(8) - 8, '27B · 8.0 GiB', {
        size: 15,
        weight: 700,
        color: purple,
    })
    fig.text(rightX, plot.py(8) + 12, '16 layers × 4 KV heads', {
        size: 13,
        color: c.textSecondary,
    })

    fig.text(rightX, plot.py(2.5) - 8, '35B-A3B · 2.5 GiB', {
        size: 15,
        weight: 700,
        color: teal,
    })
    fig.text(rightX, plot.py(2.5) + 12, '10 layers × 2 KV heads', {
        size: 13,
        color: c.textSecondary,
    })

    // Curly dimension brace showing the 3.2x reduction at 128K
    fig.brace(plot.right + 12, plot.py(8) + 28, plot.right + 12, plot.py(2.5) - 24, '3.2× less KV', {
        side: -1,
        depth: 10,
        color: c.textMuted,
        labelColor: c.textPrimary,
        labelSize: 13,
        labelGap: 10,
        weight: 600,
    })

    // Key midpoint values directly on the curves for quick hand verification
    fig.text(plot.px(64) - 8, plot.py(4) - 16, '4.0 GiB', {
        size: 12,
        weight: 600,
        color: purple,
        align: 'right',
        mono: true,
    })
    fig.text(plot.px(64) + 6, plot.py(1.25) + 16, '1.25 GiB', {
        size: 12,
        weight: 600,
        color: teal,
        align: 'left',
        mono: true,
    })

    return fig.render()
}

export default create('dark')
