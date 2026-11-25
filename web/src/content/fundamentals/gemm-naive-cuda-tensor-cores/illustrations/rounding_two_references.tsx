import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 430
export const alt =
    'FP16 quantization spacing around 1,024 and two-reference error separation. Top calibrated number line from 1023.0 to 1025.0 shows FP16 ULP doubling from 0.5 below 1,024 to 1.0 above 1,024 (versus FP32 spacing near 1.2e-4): subtracting 0.375 snaps to 1023.5 while adding 0.25 snaps back to 1024.0. Bottom cancellation comparison for A=[1.0001, 1], B=[1, -1]^T contrasts Reference 2 (Original FP64 dot product 0.00010002, 100% relative error against candidate) with Reference 1 (rounded FP16 inputs [1, 1] giving 0.0, exact pass within 5e-3 / 2e-3 FP32 tolerance).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // --- Top section: Calibrated FP16 ULP ruler around 1,024 ---
    fig.text(36, 22, 'FP16 ULP spacing around 1,024', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(704, 22, 'FP32 ULP ≈ 1.2e-4', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    const axisLeft = 56
    const axisRight = 684
    const axisY = 118
    const minV = 1022.8
    const maxV = 1025.2
    const xOf = (v: number) => axisLeft + ((v - minV) / (maxV - minV)) * (axisRight - axisLeft)

    // Subtle shaded binade zones
    fig.rect(xOf(1023.0), axisY - 12, xOf(1024.0) - xOf(1023.0), 24, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.14 : 0.2),
        radius: 4,
    })
    fig.rect(xOf(1024.0), axisY - 12, xOf(1025.0) - xOf(1024.0), 24, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.16 : 0.22),
        radius: 4,
    })

    // Main ruler spine
    fig.line(axisLeft, axisY, axisRight, axisY, { color: c.textMuted, width: 2 })

    // Representable FP16 ticks
    const ticks = [
        { v: 1023.0, label: '1023.0' },
        { v: 1023.5, label: '1023.5' },
        { v: 1024.0, label: '1024.0' },
        { v: 1025.0, label: '1025.0' },
    ]
    for (const t of ticks) {
        const tx = xOf(t.v)
        fig.line(tx, axisY - 11, tx, axisY + 11, {
            color: t.v === 1024.0 ? c.textPrimary : c.textSecondary,
            width: t.v === 1024.0 ? 2.5 : 1.75,
        })
        fig.circle(tx, axisY, t.v === 1024.0 ? 4.5 : 3.5, {
            fill: c.bg,
            stroke: t.v === 1024.0 ? c.textPrimary : c.textSecondary,
            width: 2,
        })
        fig.text(tx, axisY + 26, t.label, {
            size: 13,
            color: t.v === 1024.0 ? c.textPrimary : c.textSecondary,
            align: 'center',
            weight: t.v === 1024.0 ? 600 : 400,
            mono: true,
        })
    }

    // Input points & curved snap-to-FP16 arrows
    const xSub = xOf(1023.625)
    const xSnapSub = xOf(1023.5)
    fig.circle(xSub, axisY, 5.5, { fill: blue, stroke: c.bg, width: 2 })
    fig.path(
        `M${xSub.toFixed(1)} ${(axisY - 8).toFixed(1)} Q${((xSub + xSnapSub) / 2).toFixed(1)} ${(axisY - 34).toFixed(1)}, ${(xSnapSub + 3).toFixed(1)} ${(axisY - 12).toFixed(1)}`,
        { color: blue, width: 1.75 },
    )
    fig.arrow(xSnapSub + 9, axisY - 18, xSnapSub + 2, axisY - 11, {
        color: blue,
        width: 1.75,
        head: 6,
    })
    fig.text(xSub + 4, 62, '1024 − 0.375 → 1023.5', {
        size: 13,
        color: blue,
        align: 'center',
        weight: 600,
        mono: true,
    })
    fig.line(xSub, 75, xSub, axisY - 8, { color: blue, width: 1, dash: '3 3', opacity: 0.7 })

    const xAdd = xOf(1024.25)
    const xSnapAdd = xOf(1024.0)
    fig.circle(xAdd, axisY, 5.5, { fill: red, stroke: c.bg, width: 2 })
    fig.path(
        `M${xAdd.toFixed(1)} ${(axisY - 8).toFixed(1)} Q${((xAdd + xSnapAdd) / 2).toFixed(1)} ${(axisY - 38).toFixed(1)}, ${(xSnapAdd + 4).toFixed(1)} ${(axisY - 12).toFixed(1)}`,
        { color: red, width: 1.75 },
    )
    fig.arrow(xSnapAdd + 11, axisY - 21, xSnapAdd + 3, axisY - 11, {
        color: red,
        width: 1.75,
        head: 6,
    })
    fig.text(xAdd + 36, 62, '1024 + 0.25 → 1024.0', {
        size: 13,
        color: red,
        align: 'center',
        weight: 600,
        mono: true,
    })
    fig.line(xAdd, 75, xAdd, axisY - 8, { color: red, width: 1, dash: '3 3', opacity: 0.7 })

    // ULP braces below ticks
    fig.brace(xOf(1023.5), axisY + 46, xOf(1024.0), axisY + 46, 'ULP = 0.5', {
        side: 1,
        depth: 9,
        color: blue,
        labelColor: blue,
        labelSize: 13,
        labelGap: 14,
        weight: 600,
    })
    fig.brace(xOf(1024.0), axisY + 46, xOf(1025.0), axisY + 46, 'ULP = 1.0 (no FP16 values inside)', {
        side: 1,
        depth: 9,
        color: warm,
        labelColor: warm,
        labelSize: 13,
        labelGap: 14,
        weight: 600,
    })

    // Hairline separator
    fig.line(36, 212, 704, 212, { color: c.borderSubtle, width: 1 })

    // --- Bottom section: Two-reference cancellation comparison ---
    fig.text(36, 236, 'Two-reference cancellation test', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.math(704, 236, 'A = [1.0001,\\, 1],\\;\\; B = [1,\\, -1]^\\top', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
    })

    const barX = 248
    const barW = 244

    // Row 1: Reference 2 (Original FP64)
    const r1Y = 290
    fig.text(36, r1Y - 9, 'Ref 2 · Orig FP64', { size: 14, weight: 600, color: blue })
    fig.text(36, r1Y + 11, '1.0001 − 1.0', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })
    fig.rect(barX, r1Y - 14, barW, 28, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 5,
    })
    fig.rect(barX, r1Y - 14, barW, 28, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.25 : 0.36),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + barW / 2, r1Y, '0.00010002', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.text(512, r1Y - 9, '100% rel. err vs cand', { size: 13, weight: 600, color: red })
    fig.text(512, r1Y + 11, 'FP16 input quantization loss', {
        size: 12,
        color: c.textSecondary,
    })

    // Row 2: Reference 1 (Rounded FP16 -> FP32)
    const r2Y = 354
    fig.text(36, r2Y - 9, 'Ref 1 · FP16 → FP32', { size: 14, weight: 600, color: green })
    fig.text(36, r2Y + 11, '1.0 − 1.0 (after cast)', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })
    fig.rect(barX, r2Y - 14, barW, 28, {
        fill: tint(green, c.bg, theme === 'light' ? 0.08 : 0.12),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 5,
    })
    fig.rect(barX, r2Y - 14, 6, 28, { fill: green, radius: 3 })
    fig.text(barX + 18, r2Y, 'cand = 0.0', {
        size: 13,
        weight: 600,
        color: green,
        mono: true,
    })
    fig.text(512, r2Y - 9, '0 error · exact pass', { size: 13, weight: 600, color: green })
    fig.text(512, r2Y + 11, 'Kernel tol: 5e-3 / 2e-3 FP32', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })

    // Concise takeaway strip
    fig.text(
        370,
        406,
        'FP32 accumulation preserves Ref 1 parity · cannot restore digits lost at FP16 input cast',
        {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create
