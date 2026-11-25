import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'Bar chart and register-pool breakdown for 256-thread (8-warp) blocks on a 65,536-register SM with 256-register warp allocation granules. Active warps drop from 64 at R32 (8 blocks, 65,536 used) to 48 at R33 (6 blocks, 61,440 used, 4,096 free), 40 at R41, 24 at R65, and 8 at R129. Right notes show why rounding 1,056 to 1,280 strands 4,096 registers, how R33 reaches 100% under a 48-warp cap, and how 96 KiB shared memory at 32 KiB per block caps R32 at 24 warps.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('red')

    // === Left Top: Resident warps bar chart ===
    fig.text(56, 20, 'Resident warps per SM (256-thread / 8-warp blocks)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 56, y: 40, width: 396, height: 196 },
        { x: [0, 5], y: [0, 72] },
    )
    plot.axes({
        xTicks: [],
        yTicks: [0, 16, 32, 48, 64],
        yLabel: '',
        grid: true,
        labelSize: 12,
    })

    // 48-warp hardware cap reference line
    plot.hline(48, '48-warp SM cap', {
        color: green,
        dash: '4 4',
        labelPosition: 'right',
        labelSize: 11.5,
        labelOffset: 8,
    })

    const bars = [
        { label: 'R32', val: 64, tone: blue },
        { label: 'R33', val: 48, tone: warm },
        { label: 'R41', val: 40, tone: warm },
        { label: 'R65', val: 24, tone: purple },
        { label: 'R129', val: 8, tone: red },
    ]
    const bw = 44
    bars.forEach((b, i) => {
        const cx = plot.px(i + 0.5)
        const top = plot.py(b.val)
        fig.rect(cx - bw / 2, top, bw, plot.bottom - top, {
            fill: tint(b.tone, c.bg, isLight ? 0.24 : 0.38),
            stroke: b.tone,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(cx, top - 9, `${b.val}`, {
            size: 12.5,
            weight: 700,
            color: b.tone,
            align: 'center',
            mono: true,
        })
        fig.text(cx, plot.bottom + 14, b.label, {
            size: 12.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    })

    // === Left Bottom: 65,536-register SM pool utilization bars ===
    const poolSep = 274
    fig.line(24, poolSep, 464, poolSep, { color: c.borderSubtle, width: 1 })
    fig.text(24, poolSep + 20, 'SM register pool (65,536 total · 256-reg granule)', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 76
    const barW = 376

    // R32 bar (100%)
    const y32 = poolSep + 44
    fig.text(24, y32 + 12, 'R32', { size: 13, weight: 700, color: blue, mono: true })
    fig.rect(barX, y32, barW, 24, {
        fill: tint(blue, c.bg, isLight ? 0.24 : 0.38),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + barW / 2, y32 + 12, '8 blks × 8,192 = 65,536 (100%)', {
        size: 12,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    // R33 bar (61,440 used + 4,096 stranded)
    const y33 = poolSep + 82
    const usedW = barW * (61440 / 65536)
    fig.text(24, y33 + 12, 'R33', { size: 13, weight: 700, color: warm, mono: true })
    fig.rect(barX, y33, usedW, 24, {
        fill: tint(warm, c.bg, isLight ? 0.24 : 0.38),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + usedW / 2, y33 + 12, '6 blks × 10,240 = 61,440', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.rect(barX + usedW + 2, y33, barW - usedW - 2, 24, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.14 : 0.24),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 4,
    })
    fig.text(barX + barW, y33 + 38, '4,096 stranded (< 1 block)', {
        size: 11.5,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    // === Vertical hairline divider ===
    fig.line(482, 20, 482, height - 20, { color: c.borderSubtle, width: 1 })

    // === Right column: 3 quantitative cliff explanations ===
    const rx = 502
    const rw = 234

    const drawNote = (y: number, h: number, title: string, lines: string[], tone: string) => {
        fig.rect(rx, y, rw, h, {
            fill: tint(tone, c.bg, isLight ? 0.09 : 0.17),
            stroke: tone,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(rx + 12, y + 20, title, { size: 13.5, weight: 700, color: tone })
        lines.forEach((ln, idx) => {
            fig.text(rx + 12, y + 44 + idx * 20, ln, {
                size: 12,
                color: idx === lines.length - 1 ? c.textSecondary : c.textPrimary,
                mono: idx < lines.length - 1,
            })
        })
    }

    drawNote(
        34,
        118,
        'Why R32 -> R33 drops 25%',
        ['33 × 32 = 1,056 -> 1,280/warp', '1,280 × 8 = 10,240 / block', 'floor(65536/10240) = 6 blks', '4,096 regs left stranded'],
        warm,
    )

    drawNote(
        172,
        96,
        'Under a 48-warp SM cap',
        ['R33: 6 blks = 48 / 48 warps', '100% occupancy (no cliff)'],
        green,
    )

    drawNote(
        288,
        106,
        '96 KiB shared-mem limit',
        ['32 KiB / block -> max 3 blks', '24 / 64 warps (37.5%)', 'Overrides R32 register headroom'],
        purple,
    )

    return fig.render()
}

export default create('dark')
