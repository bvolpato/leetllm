import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 405
export const alt =
    'Eight unshared 16k branches consume 40 GiB of KV cache, whereas sharing one 12k stem plus eight 4k suffixes cuts memory to about 14 GiB.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const critical = fig.tone('critical')
    const muted = c.textSecondary

    // --- Left Zone: Radix Prefix Tree Sharing ---
    fig.text(24, 24, 'Radix Prefix Tree (8 Branches)', {
        size: 15,
        weight: 700,
        color: blue,
    })

    // Shared Stem block
    const stemX = 24
    const stemY = 52
    const stemW = 200
    const stemH = 62
    fig.rect(stemX, stemY, stemW, stemH, {
        fill: tint(blue, c.bg, 0.2),
        stroke: blue,
        strokeWidth: 2,
        radius: 8,
    })
    fig.text(stemX + stemW / 2, stemY + 22, 'Shared Stem (12k tok)', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        width: stemW - 12,
    })
    fig.text(stemX + stemW / 2, stemY + 44, '3.75 GiB · stored once', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: stemW - 12,
    })

    // Ref count pill
    fig.rect(236, stemY + 14, 96, 34, {
        fill: tint(green, c.bg, 0.18),
        stroke: green,
        strokeWidth: 1.5,
        radius: 17,
    })
    fig.text(284, stemY + 31, 'ref = 8', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
        width: 88,
    })

    // Tree trunk + 4 suffix branch nodes
    const trunkX = 68
    const suffixX = 112
    const suffixW = 220
    const suffixH = 38
    const branches = [
        { y: 146, label: 'Branch 1  (+4k · 1.25 GiB)' },
        { y: 196, label: 'Branch 2  (+4k · 1.25 GiB)' },
        { y: 246, label: 'Branches 3..7  (5 x 4k)' },
        { y: 296, label: 'Branch 8  (+4k · 1.25 GiB)' },
    ] as const

    fig.line(trunkX, stemY + stemH, trunkX, 315, { color: c.border, width: 1.75 })
    branches.forEach((b) => {
        const midY = b.y + suffixH / 2
        fig.arrow(trunkX, midY, suffixX - 3, midY, { color: cyan, width: 1.75, head: 5 })
        fig.rect(suffixX, b.y, suffixW, suffixH, {
            fill: tint(cyan, c.bg, 0.12),
            stroke: cyan,
            strokeWidth: 1.25,
            radius: 6,
        })
        fig.text(suffixX + suffixW / 2, midY, b.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            width: suffixW - 10,
        })
    })

    fig.text(24, 366, '320 KiB / token KV footprint', {
        size: 12,
        color: muted,
        mono: true,
    })

    // Subtle vertical divider
    fig.line(358, 18, 358, 386, { color: c.borderSubtle, width: 1 })

    // --- Right Zone: Calibrated KV Memory Footprint (0..40 GiB) ---
    const chartX = 384
    const chartW = 360 // 40 GiB -> 9 px/GiB (ends at 744; 744..820 open for totals)
    const maxGb = 40
    const gx = (gb: number) => chartX + (gb / maxGb) * chartW
    const gw = (gb: number) => (gb / maxGb) * chartW

    fig.text(chartX, 24, 'KV Cache Memory Footprint (0-40 GiB)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Vertical gridlines
    const axisY = 278
    for (const gb of [0, 10, 20, 30, 40]) {
        fig.line(gx(gb), 58, gx(gb), axisY, {
            color: c.borderSubtle,
            width: 1,
            dash: gb === 0 ? undefined : '3 4',
        })
    }

    // Bar 1: Unshared (40.0 GiB = 30.0 stems + 10.0 suffixes)
    const b1Y = 86
    const bH = 48
    fig.text(chartX, b1Y - 16, 'Unshared (8 separate 16k branches)', {
        size: 13,
        weight: 600,
        color: critical,
    })
    fig.rect(gx(0), b1Y, gw(30) - 2, bH, {
        fill: tint(critical, c.bg, 0.22),
        stroke: critical,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(gx(15), b1Y + bH / 2, '8 x 12k stems (30.0 GiB)', {
        size: 13,
        weight: 700,
        color: critical,
        align: 'center',
        width: gw(30) - 10,
    })

    fig.rect(gx(30) + 2, b1Y, gw(10) - 2, bH, {
        fill: tint(cyan, c.bg, 0.22),
        stroke: cyan,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(gx(35), b1Y + bH / 2, '10 GiB', {
        size: 13,
        weight: 700,
        color: cyan,
        align: 'center',
        mono: true,
        width: gw(10) - 6,
    })
    fig.text(754, b1Y + bH / 2, '40.0 GiB', {
        size: 14,
        weight: 700,
        color: critical,
        mono: true,
    })

    // Bar 2: Shared Prefix (13.75 GiB = 3.75 stem + 10.0 suffixes, 26.25 GiB saved)
    const b2Y = 204
    fig.text(chartX, b2Y - 40, 'Prefix Shared (1 stem + 8 suffixes)', {
        size: 13,
        weight: 600,
        color: green,
    })

    // 3.75 GiB stem segment + clean callout sitting between heading and bar (zero crossing)
    fig.rect(gx(0), b2Y, gw(3.75) - 1, bH, {
        fill: tint(blue, c.bg, 0.3),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 5,
    })
    fig.callout([gx(1.875), b2Y - 1], [gx(6.2), b2Y - 18], '1 stem: 3.75 GiB', {
        color: blue,
        labelColor: blue,
        size: 12,
        weight: 700,
        mono: true,
        align: 'left',
        bend: 0.18,
        head: 5,
    })

    // 10.0 GiB suffixes segment
    fig.rect(gx(3.75) + 2, b2Y, gw(10) - 2, bH, {
        fill: tint(cyan, c.bg, 0.22),
        stroke: cyan,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(gx(8.75), b2Y + bH / 2, '10 GiB', {
        size: 13,
        weight: 700,
        color: cyan,
        align: 'center',
        mono: true,
        width: gw(10) - 6,
    })

    // 26.25 GiB freed VRAM dashed region
    fig.rect(gx(13.75) + 4, b2Y, gw(26.25) - 4, bH, {
        fill: tint(green, c.bg, 0.08),
        stroke: green,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(gx(26.875), b2Y + 16, '26.25 GiB saved', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
        width: gw(26.25) - 14,
    })
    fig.text(gx(26.875), b2Y + 36, '-65.6% KV memory', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
        width: gw(26.25) - 14,
    })

    // Total 13.75 GiB label to right of axis (aligned with 40.0 GiB)
    fig.text(754, b2Y + bH / 2, '13.75 GiB', {
        size: 14,
        weight: 700,
        color: green,
        mono: true,
    })

    // --- Calibrated GiB Axis ---
    fig.line(chartX, axisY, chartX + chartW, axisY, { color: c.textMuted, width: 1.25 })
    for (const gb of [0, 10, 20, 30, 40]) {
        fig.line(gx(gb), axisY, gx(gb), axisY + 5, { color: c.textMuted, width: 1.25 })
        fig.text(gx(gb), axisY + 18, `${gb}`, {
            size: 12,
            weight: 600,
            color: muted,
            align: 'center',
            mono: true,
            width: 36,
        })
    }
    fig.text(chartX + chartW / 2, axisY + 38, 'Physical KV cache memory (GiB)', {
        size: 12,
        color: muted,
        align: 'center',
        width: 280,
    })

    // Bottom TeX calculation
    fig.math(
        598,
        366,
        '3.75 + 8 \\times 1.25 = 13.75\\,\\text{GiB} \\quad (2.9\\times\\text{ beams})',
        { size: 15, color: green, align: 'center' },
    )

    return fig.render()
}

export default create()
