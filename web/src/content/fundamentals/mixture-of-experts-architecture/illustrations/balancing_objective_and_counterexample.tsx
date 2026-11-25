import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Left: Switch auxiliary balance terms f_i * p_i for four experts on a skewed batch are 0.330, 0.044, 0.0225, and 0.004, yielding N * sum(f_i * p_i) = 4 * 0.4005 = 1.602 versus uniform 1.00. Right: two-token, three-expert counterexample routing probabilities [[0.51, 0.09, 0.40], [0.09, 0.51, 0.40]] produce fractions [0.5, 0.5, 0.0] and score 3 * 0.30 = 0.90 < 1.0 even though E2 receives zero tokens.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const red = fig.tone('red')
    const neutral = c.textMuted

    // Left: Skewed batch Switch terms f_i * p_i
    const lx = 60
    const lw = 286
    fig.text(lx + lw / 2, 20, 'Skewed batch: fᵢ · pᵢ terms', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(lx + lw / 2, 42, 'Uniform routing gives 1.00', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const plot = fig.plot({ x: lx, y: 72, width: lw, height: 210 }, { x: [0, 4], y: [0, 0.4] })
    plot.axes({
        xTicks: [],
        yTicks: [0, 0.1, 0.2, 0.3, 0.4],
        yFormat: (v) => v.toFixed(1),
        grid: true,
        labelSize: 12,
    })

    const terms = [
        { name: 'E1', sub: '.60×.55', val: 0.33, text: '0.330', col: warm },
        { name: 'E2', sub: '.20×.22', val: 0.044, text: '0.044', col: blue },
        { name: 'E3', sub: '.15×.15', val: 0.0225, text: '0.023', col: blue },
        { name: 'E4', sub: '.05×.08', val: 0.004, text: '0.004', col: neutral },
    ] as const

    const bw = 42
    terms.forEach((t, i) => {
        const cx = plot.px(i + 0.5)
        const top = plot.py(t.val)
        fig.rect(cx - bw / 2, top, bw, Math.max(4, plot.bottom - top), {
            fill: tint(t.col, c.bg, isLight ? 0.24 : 0.38),
            stroke: t.col,
            strokeWidth: 1.5,
            radius: 4,
        })
        fig.text(cx, top - 11, t.text, {
            size: 12.5,
            weight: 700,
            color: t.col,
            align: 'center',
            mono: true,
        })
        fig.text(cx, plot.bottom + 15, t.name, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        fig.text(cx, plot.bottom + 32, t.sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    fig.math(lx + lw / 2, 356, 'N\\sum f_i p_i = 4 \\times 0.4005 = 1.602', {
        size: 14.5,
        color: warm,
        align: 'center',
    })

    // Vertical divider
    fig.line(378, 22, 378, height - 22, { color: c.borderSubtle, width: 1 })

    // Right: Counterexample 2x3 probability heatmap (high contrast in both light & dark)
    const rx = 478
    const rw = 250
    const rh = 132
    fig.text(570, 20, 'Counterexample: loss < 1 yet E2 starved', {
        size: 14.5,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.text(570, 42, 'Top-1 wins E0 & E1; E2 holds 0.40 prob but f₂ = 0', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.heatGrid(
        [
            [0.51, 0.09, 0.4],
            [0.09, 0.51, 0.4],
        ],
        { x: rx, y: 102, width: rw, height: rh },
        {
            scale: 'sequential',
            domain: [0, 0.65],
            rowLabels: ['Tok 0 (E0)', 'Tok 1 (E1)'],
            colLabels: ['E0 (f=.5)', 'E1 (f=.5)', 'E2 (f=0!)'],
            labelSize: 12.5,
            valueSize: 14,
            showValues: true,
            gap: 6,
            radius: 6,
            highlightCol: 2,
            highlightColor: red,
            rowLabelGap: 10,
            colLabelGap: 16,
        },
    )

    // Summary math & takeaway below heatmap
    fig.text(570, 266, 'Mean prob p = [0.30, 0.30, 0.40]', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    fig.text(570, 288, 'Token share f = [0.50, 0.50, 0.00]', {
        size: 13,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.math(570, 326, '3\\sum f_i p_i = 3(0.15 + 0.15 + 0) = 0.90 < 1.0', {
        size: 14.5,
        color: red,
        align: 'center',
    })
    fig.text(570, 358, 'Switch score drops below uniform despite dead expert E2', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
