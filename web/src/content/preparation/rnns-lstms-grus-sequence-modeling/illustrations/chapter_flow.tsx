import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 448
export const alt =
    'Dual vanishing-gradient view over 12 backward steps. Left chart plots smooth exponential curves gamma to the k on a uniform axis from k=0 to 12: 0.98 keeps 0.785, 0.60 drops to 0.002, and 0.28 vanishes near zero. Right ribbons visualize gradient-flow thickness tapering across 12 steps for each factor, alongside the 3-step scalar tanh product 0.0195.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const green = fig.tone('green')
    const red = fig.tone('critical')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    const series = [
        {
            gamma: 0.98,
            label: 'γ = 0.98',
            role: 'Gated highway',
            endText: '0.785',
            color: green,
            textColor: green,
        },
        {
            gamma: 0.6,
            label: 'γ = 0.60',
            role: 'Moderate decay',
            endText: '0.002',
            color: amberMark,
            textColor: amberText,
        },
        {
            gamma: 0.28,
            label: 'γ = 0.28',
            role: 'Saturated tanh',
            endText: '2×10⁻⁷',
            color: red,
            textColor: red,
        },
    ] as const

    // ── Left: Smooth gamma^k curves on uniform k = 0..12 axis ───────────────
    fig.text(24, 24, '1. Exponential signal decay γᵏ', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 74, y: 74, width: 344, height: 298 },
        { x: [0, 12], y: [0, 1.05] },
    )
    plot.axes({
        xTicks: [0, 3, 6, 9, 12],
        yTicks: [0, 0.25, 0.5, 0.75, 1.0],
        grid: true,
        labelSize: 17,
        xLabel: 'Backward steps k',
        yLabel: 'Factor γᵏ',
    })

    // Subtle shaded area under the healthy 0.98^k curve
    plot.fillArea((k) => Math.pow(0.98, k), {
        fill: green,
        fillOpacity: 0.1,
        samples: 120,
    })

    for (const s of series) {
        plot.fn((k) => Math.pow(s.gamma, k), { color: s.color, width: 3.2 }, 140)
        plot.point(0, 1.0, { color: c.textPrimary, r: 4 })
        plot.point(12, Math.pow(s.gamma, 12), { color: s.color, r: 5 })
    }

    // Direct curve annotations
    fig.text(plot.px(8.4), plot.py(0.92), '0.98ᵏ → 0.785', {
        size: 17,
        mono: true,
        weight: 750,
        color: green,
        align: 'center',
    })
    fig.callout(
        [plot.px(2.4), plot.py(Math.pow(0.6, 2.4)) - 4],
        [plot.px(4.8), plot.py(0.46)],
        '0.60ᵏ → 0.002',
        {
            color: amberMark,
            labelColor: amberText,
            size: 17,
            mono: true,
            weight: 750,
            bend: -0.14,
            align: 'left',
            head: 5.5,
        },
    )
    fig.callout(
        [plot.px(1.3), plot.py(Math.pow(0.28, 1.3)) + 2],
        [plot.px(4.4), plot.py(0.16)],
        '0.28ᵏ → ~0',
        {
            color: red,
            labelColor: red,
            size: 17,
            mono: true,
            weight: 750,
            bend: 0.15,
            align: 'left',
            head: 5.5,
        },
    )

    // Vertical divider
    fig.line(440, 20, 440, height - 20, { color: c.borderSubtle, width: 1.25 })

    // ── Right: Tapering Gradient-Flow Ribbons across k = 0..12 ──────────────
    fig.text(462, 24, '2. Gradient-flow ribbon width', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })
    fig.text(462, 54, 'Ribbon thickness ∝ γᵏ across 12 hops', {
        size: 17,
        color: c.textSecondary,
    })

    const ribLeft = 468
    const ribWidth = 236
    const ribRight = ribLeft + ribWidth
    const maxHalfH = 24
    const ribbonYs = [132, 224, 316] as const

    // Vertical step ticks behind ribbons
    for (const step of [0, 4, 8, 12]) {
        const sx = ribLeft + (step / 12) * ribWidth
        fig.line(sx, 96, sx, 354, {
            color: c.borderSubtle,
            width: 1,
            dash: step === 0 || step === 12 ? undefined : '4 4',
        })
        fig.text(sx, 372, step === 0 ? 'k=0' : String(step), {
            size: 16,
            mono: true,
            color: c.textSecondary,
            align: 'center',
        })
    }

    series.forEach((s, idx) => {
        const cy = ribbonYs[idx]!
        const samples = 48
        const topPts: [number, number][] = []
        const botPts: [number, number][] = []
        for (let i = 0; i <= samples; i++) {
            const k = (i / samples) * 12
            const x = ribLeft + (k / 12) * ribWidth
            const halfH = Math.max(0.8, Math.pow(s.gamma, k) * maxHalfH)
            topPts.push([x, cy - halfH])
            botPts.push([x, cy + halfH])
        }
        const topD = topPts
            .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
            .join('')
        const botD = [...botPts]
            .reverse()
            .map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`)
            .join('')

        fig.path(`${topD}${botD}Z`, {
            fill: s.color,
            fillOpacity: isLight ? 0.72 : 0.78,
            color: s.color,
            width: 1.2,
        })

        // Label above ribbon
        fig.text(ribLeft, cy - 36, `${s.label} · ${s.role}`, {
            size: 17,
            weight: 700,
            color: s.textColor,
        })
        // Remaining value at k = 12 on the right
        fig.text(ribRight + 10, cy, s.endText, {
            size: 17,
            mono: true,
            weight: 750,
            color: s.textColor,
        })
    })

    // Worked 3-step scalar tanh note matching caption (single clean line)
    fig.text(462, 416, '3-step scalar RNN: ∂h₃/∂h₀ = 0.0195', {
        size: 15,
        mono: true,
        color: c.textSecondary,
        weight: 600,
        width: 330,
    })

    return fig.render()
}

export default create('dark')
