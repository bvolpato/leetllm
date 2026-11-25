import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 472
export const alt =
    'Six activation functions share equal scales for input z and output f(z) from minus 3 to 3. The linear reference runs at 45 degrees; sigmoid and tanh saturate in their tails; ReLU clips negatives to zero; and GELU and SiLU retain smooth negative dips. A zoomed inset at z = -1 highlights ReLU = 0, GELU = -0.159, and SiLU = -0.269.'

function erf(x: number): number {
    const sign = x < 0 ? -1 : 1
    const a = Math.abs(x)
    const t = 1 / (1 + 0.3275911 * a)
    const y =
        1 -
        ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
            0.254829592) *
            t *
            Math.exp(-a * a)
    return sign * y
}

function sigmoid(z: number): number {
    if (z >= 0) return 1 / (1 + Math.exp(-z))
    const ez = Math.exp(z)
    return ez / (1 + ez)
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'
    const neutral = c.textMuted

    const funcs = [
        { name: 'Linear', color: neutral, textColor: c.textSecondary, dash: '6 5', width: 2.2, f: (z: number) => z },
        { name: 'Sigmoid', color: amberMark, textColor: amberText, width: 2.6, f: sigmoid },
        { name: 'Tanh', color: red, textColor: red, width: 2.6, f: Math.tanh },
        { name: 'ReLU', color: green, textColor: green, width: 2.8, f: (z: number) => Math.max(0, z) },
        { name: 'GELU', color: blue, textColor: blue, width: 2.8, f: (z: number) => z * 0.5 * (1 + erf(z / Math.SQRT2)) },
        { name: 'SiLU', color: purple, textColor: purple, width: 2.8, f: (z: number) => z * sigmoid(z) },
    ] as const

    // ── Left: Equal-scale [-3, 3] x [-3, 3] plot ────────────────────────────
    fig.text(24, 24, 'Shared scale: z, f(z) ∈ [−3, 3]', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })

    const main = fig.plot(
        { x: 66, y: 66, width: 344, height: 344 },
        { x: [-3, 3], y: [-3, 3] },
    )
    main.axes({
        xTicks: [-3, -1, 0, 1, 3],
        yTicks: [-3, -1, 0, 1, 3],
        grid: true,
        labelSize: 17,
        xLabel: 'Input z',
        yLabel: 'f(z)',
    })

    // Zero crosshairs
    main.hline(0, undefined, { color: c.border, width: 1.2, dash: '' })
    main.vline(0, undefined, { color: c.border, width: 1.2, dash: '' })
    // z = -1 reference line
    main.vline(-1, undefined, { color: purple, width: 1.4, dash: '4 4', opacity: 0.75 })

    // Subtle highlight box showing zoomed region on main plot
    const zx1 = main.px(-2.4)
    const zx2 = main.px(0.4)
    const zy1 = main.py(0.45)
    const zy2 = main.py(-0.45)
    fig.rect(zx1, zy1, zx2 - zx1, zy2 - zy1, {
        fill: tint(purple, c.bg, isLight ? 0.06 : 0.1),
        stroke: purple,
        strokeWidth: 1.1,
        radius: 3,
    })

    // Draw all 6 curves
    for (const fn of funcs) {
        main.fn(fn.f, {
            color: fn.color,
            width: fn.width,
            dash: 'dash' in fn ? fn.dash : undefined,
        }, 160)
    }

    // Points at z = -1
    for (const fn of funcs) {
        main.point(-1, fn.f(-1), { color: fn.color, r: 4 })
    }

    // Direct curve endpoint labels on main plot (clear of curves)
    fig.text(main.px(2.4), main.py(2.82), 'Linear / ReLU', {
        size: 16,
        color: green,
        align: 'right',
        weight: 650,
    })
    fig.text(main.px(2.95), main.py(0.45), 'Sigmoid & Tanh', {
        size: 16,
        color: amberText,
        align: 'right',
        weight: 650,
    })
    fig.text(main.px(-2.92), main.py(-1.26), 'Tanh → −1', {
        size: 15,
        color: red,
        weight: 650,
    })
    fig.text(main.px(-1.7), main.py(-2.45), 'Linear', {
        size: 16,
        color: c.textSecondary,
        weight: 600,
    })

    // ── Right upper: Zoomed dip at z = -1 ───────────────────────────────────
    fig.text(468, 24, 'Zoom: negative dip at z = −1', {
        size: 21,
        weight: 750,
        color: purple,
    })

    const zoom = fig.plot(
        { x: 506, y: 66, width: 266, height: 224 },
        { x: [-2.4, 0.5], y: [-0.45, 0.45] },
    )
    zoom.axes({
        xTicks: [-2, -1, 0],
        yTicks: [-0.4, -0.2, 0, 0.2, 0.4],
        grid: true,
        labelSize: 16,
    })
    zoom.hline(0, undefined, { color: c.border, width: 1.1, dash: '' })
    zoom.vline(-1, 'z = −1', {
        color: purple,
        width: 1.6,
        dash: '4 4',
        labelPosition: 'top',
        labelSize: 16,
        labelColor: purple,
        align: 'left',
    })

    const dipFuncs = funcs.slice(3) // ReLU, GELU, SiLU
    for (const fn of dipFuncs) {
        zoom.fn(fn.f, { color: fn.color, width: 3 }, 140)
        zoom.point(-1, fn.f(-1), { color: fn.color, r: 5.5 })
    }

    // Crisp direct callouts placed in wide-open whitespace clear of curves and axes
    fig.callout([zoom.px(-1) - 5, zoom.py(0) - 4], [zoom.px(-1.32), zoom.py(0.28)], 'ReLU = 0', {
        color: green,
        labelColor: green,
        size: 16,
        weight: 700,
        mono: true,
        bend: 0.14,
        align: 'right',
        head: 5,
    })
    fig.callout(
        [zoom.px(-1) - 6, zoom.py(-0.159)],
        [zoom.px(-1.32), zoom.py(0.1)],
        'GELU −.159',
        {
            color: blue,
            labelColor: blue,
            size: 16,
            weight: 700,
            mono: true,
            bend: 0.12,
            align: 'right',
            head: 5,
        },
    )
    fig.callout(
        [zoom.px(-1) + 4, zoom.py(-0.269) + 5],
        [zoom.px(-0.62), zoom.py(-0.37)],
        'SiLU −.269',
        {
            color: purple,
            labelColor: purple,
            size: 16,
            weight: 700,
            mono: true,
            bend: 0.14,
            align: 'left',
            head: 5,
        },
    )

    // ── Right lower: Compact 2x3 color legend ───────────────────────────────
    fig.line(468, 336, 774, 336, { color: c.borderSubtle, width: 1.1 })
    funcs.forEach((fn, idx) => {
        const col = idx % 3
        const row = Math.floor(idx / 3)
        const lx = 468 + col * 106
        const ly = 368 + row * 40
        fig.line(lx, ly, lx + 20, ly, {
            color: fn.color,
            width: 3,
            dash: 'dash' in fn ? fn.dash : undefined,
        })
        fig.text(lx + 26, ly, fn.name, {
            size: 17,
            color: fn.textColor,
            weight: 650,
            width: 78,
        })
    })

    return fig.render()
}

export default create('dark')
