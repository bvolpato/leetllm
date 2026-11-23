import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'
export const width = 660
export const height = 760
export const alt =
    'Three vectors share equal feature axes from zero to one. Rain at 0.9, 0.1 and storm at 0.8, 0.3 make a small angle with cosine 0.97. Invoice at 0.1, 0.9 makes a wider angle with rain and cosine 0.22. The table beside the formulas compares dot products and cosine values for the same pairs.'
const vectors = { rain: [0.9, 0.1], storm: [0.8, 0.3], invoice: [0.1, 0.9] } as const
const dot = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]!
const cosine = (a: readonly number[], b: readonly number[]) =>
    dot(a, b) / Math.sqrt(dot(a, a) * dot(b, b))
export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height),
        { c } = fig
    const blue = fig.tone('blue'),
        cyan = fig.tone('cyan'),
        warm = fig.tone('warm')
    const plot = fig.plot({ x: 112, y: 52, width: 410, height: 390 }, { x: [0, 1], y: [0, 1] })
    for (const v of [0, 0.5, 1]) {
        fig.line(plot.px(v), 52, plot.px(v), 442, { color: c.border, width: 1 })
        fig.line(112, plot.py(v), 522, plot.py(v), { color: c.border, width: 1 })
        fig.text(plot.px(v), 472, String(v), {
            size: 24,
            mono: true,
            align: 'center',
            color: c.textSecondary,
        })
        if (v)
            fig.text(88, plot.py(v), String(v), {
                size: 24,
                mono: true,
                align: 'right',
                color: c.textSecondary,
            })
    }
    fig.text(32, 20, 'Feature 2 ↑', { size: 24, color: c.textSecondary })
    fig.text(317, 506, 'Feature 1 →', { size: 24, color: c.textSecondary, align: 'center' })
    const arc = (from: readonly number[], to: readonly number[], r: number, color: string) => {
        const a = Math.atan2(from[1]!, from[0]!),
            b = Math.atan2(to[1]!, to[0]!)
        fig.polyline(
            Array.from({ length: 25 }, (_, i) => {
                const t = a + ((b - a) * i) / 24
                return [plot.px(r * Math.cos(t)), plot.py(r * Math.sin(t))] as const
            }),
            { color, width: 2 },
        )
    }
    arc(vectors.rain, vectors.storm, 0.52, cyan)
    arc(vectors.rain, vectors.invoice, 0.3, warm)
    const draw = (v: readonly number[], color: string, label: string, dx: number, dy: number) => {
        fig.arrow(plot.px(0), plot.py(0), plot.px(v[0]!), plot.py(v[1]!), {
            color,
            width: 3,
            head: 14,
        })
        fig.text(plot.px(v[0]!) + dx, plot.py(v[1]!) + dy, label, {
            color,
            weight: 600,
            size: 25,
            width: 140,
        })
    }
    draw(vectors.rain, blue, 'rain', 16, -20)
    draw(vectors.storm, cyan, 'storm', -28, -34)
    draw(vectors.invoice, warm, 'invoice', 30, -10)
    fig.text(36, 550, 'Pair', { size: 23, color: c.textSecondary })
    fig.text(390, 550, 'Dot', { size: 23, color: c.textSecondary, align: 'right' })
    fig.text(590, 550, 'Cosine', { size: 23, color: c.textSecondary, align: 'right' })
    ;[
        ['rain, storm', vectors.rain, vectors.storm, cyan],
        ['rain, invoice', vectors.rain, vectors.invoice, warm],
    ].forEach(([name, a, b, color], i) => {
        const y = 594 + i * 46
        fig.text(36, y, name as string, { size: 25, color: color as string, width: 260 })
        fig.text(390, y, dot(a as readonly number[], b as readonly number[]).toFixed(2), {
            size: 25,
            mono: true,
            align: 'right',
        })
        fig.text(590, y, cosine(a as readonly number[], b as readonly number[]).toFixed(2), {
            size: 25,
            mono: true,
            align: 'right',
        })
    })
    fig.math(36, 696, '\\mathbf{a}\\cdot\\mathbf{b}=\\sum_i a_i b_i', { size: 24 })
    fig.math(
        336,
        696,
        '\\cos\\theta=\\frac{\\mathbf{a}\\cdot\\mathbf{b}}{\\lVert\\mathbf{a}\\rVert\\,\\lVert\\mathbf{b}\\rVert}',
        { size: 24 },
    )
    return fig.render()
}
