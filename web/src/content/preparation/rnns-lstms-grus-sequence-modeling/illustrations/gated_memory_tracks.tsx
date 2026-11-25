import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 446
export const alt =
    'Left side shows an LSTM additive cell highway where retain 0.838 and write 0.002 sum to c_t = 0.840, while dropping output gate o_t from 0.80 to 0.10 cuts hidden h_t from 0.549 to 0.069 without altering c_t. Right side shows GRU coupled convex sliders h = z*h_old + (1-z)*h_tilde moving between candidate -0.20 and h_old +0.80: +0.750 at z=0.95, +0.300 at z=0.50, and -0.150 at z=0.05.'

const GRU_ROWS = [
    { z: 0.95, h: 0.75, txt: '+0.750', tone: 'blue' as const },
    { z: 0.5, h: 0.3, txt: '+0.300', tone: 'green' as const },
    { z: 0.05, h: -0.15, txt: '−0.150', tone: 'critical' as const },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    // ── Left half: LSTM Additive Cell Highway & Output Gate Decoupling ──────
    fig.text(20, 24, 'LSTM: Additive cell highway', {
        size: 21,
        weight: 750,
        color: blue,
    })
    fig.text(20, 52, 'Output gate scales hₜ without touching cₜ', {
        size: 17,
        color: c.textSecondary,
    })

    // Additive cell highway track at y = 114
    const yHwy = 114
    fig.text(20, yHwy, 'cₜ₋₁·f', { size: 17, mono: true, weight: 700, color: blue })
    fig.text(20, yHwy + 22, '0.838', { size: 16, mono: true, color: c.textSecondary })

    fig.arrow(84, yHwy, 186, yHwy, { color: blue, width: 4, head: 7.5 })
    fig.text(135, yHwy - 18, 'retain 99.8%', {
        size: 15,
        color: blue,
        align: 'center',
        weight: 600,
    })

    // Plus node
    fig.circle(204, yHwy, 16, { fill: c.bg, stroke: blue, width: 2.2 })
    fig.text(204, yHwy - 1, '+', { size: 22, weight: 750, color: blue, align: 'center', width: 24 })

    // Write branch entering + from below
    fig.arrow(204, yHwy + 46, 204, yHwy + 18, { color: green, width: 2.2, head: 6 })
    fig.text(204, yHwy + 62, 'i·g = 0.002', {
        size: 16,
        mono: true,
        color: green,
        align: 'center',
        weight: 700,
    })

    // Highway out to c_t = 0.840
    fig.arrow(222, yHwy, 286, yHwy, { color: blue, width: 4, head: 7.5 })
    fig.rect(290, yHwy - 22, 108, 44, {
        fill: tint(blue, c.bg, isLight ? 0.16 : 0.24),
        stroke: blue,
        strokeWidth: 2,
        radius: 8,
    })
    fig.text(344, yHwy - 8, 'cₜ = 0.840', {
        size: 17,
        mono: true,
        weight: 750,
        color: blue,
        align: 'center',
    })
    fig.text(344, yHwy + 12, 'intact', {
        size: 15,
        color: c.textSecondary,
        align: 'center',
        weight: 600,
    })

    // Decoupled comparison bars below highway
    const barRows = [
        { label: 'Cell cₜ', val: 0.84, txt: '0.840', col: blue, ink: blue },
        { label: 'hₜ (o=0.80)', val: 0.549, txt: '0.549', col: green, ink: green },
        { label: 'hₜ (o=0.10)', val: 0.069, txt: '0.069', col: amberMark, ink: amberText },
    ] as const

    fig.text(20, 214, 'Same cell cₜ, two output gates oₜ:', {
        size: 17,
        weight: 650,
        color: c.textSecondary,
    })

    const barLeft = 148
    const barWMax = 174
    barRows.forEach((b, i) => {
        const cy = 258 + i * 54
        const w = Math.max(8, (b.val / 1.0) * barWMax)
        fig.text(barLeft - 12, cy, b.label, {
            size: 18,
            weight: 650,
            color: b.ink,
            align: 'right',
            width: 128,
        })
        fig.rect(barLeft, cy - 11, barWMax, 22, {
            fill: c.bgSubtle,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 4,
        })
        fig.rect(barLeft, cy - 11, w, 22, { fill: b.col, radius: 4 })
        fig.text(barLeft + barWMax + 10, cy, b.txt, {
            size: 18,
            mono: true,
            weight: 750,
            color: b.ink,
        })
    })

    // Vertical divider
    fig.line(416, 20, 416, height - 20, { color: c.borderSubtle, width: 1.25 })

    // ── Right half: GRU Coupled Convex Slider ───────────────────────────────
    fig.text(436, 24, 'GRU: Coupled convex slider', {
        size: 21,
        weight: 750,
        color: cyan,
    })
    fig.text(436, 52, 'h = z·(+0.80) + (1−z)·(−0.20)', {
        size: 17,
        mono: true,
        color: c.textSecondary,
        weight: 600,
    })

    // Slider axis mapping [-0.30, +0.90] -> x in [448, 704] (leaving clean right column for h readouts)
    const sLeft = 448
    const sRight = 704
    const sPx = (v: number) => sLeft + ((v - -0.3) / 1.2) * (sRight - sLeft)

    const xCand = sPx(-0.2)
    const xZero = sPx(0)
    const xOld = sPx(0.8)

    fig.text(xCand, 88, 'h̃ = −0.20', {
        size: 15,
        mono: true,
        color: green,
        weight: 700,
        align: 'left',
        width: 110,
    })
    fig.text(xOld + 8, 88, 'h_old = +0.80', {
        size: 15,
        mono: true,
        color: blue,
        align: 'right',
        weight: 700,
        width: 148,
    })
    fig.text(xZero, 404, '0', {
        size: 15,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    GRU_ROWS.forEach((row, i) => {
        const yTop = 158 + i * 90
        const yMix = yTop + 32
        const col = fig.tone(row.tone)
        const xVal = sPx(row.h)

        // Short per-row reference vertical rails (clear of text headers and h readouts)
        const railTop = yTop - 9
        const railBot = yMix + 12
        fig.line(xCand, railTop, xCand, railBot, { color: green, width: 1.5, dash: '4 4', opacity: 0.75 })
        fig.line(xZero, railTop, xZero, railBot, { color: c.border, width: 1.2 })
        fig.line(xOld, railTop, xOld, railBot, { color: blue, width: 1.5, dash: '4 4', opacity: 0.75 })

        // Header above slider: z keep fraction
        fig.text(444, yTop - 22, `z = ${row.z.toFixed(2)} (${Math.round(row.z * 100)}% keep)`, {
            size: 16.5,
            weight: 650,
            color: c.textPrimary,
        })
        // Readout in dedicated right column completely clear of xOld rail
        fig.text(704, yTop + 14, `h = ${row.txt}`, {
            size: 16.5,
            mono: true,
            weight: 750,
            color: col,
            align: 'left',
        })

        // Convex segment rail between h̃ (-0.20) and h_old (+0.80)
        fig.line(xCand, yTop, xOld, yTop, { color: c.border, width: 4 })
        // Highlighted span from 0 to h
        fig.line(xZero, yTop, xVal, yTop, { color: col, width: 5 })
        // Endpoint caps
        fig.circle(xCand, yTop, 4, { fill: green })
        fig.circle(xOld, yTop, 4, { fill: blue })
        // Slider knob at convex mix h
        fig.circle(xVal, yTop, 9, { fill: col, stroke: c.bg, width: 2.4 })

        // Coupled proportion bar directly beneath: z (blue) + (1-z) (green) = 1
        const pLeft = xCand
        const pWidth = xOld - xCand
        const zW = Math.round(row.z * pWidth)
        fig.rect(pLeft, yMix - 6, zW, 12, { fill: blue, radius: 3 })
        fig.rect(pLeft + zW + 2, yMix - 6, Math.max(4, pWidth - zW - 2), 12, {
            fill: green,
            radius: 3,
        })
    })

    fig.text(622, 428, 'Blue = z (keep)  ·  Green = 1 − z (write)', {
        size: 16,
        color: c.textSecondary,
        align: 'center',
        width: 360,
    })

    return fig.render()
}

export default create('dark')
