import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 410
export const preset = 'engineering'
export const alt =
    'Paired held-out output comparison between source baseline and reloaded 4-bit model under identical tokenizer, chat template, and decoding controls. On a shared -4 to +8 axis, held-out column x0 shifts from -2.460 to -2.457 (drift +0.003), x1 shifts from -3.100 to -2.714 (drift +0.386), and x2 shifts from +6.800 to +6.571 (drift -0.229), exposing uneven per-input drift.'

const rows = [
    { name: 'x₀', base: -2.46, cand: -2.457, delta: '+0.003', sev: 'green' as const },
    { name: 'x₁', base: -3.1, cand: -2.714, delta: '+0.386', sev: 'critical' as const },
    { name: 'x₂', base: 6.8, cand: 6.571, delta: '−0.229', sev: 'warm' as const },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // --- Top compact paired evaluation strip ---
    fig.rect(32, 18, 134, 42, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.14 : 0.24),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(99, 39, 'Held-out x₀, x₁, x₂', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
    })

    fig.arrow(168, 39, 206, 39, { color: purple, width: 1.6, head: 5.5 })

    fig.rect(208, 18, 136, 42, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.14 : 0.24),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(276, 39, 'Source baseline', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })

    fig.text(364, 39, 'vs', {
        size: 13,
        weight: 600,
        color: c.textMuted,
        align: 'center',
    })

    fig.rect(384, 18, 146, 42, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.14 : 0.24),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(457, 39, 'Reloaded 4-bit', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })

    fig.text(544, 28, 'Identical tokenizer, template,', { size: 13, color: c.textSecondary })
    fig.text(544, 48, '& decoding controls', { size: 13, color: c.textSecondary })

    fig.line(32, 78, 728, 78, { color: c.borderSubtle, width: 1 })

    // --- Main Chart: Paired signed output bars + right delta column ---
    fig.text(32, 102, 'Paired held-out outputs (baseline vs 4-bit)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // Legend
    fig.rect(428, 96, 12, 12, { fill: blue, radius: 2 })
    fig.text(446, 102, 'Baseline', { size: 13, color: c.textSecondary })
    fig.rect(520, 96, 12, 12, { fill: warm, radius: 2 })
    fig.text(538, 102, '4-bit', { size: 13, color: c.textSecondary })

    fig.text(722, 102, 'Drift Δ', {
        size: 13,
        weight: 700,
        color: c.textSecondary,
        align: 'right',
    })

    const barLeft = 104
    const barRight = 576
    const xOf = (v: number) => barLeft + ((v + 4) / 12) * (barRight - barLeft)
    const zeroX = xOf(0)
    const axisTop = 128
    const axisBot = 316

    // Gridlines & ticks (-4 to +8)
    for (const tick of [-4, -2, 0, 2, 4, 6, 8]) {
        const tx = xOf(tick)
        const isZero = tick === 0
        fig.line(tx, axisTop, tx, axisBot, {
            color: isZero ? c.textSecondary : c.borderSubtle,
            width: isZero ? 1.75 : 1,
            dash: isZero ? undefined : '3 3',
        })
        fig.text(tx, axisBot + 16, tick > 0 ? `+${tick}` : tick < 0 ? `−${Math.abs(tick)}` : '0', {
            size: 13,
            weight: isZero ? 700 : 400,
            color: isZero ? c.textPrimary : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    rows.forEach((row, idx) => {
        const cy = 160 + idx * 62
        const barH = 18
        const sevColor = row.sev === 'green' ? green : row.sev === 'critical' ? red : warm

        fig.text(barLeft - 14, cy, row.name, {
            size: 15,
            weight: 700,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })

        // Baseline bar (upper)
        const bStart = Math.min(zeroX, xOf(row.base))
        const bW = Math.abs(xOf(row.base) - zeroX)
        fig.rect(bStart, cy - barH - 2, bW, barH, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: blue,
            strokeWidth: 1.25,
            radius: 3,
        })
        const bLblX = row.base < 0 ? zeroX + 8 : bStart + bW + 8
        fig.text(bLblX, cy - barH / 2 - 2, row.base.toFixed(3), {
            size: 13,
            weight: 600,
            color: blue,
            align: 'left',
            mono: true,
        })

        // Candidate 4-bit bar (lower)
        const cStart = Math.min(zeroX, xOf(row.cand))
        const cW = Math.abs(xOf(row.cand) - zeroX)
        fig.rect(cStart, cy + 2, cW, barH, {
            fill: tint(warm, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: warm,
            strokeWidth: 1.25,
            radius: 3,
        })
        const cLblX = row.cand < 0 ? zeroX + 8 : cStart + cW + 8
        fig.text(cLblX, cy + barH / 2 + 2, row.cand.toFixed(3), {
            size: 13,
            weight: 600,
            color: warm,
            align: 'left',
            mono: true,
        })

        // Right-hand delta badge
        fig.rect(612, cy - 16, 114, 32, {
            fill: tint(sevColor, c.bg, theme === 'light' ? 0.14 : 0.24),
            stroke: sevColor,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(669, cy, `Δ ${row.delta}`, {
            size: 13,
            weight: 700,
            color: sevColor,
            align: 'center',
            mono: true,
        })
    })

    // Bottom compact verification pillars (single clean strip)
    fig.line(32, 354, 728, 354, { color: c.borderSubtle, width: 1 })
    const pillars = [
        { x: 136, label: '1. Artifact identity (hash & reload)', color: purple },
        { x: 386, label: '2. Held-out task quality', color: green },
        { x: 616, label: '3. Warm TTFT / ITL / VRAM', color: warm },
    ]
    for (const p of pillars) {
        fig.text(p.x, 382, p.label, {
            size: 13,
            weight: 600,
            color: p.color,
            align: 'center',
        })
    }

    return fig.render()
}

export default create
