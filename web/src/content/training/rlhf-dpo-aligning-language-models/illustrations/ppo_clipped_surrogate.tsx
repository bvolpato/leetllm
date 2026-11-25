import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 405
export const alt =
    'Two side-by-side PPO clipped-surrogate panels show the probability ratio from 0.5 to 1.5 with epsilon 0.2. For positive advantage A > 0 (left), the solid clipped objective flattens at +1.2 once ratio exceeds 1.2 while the dashed unclipped line keeps climbing. For negative advantage A < 0 (right), the solid clipped objective flattens at -0.8 below 0.8 while still penalizing harmful moves above 1.0.'

const eps = 0.2

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')
    const muted = c.textSecondary

    // Equation centered at top
    fig.math(
        width / 2,
        24,
        String.raw`\mathcal{L}^{\mathrm{CLIP}}_t = \min\!\big(\rho_t \hat{A}_t,\;\operatorname{clip}(\rho_t, 1-\epsilon, 1+\epsilon)\hat{A}_t\big),\quad \epsilon = 0.2`,
        { size: 15, color: c.textPrimary, align: 'center' },
    )

    // Left Panel: A = +1 (y in [0.4, 1.6])
    const leftArea = { x: 64, y: 84, width: 274, height: 228 }
    const pPos = fig.plot(leftArea, { x: [0.5, 1.5], y: [0.4, 1.6] })

    // Shaded unclipped trust region [0.8, 1.2]
    fig.rect(pPos.px(0.8), leftArea.y, pPos.px(1.2) - pPos.px(0.8), leftArea.height, {
        fill: tint(blue, c.bg, 0.09),
    })

    pPos.axes({
        xTicks: [0.5, 0.8, 1.0, 1.2, 1.5],
        yTicks: [0.5, 0.8, 1.0, 1.2, 1.5],
        xLabel: 'Policy ratio ρₜ',
        yLabel: 'A = +1  (good action)',
        grid: true,
        labelSize: 14,
        xFormat: (v) => v.toFixed(1),
        yFormat: (v) => `+${v.toFixed(1)}`,
    })

    pPos.vline(0.8, undefined, { color: c.textMuted, dash: '3 3', width: 1.1 })
    pPos.vline(1.2, '1+ε', {
        color: green,
        dash: '4 3',
        width: 1.25,
        labelPosition: 'bottom',
        labelOffset: 16,
        labelSize: 14,
    })

    // Unclipped (dashed) & Clipped (solid)
    pPos.curve(
        [
            [0.5, 0.5],
            [1.5, 1.5],
        ],
        { color: green, width: 1.75, dash: '5 4', opacity: 0.7 },
    )
    pPos.curve(
        [
            [0.5, 0.5],
            [1.2, 1.2],
            [1.5, 1.2],
        ],
        { color: green, width: 3.2 },
    )
    pPos.point(1.2, 1.2, { color: green, r: 4.5 })
    fig.text(pPos.px(1.36), pPos.py(1.2) + 20, 'flat ceiling', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(pPos.px(1.49), pPos.py(1.52), 'unclipped', {
        size: 14,
        color: muted,
        align: 'right',
    })

    // Right Panel: A = -1 (y in [-1.6, -0.4])
    const rightArea = { x: 422, y: 84, width: 274, height: 228 }
    const pNeg = fig.plot(rightArea, { x: [0.5, 1.5], y: [-1.6, -0.4] })

    fig.rect(pNeg.px(0.8), rightArea.y, pNeg.px(1.2) - pNeg.px(0.8), rightArea.height, {
        fill: tint(blue, c.bg, 0.09),
    })

    pNeg.axes({
        xTicks: [0.5, 0.8, 1.0, 1.2, 1.5],
        yTicks: [-1.5, -1.2, -1.0, -0.8, -0.5],
        xLabel: 'Policy ratio ρₜ',
        yLabel: 'A = −1  (bad action)',
        grid: true,
        labelSize: 14,
        xFormat: (v) => v.toFixed(1),
        yFormat: (v) => `−${Math.abs(v).toFixed(1)}`,
    })

    pNeg.vline(0.8, '1−ε', {
        color: red,
        dash: '4 3',
        width: 1.25,
        labelPosition: 'top',
        labelOffset: 16,
        labelSize: 14,
    })
    pNeg.vline(1.2, undefined, { color: c.textMuted, dash: '3 3', width: 1.1 })

    pNeg.curve(
        [
            [0.5, -0.5],
            [1.5, -1.5],
        ],
        { color: red, width: 1.75, dash: '5 4', opacity: 0.7 },
    )
    pNeg.curve(
        [
            [0.5, -0.8],
            [0.8, -0.8],
            [1.5, -1.5],
        ],
        { color: red, width: 3.2 },
    )
    pNeg.point(0.8, -0.8, { color: red, r: 4.5 })
    fig.text(pNeg.px(0.66), pNeg.py(-0.8) + 20, 'flat ceiling', {
        size: 14,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.text(pNeg.px(1.01), pNeg.py(-1.46), 'still penalized', {
        size: 14,
        weight: 600,
        color: red,
        align: 'center',
    })

    // Compact legend footer
    const ly = 382
    fig.line(180, ly, 206, ly, { color: c.textPrimary, width: 3 })
    fig.text(214, ly, 'Clipped surrogate', { size: 14, weight: 600, color: c.textPrimary })
    fig.line(366, ly, 392, ly, { color: muted, width: 1.8, dash: '5 4' })
    fig.text(400, ly, 'Unclipped', { size: 14, color: muted })
    fig.rect(496, ly - 6, 16, 12, { fill: tint(blue, c.bg, 0.18), radius: 2 })
    fig.text(520, ly, `Trust band [${(1 - eps).toFixed(1)}, ${(1 + eps).toFixed(1)}]`, {
        size: 14,
        color: muted,
    })

    return fig.render()
}

export default create('dark')
