import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 482
export const alt =
    'Top: smooth sinusoidal waves sin(p * omega_k) across token positions 0 to 32 for d_model=512, contrasting fast pair (0,1), mid-speed pair (64,65), and nearly flat slow pair (510,511), with position p=12 marked. Bottom-left: [sin, cos] coordinates and phase dials at p=12: (-0.537, 0.844) for (0,1), (-0.608, -0.794) for (64,65), and (0.001, 1.000) for (510,511). Bottom-right: cumulative phase angles at p=12 of 12.00, 3.79, and 0.001 radians.'

const dModel = 512
const targetPos = 12
const omega = (firstDim: number) => 10000 ** (-firstDim / dModel)

const pairs = [
    { label: '(0, 1)', short: '(0,1)', firstDim: 0, tone: 'blue' as const, speed: 'λ = 6.3' },
    { label: '(64, 65)', short: '(64,65)', firstDim: 64, tone: 'green' as const, speed: 'λ = 19.9' },
    {
        label: '(510, 511)',
        short: '(510,511)',
        firstDim: 510,
        tone: 'warm' as const,
        speed: 'λ = 60.6k',
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    // ─── TOP: 240-point smooth sine waves across positions 0..32 ───
    const wave = fig.plot({ x: 64, y: 42, width: 650, height: 174 }, { x: [0, 32], y: [-1.18, 1.18] })

    wave.axes({
        xTicks: [0, 4, 8, 12, 16, 20, 24, 28, 32],
        yTicks: [-1, 0, 1],
        yFormat: (v) => (v === 0 ? '0' : v > 0 ? '+1' : '−1'),
        xLabel: 'Token position p  (d_model = 512)',
        yLabel: 'sin(p · ωₖ)',
        labelSize: 13.5,
        grid: true,
    })

    // Compact inline legend cleanly positioned above top-right of plot
    const legItems = [
        { x: 356, text: '(0,1) fast', tone: 'blue' as const },
        { x: 472, text: '(64,65) mid', tone: 'green' as const },
        { x: 592, text: '(510,511) slow', tone: 'warm' as const },
    ]
    for (const item of legItems) {
        const col = fig.tone(item.tone)
        fig.line(item.x, 18, item.x + 18, 18, { color: col, width: 2.8 })
        fig.text(item.x + 24, 18, item.text, {
            size: 13.5,
            color: col,
            weight: 700,
        })
    }

    // Highlight p = 12
    wave.vline(targetPos, undefined, { color: c.textPrimary, width: 1.35, dash: '4 4', opacity: 0.7 })
    fig.text(wave.px(targetPos) + 6, wave.area.y + 11, 'p = 12', {
        size: 13.5,
        color: c.textPrimary,
        mono: true,
        weight: 700,
    })

    // 240-point smooth sine waves
    for (const p of pairs) {
        const col = fig.tone(p.tone)
        const w = omega(p.firstDim)
        wave.fn((pos) => Math.sin(pos * w), { color: col, width: 2.5 }, 240)
        fig.circle(wave.px(targetPos), wave.py(Math.sin(targetPos * w)), 5.5, {
            fill: col,
            stroke: c.bg,
            width: 2,
        })
    }

    // Subtle divider
    fig.line(24, 264, width - 24, 264, { color: c.borderSubtle, width: 1 })

    // ─── BOTTOM-LEFT: Coordinates & phase dials at p = 12 ───
    fig.text(28, 286, 'Sinusoidal dials & [sin, cos] at p = 12', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    // Column headers
    fig.text(120, 312, 'dial', { size: 13.5, color: c.textSecondary, align: 'center', weight: 600 })
    fig.text(200, 312, 'sin', { size: 13.5, color: c.textSecondary, align: 'center', mono: true, weight: 600 })
    fig.text(288, 312, 'cos', { size: 13.5, color: c.textSecondary, align: 'center', mono: true, weight: 600 })

    pairs.forEach((p, idx) => {
        const ry = 344 + idx * 44
        const col = fig.tone(p.tone)
        const angle = targetPos * omega(p.firstDim)
        const sVal = Math.sin(angle)
        const cVal = Math.cos(angle)

        fig.text(90, ry, p.short, {
            size: 13.5,
            color: col,
            align: 'right',
            mono: true,
            weight: 700,
        })

        // Mini unit-circle phase dial (cos on x, sin on y)
        const dx = 120
        const r = 15
        fig.circle(dx, ry, r, {
            fill: tint(col, c.bg, theme === 'dark' ? 0.14 : 0.1),
            stroke: c.borderLight,
            width: 1.2,
        })
        fig.line(dx, ry, dx + cVal * (r - 2), ry - sVal * (r - 2), { color: col, width: 2.2 })
        fig.circle(dx + cVal * (r - 2), ry - sVal * (r - 2), 3, { fill: col })

        // sin & cos cells
        const cellFill = tint(col, c.bg, theme === 'dark' ? 0.18 : 0.12)
        const fmtSigned = (v: number) => (v >= 0 ? `+${v.toFixed(3)}` : `−${Math.abs(v).toFixed(3)}`)

        fig.rect(158, ry - 15, 84, 30, { fill: cellFill, stroke: col, strokeWidth: 1.2, radius: 4 })
        fig.text(200, ry, fmtSigned(sVal), {
            size: 13.5,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 600,
        })

        fig.rect(246, ry - 15, 84, 30, { fill: cellFill, stroke: col, strokeWidth: 1.2, radius: 4 })
        fig.text(288, ry, fmtSigned(cVal), {
            size: 13.5,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 600,
        })
    })

    // ─── BOTTOM-RIGHT: Cumulative phase angle at p = 12 (clean horizontal bars, ticks 0, 4, 8, 12) ───
    const rx = 444
    const rw = 276
    fig.text(rx, 286, 'Cumulative phase p · ωₖ at p = 12', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    const phasePlot = fig.plot({ x: rx, y: 312, width: rw, height: 118 }, { x: [0, 17.5], y: [0, 3] })
    for (const tick of [0, 4, 8, 12]) {
        const tx = phasePlot.px(tick)
        fig.line(tx, phasePlot.area.y, tx, phasePlot.bottom, { color: c.borderSubtle, width: 1 })
        fig.text(tx, phasePlot.bottom + 15, `${tick}`, {
            size: 13.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(rx, phasePlot.bottom, rx + rw, phasePlot.bottom, { color: c.textMuted, width: 1 })
    fig.line(rx, phasePlot.area.y, rx, phasePlot.bottom, { color: c.textMuted, width: 1 })
    fig.text(rx + rw / 2, phasePlot.bottom + 40, 'Phase angle (radians)', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })

    pairs.forEach((p, idx) => {
        const col = fig.tone(p.tone)
        const angle = targetPos * omega(p.firstDim)
        const cy = 336 + idx * 38
        const barW = Math.max(4, phasePlot.px(angle) - rx)
        fig.text(rx - 8, cy, p.short, {
            size: 13.5,
            color: col,
            align: 'right',
            mono: true,
            weight: 700,
        })
        fig.rect(rx, cy - 11, barW, 22, {
            fill: tint(col, c.bg, theme === 'dark' ? 0.38 : 0.26),
            stroke: col,
            strokeWidth: 1.5,
            radius: 4,
        })
        const lbl = angle >= 1 ? `${angle.toFixed(2)} rad` : `${angle.toFixed(3)} rad`
        fig.text(rx + barW + 8, cy, lbl, {
            size: 13.5,
            color: col,
            mono: true,
            weight: 700,
        })
    })

    return fig.render()
}

export default create('dark')
