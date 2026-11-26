import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 370
export const alt =
    'Validation cross-entropy falls from the 9.769 uniform baseline (ln 17,485) to 6.050 at step 81 (17.1% accuracy, fragmented stopwords "And the I the / And it .") and 5.550 at step 321 (18.3% accuracy, short Shakespearean clauses "I is the king : / The lord ?").'

const points: readonly (readonly [number, number])[] = [
    [1, 9.535],
    [41, 6.416],
    [81, 6.05],
    [161, 5.747],
    [241, 5.721],
    [321, 5.55],
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const muted = c.textSecondary

    // Left: Validation Cross-Entropy Curve
    fig.text(24, 22, 'Validation cross-entropy (nats / token)', { size: 14, weight: 700 })
    const area = { x: 64, y: 58, width: 342, height: 248 }
    const plot = fig.plot(area, { x: [0, 340], y: [5.0, 10.2] })

    plot.axes({
        xTicks: [1, 81, 161, 241, 321],
        yTicks: [5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
        xLabel: 'Optimizer step',
        grid: true,
        labelSize: 12,
        yFormat: (v) => v.toFixed(1),
    })

    // Uniform reference baseline ln(17,485) = 9.769
    plot.hline(9.769, 'Uniform ln(17,485) = 9.77', {
        color: warm,
        dash: '5 4',
        width: 1.5,
        labelPosition: 'right',
        labelOffset: 10,
        labelSize: 12,
    })

    plot.fillArea(points, { baseline: 5.0, fill: cyan, fillOpacity: 0.08, stroke: false })
    plot.curve(points, { color: cyan, width: 2.8 })

    points.forEach(([x, y]) => {
        const is81 = x === 81
        const is321 = x === 321
        const col = is81 ? warm : is321 ? green : cyan
        plot.point(x, y, { color: col, r: is81 || is321 ? 6 : 4 })
    })

    // Direct callout labels for key checkpoints on plot
    fig.text(plot.px(81) + 10, plot.py(6.05) - 18, 'Step 81: 6.050', {
        size: 12,
        mono: true,
        weight: 700,
        color: warm,
    })
    fig.text(plot.px(321) - 6, plot.py(5.55) - 18, 'Step 321: 5.550', {
        size: 12,
        mono: true,
        weight: 700,
        color: green,
        align: 'right',
    })

    // Right: Two crisp checkpoint sample cards (linked visually to steps 81 and 321)
    const rx = 438
    const rw = 300

    // Checkpoint 1: Update 81
    const c1Y = 58
    fig.rect(rx, c1Y, rw, 124, {
        fill: tint(warm, c.bg, 0.08),
        stroke: tint(warm, c.bg, 0.45),
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(rx + 14, c1Y + 20, 'Step 81 · Early checkpoint', {
        size: 14,
        weight: 700,
        color: warm,
    })
    fig.text(rx + 14, c1Y + 42, 'Loss 6.050 nats  ·  Acc 17.1%', {
        size: 12,
        mono: true,
        color: muted,
    })
    fig.rect(rx + 14, c1Y + 56, rw - 28, 34, {
        fill: tint(c.textMuted, c.bg, 0.08),
        radius: 5,
    })
    fig.text(rx + 22, c1Y + 73, '“And the I the / And it .”', {
        size: 12,
        mono: true,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rx + 14, c1Y + 106, 'Frequent stopwords only; syntax absent', {
        size: 12,
        color: muted,
    })

    // Checkpoint 2: Update 321
    const c2Y = 204
    fig.rect(rx, c2Y, rw, 124, {
        fill: tint(green, c.bg, 0.08),
        stroke: tint(green, c.bg, 0.45),
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(rx + 14, c2Y + 20, 'Step 321 · Later checkpoint', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.text(rx + 14, c2Y + 42, 'Loss 5.550 nats  ·  Acc 18.3%', {
        size: 12,
        mono: true,
        color: muted,
    })
    fig.rect(rx + 14, c2Y + 56, rw - 28, 34, {
        fill: tint(c.textMuted, c.bg, 0.08),
        radius: 5,
    })
    fig.text(rx + 22, c2Y + 73, '“I is the king : / The lord ?”', {
        size: 12,
        mono: true,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rx + 14, c2Y + 106, 'Short Shakespearean clauses & punctuation', {
        size: 12,
        color: muted,
    })

    return fig.render()
}

export default create('dark')
