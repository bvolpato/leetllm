import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 456
export const alt =
    'Top strip shows a three-slot padded sequence with valid tokens slow and yet reaching h_2 = [0.494, 0.641] followed by a <PAD> slot at t=3. Bottom left 2D state-space plot shows masked execution preserving [0.494, 0.641], while dashed drift arrows show a zero pad row shrinking state to [0.302, 0.367] and noise [9, -9, 9] driving state to [1.000, -0.889]. Bottom right bars compare Euclidean state drift: 0.000 masked, 0.335 zero pad, and 1.612 noise.'

const MODES = [
    { label: 'Masked', short: 'Masked', x: 0.494, y: 0.641, drift: 0.0, tone: 'green' as const },
    { label: 'Zero pad', short: 'Zero pad', x: 0.302, y: 0.367, drift: 0.335, tone: 'warm' as const },
    { label: '[9,−9,9]', short: 'Noise', x: 1.0, y: -0.889, drift: 1.612, tone: 'critical' as const },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    const colOf = (tone: 'green' | 'warm' | 'critical') =>
        tone === 'warm' ? amberMark : fig.tone(tone)
    const inkOf = (tone: 'green' | 'warm' | 'critical') =>
        tone === 'warm' ? amberText : fig.tone(tone)

    // ── Top inline sequence strip ───────────────────────────────────────────
    fig.text(20, 24, 'Padded sequence (valid length = 2):', {
        size: 18,
        weight: 700,
        color: c.textPrimary,
    })

    const pills = [
        { x: 344, w: 126, text: '1: "slow"', col: blue, fill: tint(blue, c.bg, isLight ? 0.12 : 0.2) },
        { x: 486, w: 120, text: '2: "yet"', col: green, fill: tint(green, c.bg, isLight ? 0.14 : 0.22) },
        { x: 622, w: 158, text: '3: <PAD> (skip)', col: amberMark, fill: tint(amberMark, c.bg, isLight ? 0.12 : 0.2) },
    ] as const

    pills.forEach((p, i) => {
        fig.rect(p.x, 8, p.w, 32, {
            fill: p.fill,
            stroke: p.col,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(p.x + p.w / 2, 24, p.text, {
            size: 16,
            mono: true,
            weight: 700,
            color: i === 2 ? amberText : p.col,
            align: 'center',
            width: p.w - 6,
        })
        if (i < pills.length - 1) {
            fig.arrow(p.x + p.w + 2, 24, pills[i + 1]!.x - 2, 24, {
                color: c.textMuted,
                width: 1.8,
                head: 5,
            })
        }
    })

    fig.line(20, 54, width - 20, 54, { color: c.borderSubtle, width: 1.1 })

    // ── Bottom Left: 2D State-Space Vector Plot ─────────────────────────────
    fig.text(24, 78, 'State vectors h₃ in 2D space', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 82, y: 112, width: 344, height: 292 },
        { x: [-0.08, 1.18], y: [-1.08, 0.9] },
    )
    plot.axes({
        xTicks: [0, 0.5, 1.0],
        yTicks: [-1.0, -0.5, 0, 0.5],
        grid: true,
        labelSize: 16,
        xLabel: 'h[0]',
        yLabel: 'h[1]',
    })
    plot.hline(0, undefined, { color: c.border, width: 1.2, dash: '' })
    plot.vline(0, undefined, { color: c.border, width: 1.2, dash: '' })

    const ox = plot.px(0)
    const oy = plot.py(0)
    const mx = plot.px(0.494)
    const my = plot.py(0.641)

    // Dashed drift arrows FROM masked true state h_2 TO drifted h_3 endpoints
    const zx = plot.px(0.302)
    const zy = plot.py(0.367)
    const nx = plot.px(1.0)
    const ny = plot.py(-0.889)

    fig.arrow(mx - 4, my + 5, zx + 4, zy - 6, {
        color: amberMark,
        width: 2,
        dash: '5 4',
        head: 6.5,
    })
    fig.arrow(mx + 4, my + 6, nx - 4, ny - 8, {
        color: red,
        width: 2,
        dash: '5 4',
        head: 7,
    })

    // Origin-to-state solid vectors
    for (const m of MODES) {
        const col = colOf(m.tone)
        const ex = plot.px(m.x)
        const ey = plot.py(m.y)
        fig.arrow(ox, oy, ex, ey, { color: col, width: 2.8, head: 7 })
        fig.circle(ex, ey, 5.5, { fill: col, stroke: c.bg, width: 1.8 })
    }

    // Direct endpoint labels (positioned cleanly in open space clear of vector shafts)
    fig.text(mx + 12, my - 12, 'Masked [0.49, 0.64]', {
        size: 16,
        mono: true,
        weight: 750,
        color: green,
    })
    fig.text(plot.px(0.02), plot.py(0.8), 'Zero', {
        size: 15,
        mono: true,
        weight: 750,
        color: amberText,
    })
    fig.text(plot.px(0.02), plot.py(0.66), '[0.30, 0.37]', {
        size: 14.5,
        mono: true,
        weight: 700,
        color: amberText,
    })
    fig.arrow(plot.px(0.22), plot.py(0.58), zx - 5, zy - 6, {
        color: amberMark,
        width: 1.6,
        head: 5,
    })
    fig.callout([nx - 8, ny + 2], [plot.px(0.68), plot.py(-0.96)], '[9,−9,9] [1.00, −0.89]', {
        color: red,
        labelColor: red,
        size: 15,
        mono: true,
        weight: 750,
        bend: 0.1,
        align: 'right',
        head: 5,
    })
    fig.text(plot.px(0.8), plot.py(-0.1), 'drift = 1.612', {
        size: 14,
        mono: true,
        color: red,
        weight: 650,
        align: 'left',
    })

    // Vertical divider
    fig.line(446, 66, 446, height - 18, { color: c.borderSubtle, width: 1.25 })

    // ── Bottom Right: Clean L2 Drift Bars ───────────────────────────────────
    fig.text(468, 78, 'L2 drift ‖h₃ − h₂‖₂', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })
    fig.text(468, 108, 'Distance from true length-2 state h₂', {
        size: 16,
        color: c.textSecondary,
    })

    const barLeft = 468
    const barMaxW = 228

    MODES.forEach((m, i) => {
        const yTitle = 160 + i * 82
        const yBar = yTitle + 24
        const col = colOf(m.tone)
        const ink = inkOf(m.tone)
        const w = m.drift === 0 ? 6 : Math.round((m.drift / 1.7) * barMaxW)

        fig.text(barLeft, yTitle, m.label, { size: 18, weight: 700, color: ink })
        fig.rect(barLeft, yBar - 11, barMaxW, 22, {
            fill: c.bgSubtle,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 4,
        })
        fig.rect(barLeft, yBar - 11, w, 22, { fill: col, radius: 4 })
        fig.text(barLeft + barMaxW + 12, yBar, m.drift.toFixed(3), {
            size: 19,
            mono: true,
            weight: 750,
            color: ink,
        })
    })

    fig.text(468, 412, 'Even a zero pad runs Wₕh₂ + b', {
        size: 16,
        mono: true,
        color: amberText,
        weight: 650,
    })

    return fig.render()
}

export default create('dark')
