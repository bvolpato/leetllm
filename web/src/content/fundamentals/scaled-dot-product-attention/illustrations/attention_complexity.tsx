import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 458
export const alt =
    'Top: side-by-side 8x8 attention grids contrast Standard Attention materializing the entire N by N score matrix in HBM (O(N^2)) against FlashAttention streaming a single active B_r by B_c tile in on-chip SRAM (O(N) temporary HBM). Bottom: FP16 score-matrix size per head grows quadratically from 2 MiB at N=1k to 32 MiB at 4k, 128 MiB at 8k, and 512 MiB at 16k, while tiled FlashAttention stays flat near the bottom axis.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const isDark = theme === 'dark'

    // ─── TOP: Vivid 8x8 HBM vs SRAM tiled attention matrices ───
    const cell = 15
    const gap = 3
    const gridSpan = 8 * cell + 7 * gap // 141px
    const gridY = 38

    // Left: Standard Attention (full N x N in HBM)
    const lx = 104
    fig.text(lx + gridSpan / 2, 16, 'Standard attention (HBM)', {
        size: 14.5,
        color: warm,
        align: 'center',
        weight: 700,
    })

    for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
            const x = lx + col * (cell + gap)
            const y = gridY + r * (cell + gap)
            fig.rect(x, y, cell, cell, {
                fill: tint(warm, c.bg, isDark ? 0.44 : 0.3),
                stroke: warm,
                strokeWidth: 1.1,
                radius: 2.5,
            })
        }
    }
    fig.math(lx + gridSpan / 2, gridY + gridSpan + 22, String.raw`\text{Full } N \times N \;\cdot\; O(N^2)`, {
        size: 14,
        color: warm,
        align: 'center',
    })

    // Right: FlashAttention (single active B_r x B_c tile in on-chip SRAM)
    const rx = 444
    fig.text(rx + gridSpan / 2, 16, 'FlashAttention (on-chip SRAM)', {
        size: 14.5,
        color: purple,
        align: 'center',
        weight: 700,
    })

    const inactiveFill = isDark ? '#1e2536' : '#eee9df'
    const inactiveStroke = isDark ? '#344158' : '#d0c9bb'

    for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
            const x = rx + col * (cell + gap)
            const y = gridY + r * (cell + gap)
            const active = r >= 2 && r < 4 && col >= 2 && col < 4
            fig.rect(x, y, cell, cell, {
                fill: active ? tint(purple, c.bg, isDark ? 0.65 : 0.45) : inactiveFill,
                stroke: active ? (isDark ? '#d8b4fe' : purple) : inactiveStroke,
                strokeWidth: active ? 1.8 : 1,
                radius: 2.5,
            })
        }
    }

    // Crisp bounding highlight + B_r / B_c callouts on the active 2x2 SRAM tile
    const tileX = rx + 2 * (cell + gap) - 2
    const tileY = gridY + 2 * (cell + gap) - 2
    const tileW = 2 * cell + gap + 4
    fig.rect(tileX, tileY, tileW, tileW, {
        stroke: cyan,
        strokeWidth: 2,
        radius: 4,
    })
    fig.callout(
        [tileX + tileW + 2, tileY + tileW / 2],
        [rx + gridSpan + 16, tileY + tileW / 2],
        String.raw`B_r \times B_c`,
        {
            color: cyan,
            labelColor: cyan,
            size: 14,
            tex: true,
            align: 'left',
            bend: 0,
            head: 5,
        },
    )
    fig.text(rx + gridSpan + 18, tileY + tileW / 2 + 20, 'active SRAM tile', {
        size: 12.5,
        color: c.textSecondary,
    })

    fig.math(rx + gridSpan / 2, gridY + gridSpan + 22, String.raw`\text{One } B_r \times B_c \text{ tile} \;\cdot\; O(N)`, {
        size: 14,
        color: purple,
        align: 'center',
    })

    // Subtle divider
    fig.line(24, 218, width - 24, 218, { color: c.borderSubtle, width: 1 })

    // ─── BOTTOM: Quadratic HBM vs Linear O(N) SRAM curve ───
    const plot = fig.plot({ x: 82, y: 248, width: 616, height: 156 }, { x: [0, 16.5], y: [0, 560] })

    plot.axes({
        xTicks: [0, 4, 8, 12, 16],
        yTicks: [0, 128, 256, 384, 512],
        xFormat: (v) => (v === 0 ? '0' : `${v}k`),
        yFormat: (v) => `${v} MiB`,
        xLabel: 'Sequence length N  (FP16 score matrix per head = 2N² bytes)',
        yLabel: 'HBM per head',
        labelSize: 13.5,
        grid: true,
    })

    // Shaded area under quadratic curve
    plot.fillArea((k) => 2 * k * k, {
        range: [0, 16],
        baseline: 0,
        fill: warm,
        fillOpacity: 0.12,
        samples: 120,
    })

    // Smooth quadratic O(N^2) curve & linear O(N) FlashAttention line
    plot.fn((k) => 2 * k * k, { color: warm, width: 2.8 }, 160, [0, 16])
    plot.fn((k) => 0.25 * k, { color: purple, width: 2.8 }, 80, [0, 16])

    // Key points along Standard O(N^2) curve with direct labels
    const pts: Array<{ k: number; mb: number; dx: number; dy: number; align: 'left' | 'center' | 'right' }> = [
        { k: 1, mb: 2, dx: -4, dy: -16, align: 'left' },
        { k: 4, mb: 32, dx: 6, dy: -20, align: 'center' },
        { k: 8, mb: 128, dx: -10, dy: -14, align: 'right' },
        { k: 16, mb: 512, dx: -10, dy: 4, align: 'right' },
    ]
    for (const p of pts) {
        const px = plot.px(p.k)
        const py = plot.py(p.mb)
        fig.circle(px, py, 5.2, { fill: warm, stroke: c.bg, width: 1.8 })
        fig.text(px + p.dx, py + p.dy, `${p.k}k: ${p.mb} MiB`, {
            size: 13,
            color: warm,
            align: p.align,
            mono: true,
            weight: 700,
        })
    }

    // Direct curve labels
    fig.text(plot.px(11.6), plot.py(2 * 11.6 * 11.6) - 20, 'Standard O(N²) HBM', {
        size: 14,
        color: warm,
        align: 'right',
        weight: 700,
    })
    fig.circle(plot.px(16), plot.py(4), 5.2, { fill: purple, stroke: c.bg, width: 1.8 })
    fig.text(plot.px(15.6), plot.py(34), 'FlashAttention O(N) SRAM', {
        size: 14,
        color: purple,
        align: 'right',
        weight: 700,
    })

    return fig.render()
}

export default create('dark')
