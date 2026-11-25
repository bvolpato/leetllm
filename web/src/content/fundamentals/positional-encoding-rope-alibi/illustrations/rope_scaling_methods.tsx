import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 470
export const alt =
    'Top: frequency multiplier theta-prime over theta across 64 rotary pairs for 4K-to-16K (s=4) context extension. PI scales uniformly to 0.25x, NTK-aware (base 40,890) decays smoothly from 1.00x to 0.25x, and YaRN preserves fast pairs at 1.00x before ramping to 0.25x on slow pairs. Bottom-left: YaRN multipliers for d=8 pairs are 1.000, 1.000, 0.384, and 0.250. Bottom-right: YaRN attention scaling factors for s=4 are Base 1.000, Q/K amplitude a=1.139, logit scale a^2=1.296, and temperature t=0.771.'

const rotaryDim = 128
const base = 10000
const scale = 4
const trainLen = 4096
const ntkBase = base * scale ** (rotaryDim / (rotaryDim - 2)) // 40890

const ntkRatio = (pair: number) => (base / ntkBase) ** ((2 * pair) / rotaryDim)
const yarnRatio = (pair: number) => {
    const freq = base ** (-(2 * pair) / rotaryDim)
    const turns = (trainLen * freq) / (2 * Math.PI)
    const preserve = Math.min(1, Math.max(0, (turns - 1) / 31))
    return preserve + (1 - preserve) / scale
}

const d8Freqs = [1.0, 0.1, 0.01, 0.001]
const d8YarnRatios = d8Freqs.map((f) => {
    const turns = (trainLen * f) / (2 * Math.PI)
    const preserve = Math.min(1, Math.max(0, (turns - 1) / 31))
    return preserve + (1 - preserve) / scale
})

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // ─── TOP PLOT: Frequency multiplier across 64 rotary pairs ───
    const top = fig.plot({ x: 70, y: 36, width: 644, height: 176 }, { x: [-2.5, 64], y: [0, 1.12] })

    top.axes({
        xTicks: [0, 16, 32, 48, 63],
        yTicks: [0, 0.25, 0.5, 0.75, 1.0],
        xFormat: (v) => `i=${v}`,
        yFormat: (v) => v.toFixed(2),
        xLabel: 'Rotary pair index i  (d = 128, 4K → 16K, s = 4)',
        yLabel: "Frequency multiplier θ′ / θ",
        labelSize: 13.5,
        grid: true,
    })

    // Subtle shaded YaRN transition ramp band (where 0 < preserve < 1, roughly pairs 18..43)
    const rampStart = top.px(18)
    const rampEnd = top.px(44)
    fig.rect(rampStart, top.area.y, rampEnd - rampStart, top.area.height, {
        fill: tint(blue, c.bg, theme === 'dark' ? 0.1 : 0.08),
    })
    fig.text((rampStart + rampEnd) / 2, top.area.y + 13, 'YaRN ramp', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Curves (dense 128-point sampling for crisp smooth curves)
    top.fn(() => 0.25, { color: warm, width: 2.3, dash: '6 4' }, 64, [0, 63])
    top.fn(ntkRatio, { color: green, width: 2.6 }, 160, [0, 63])
    top.fn(yarnRatio, { color: blue, width: 2.85 }, 160, [0, 63])

    // Direct non-colliding curve labels
    fig.text(top.px(9), top.py(1.0) - 13, 'YaRN (band-preserving)', {
        size: 13.5,
        color: blue,
        align: 'center',
        weight: 700,
    })
    fig.text(top.px(6), top.py(0.56), 'NTK-aware (b′ = 40,890)', {
        size: 13.5,
        color: green,
        align: 'left',
        weight: 700,
    })
    fig.text(top.px(61), top.py(0.12), 'PI (0.25× uniform)', {
        size: 13.5,
        color: warm,
        align: 'right',
        weight: 700,
    })

    // Divider line
    fig.line(24, 262, width - 24, 262, { color: c.borderSubtle, width: 1 })

    // ─── BOTTOM-LEFT: YaRN ratios for d = 8 toy example ───
    fig.text(68, 282, 'YaRN ratios (d = 8)', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    const bl = fig.plot({ x: 68, y: 308, width: 280, height: 126 }, { x: [0, 4], y: [0, 1.2] })
    for (const tick of [0, 0.5, 1.0]) {
        const py = bl.py(tick)
        fig.line(bl.area.x, py, bl.right, py, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
        })
        fig.text(bl.area.x - 8, py, tick.toFixed(1), {
            size: 13.5,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(bl.area.x, bl.area.y, bl.area.x, bl.bottom, { color: c.textMuted, width: 1 })

    const blItems = [
        { label: 'i=0', val: d8YarnRatios[0]!, col: blue },
        { label: 'i=1', val: d8YarnRatios[1]!, col: blue },
        { label: 'i=2', val: d8YarnRatios[2]!, col: warm },
        { label: 'i=3', val: d8YarnRatios[3]!, col: green },
    ]
    const blSlot = bl.area.width / 4
    blItems.forEach((item, idx) => {
        const cx = bl.area.x + (idx + 0.5) * blSlot
        const y0 = bl.py(0)
        const y1 = bl.py(item.val)
        fig.rect(cx - 21, y1, 42, y0 - y1, {
            fill: tint(item.col, c.bg, theme === 'dark' ? 0.36 : 0.25),
            stroke: item.col,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(cx, y1 - 12, item.val.toFixed(3), {
            size: 13,
            color: item.col,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(cx, bl.bottom + 16, item.label, {
            size: 13.5,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 600,
        })
    })

    // ─── BOTTOM-RIGHT: YaRN attention scaling (s = 4) ───
    fig.text(426, 282, 'YaRN attention scaling (s = 4)', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    const br = fig.plot({ x: 426, y: 308, width: 288, height: 126 }, { x: [0, 4], y: [0, 1.55] })
    for (const tick of [0, 0.5, 1.0, 1.5]) {
        const py = br.py(tick)
        fig.line(br.area.x, py, br.right, py, {
            color: tick === 0 ? c.textMuted : tick === 1 ? c.borderLight : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
            dash: tick === 1 ? '4 4' : undefined,
        })
        fig.text(br.area.x - 8, py, tick.toFixed(1), {
            size: 13.5,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(br.area.x, br.area.y, br.area.x, br.bottom, { color: c.textMuted, width: 1 })

    const brItems = [
        { label: 'Base', val: 1.0, col: c.textSecondary },
        { label: 'Q/K (a)', val: 1.139, col: blue },
        { label: 'a²', val: 1.296, col: warm },
        { label: 't = 1/a²', val: 0.771, col: green },
    ]
    const brSlot = br.area.width / 4
    brItems.forEach((item, idx) => {
        const cx = br.area.x + (idx + 0.5) * brSlot
        const y0 = br.py(0)
        const y1 = br.py(item.val)
        fig.rect(cx - 21, y1, 42, y0 - y1, {
            fill: tint(item.col, c.bg, theme === 'dark' ? 0.34 : 0.24),
            stroke: item.col,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(cx, y1 - 12, item.val.toFixed(3), {
            size: 13,
            color: item.col,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(cx, br.bottom + 16, item.label, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 600,
        })
    })

    return fig.render()
}

export default create('dark')
