import type { ThemeMode, ToneName } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 395
export const alt =
    'Side-by-side comparison of 1,536-dimensional embedding storage across FP32, INT8, Binary, and PQ-96. Left: calibrated log-scale bars show exact bytes per vector and 1M-row RAM dropping from 6,144 B (5.72 GiB) for FP32 to 1,536 B (1.43 GiB) for INT8, 192 B (183.1 MiB) for Binary, and 96 B (91.6 MiB) for PQ-96. Right: linear compression ratio bars climb from 1x (32 b/d) to 4x (8 b/d), 32x (1 b/d), and 64x (0.5 b/d).'

const formats: Array<{
    name: string
    bytes: number
    ram: string
    ratio: number
    bits: string
    tone: ToneName
}> = [
    { name: 'FP32', bytes: 6144, ram: '5.72 GiB', ratio: 1, bits: '32 b/d', tone: 'purple' },
    { name: 'INT8', bytes: 1536, ram: '1.43 GiB', ratio: 4, bits: '8 b/d', tone: 'blue' },
    { name: 'Binary', bytes: 192, ram: '183.1 MiB', ratio: 32, bits: '1 b/d', tone: 'cyan' },
    { name: 'PQ-96', bytes: 96, ram: '91.6 MiB', ratio: 64, bits: '0.5 b/d', tone: 'green' },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isDark = theme === 'dark'

    // ─── LEFT: Calibrated log-scale payload bytes per 1,536d vector ───
    const lx = 88
    const lw = 356
    const topY = 66
    const plotH = 264

    fig.text(lx, 24, 'Raw payload size  (1,536d · log scale)', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })
    fig.text(lx, 44, 'Bytes / vector  &  RAM for 1M vectors', {
        size: 13,
        color: c.textSecondary,
    })

    const leftPlot = fig.plot(
        { x: lx, y: topY, width: lw, height: plotH },
        { x: [32, 16384], y: [0, 4], xScale: 'log', yScale: 'linear' },
    )

    // Power-of-2 byte ticks (honest log axis)
    const byteTicks = [
        { val: 64, label: '64 B' },
        { val: 256, label: '256 B' },
        { val: 1024, label: '1 KB' },
        { val: 4096, label: '4 KB' },
        { val: 16384, label: '16 KB' },
    ]
    for (const t of byteTicks) {
        const tx = leftPlot.px(t.val)
        fig.line(tx, topY, tx, leftPlot.bottom, { color: c.borderSubtle, width: 1 })
        fig.text(tx, leftPlot.bottom + 15, t.label, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(lx, topY, lx, leftPlot.bottom, { color: c.textMuted, width: 1 })
    fig.line(lx, leftPlot.bottom, lx + lw, leftPlot.bottom, { color: c.textMuted, width: 1 })
    fig.text(lx + lw / 2, leftPlot.bottom + 36, 'Bytes per vector (log scale)', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })

    formats.forEach((f, idx) => {
        const col = fig.tone(f.tone)
        const cy = topY + 34 + idx * 64
        const barW = Math.max(10, leftPlot.px(f.bytes) - lx)

        fig.text(lx - 10, cy - 7, f.name, {
            size: 14,
            color: col,
            align: 'right',
            weight: 700,
        })
        fig.text(lx - 10, cy + 12, f.bits, {
            size: 12.5,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })

        fig.rect(lx, cy - 14, barW, 28, {
            fill: tint(col, c.bg, isDark ? 0.38 : 0.26),
            stroke: col,
            strokeWidth: 1.6,
            radius: 4,
        })

        const bytesText = `${f.bytes.toLocaleString('en-US')} B`
        const info = `${bytesText} · ${f.ram}`
        if (barW > 180) {
            fig.text(lx + barW - 8, cy, info, {
                size: 13,
                color: isDark ? '#ffffff' : c.textPrimary,
                align: 'right',
                mono: true,
                weight: 700,
            })
        } else {
            fig.text(lx + barW + 8, cy, info, {
                size: 13,
                color: col,
                mono: true,
                weight: 700,
            })
        }
    })

    // ─── RIGHT: Linear compression ratio relative to FP32 (1x to 64x) ───
    const rx = 502
    const rw = 216
    fig.text(rx + rw / 2, 24, 'Compression vs FP32', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(rx + rw / 2, 44, 'Up to 64× raw code reduction', {
        size: 13,
        color: fig.tone('green'),
        align: 'center',
        weight: 600,
    })

    const rightPlot = fig.plot({ x: rx, y: topY, width: rw, height: plotH }, { x: [0, 4], y: [0, 74] })
    for (const tick of [0, 16, 32, 48, 64]) {
        const py = rightPlot.py(tick)
        fig.line(rx, py, rx + rw, py, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
        })
        fig.text(rx - 8, py, `${tick}×`, {
            size: 13,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(rx, topY, rx, rightPlot.bottom, { color: c.textMuted, width: 1 })

    const slot = rw / 4
    const barW = 34
    formats.forEach((f, idx) => {
        const col = fig.tone(f.tone)
        const cx = rx + (idx + 0.5) * slot
        const y0 = rightPlot.py(0)
        const y1 = rightPlot.py(f.ratio)
        const h = Math.max(5, y0 - y1)
        fig.rect(cx - barW / 2, y0 - h, barW, h, {
            fill: tint(col, c.bg, isDark ? 0.42 : 0.28),
            stroke: col,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(cx, y0 - h - 13, `${f.ratio}×`, {
            size: 13.5,
            color: col,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(cx, rightPlot.bottom + 16, f.name, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
            weight: 600,
        })
    })

    fig.text(rx + rw / 2, rightPlot.bottom + 36, '+ codebooks, graph & rescore RAM', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
