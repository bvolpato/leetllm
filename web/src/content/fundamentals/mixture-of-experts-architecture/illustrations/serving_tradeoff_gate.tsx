import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Consistent color-coded comparison of Dense (blue) vs MoE (green) across three serving criteria. Quality: Dense 0.82 and MoE 0.83 both pass the 0.82 floor. Throughput: MoE reaches 1,100 tokens/s (+34.1%), passing the 1,000 tokens/s floor while Dense fails at 820. Tail latency p95: Dense is 48 ms and MoE is 55 ms (+7 ms), so MoE passes a 60 ms cap but fails a stricter 50 ms cap.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    // Strict consistent color semantics across ALL 3 plots:
    const denseCol = fig.tone('blue')
    const moeCol = fig.tone('green')
    const warn = fig.tone('warm')
    const red = fig.tone('red')

    const fill = (col: string) => tint(col, c.bg, isLight ? 0.22 : 0.36)

    // Top legend swatches (single source of color meaning)
    fig.rect(24, 14, 14, 14, { fill: fill(denseCol), stroke: denseCol, strokeWidth: 1.5, radius: 3 })
    fig.text(46, 21, 'Dense baseline', { size: 13.5, weight: 700, color: denseCol })

    fig.rect(192, 14, 14, 14, { fill: fill(moeCol), stroke: moeCol, strokeWidth: 1.5, radius: 3 })
    fig.text(214, 21, 'MoE candidate (+34.1% TPS, +7 ms p95)', { size: 13.5, weight: 700, color: moeCol })

    const chartY = 76
    const chartH = 212
    const bw = 46

    // 1. Quality panel (0.75 .. 0.88, floor at 0.82)
    const qX = 64
    const qW = 166
    fig.text(qX + qW / 2, 50, 'Quality (floor ≥ 0.82)', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    const qPlot = fig.plot({ x: qX, y: chartY, width: qW, height: chartH }, { x: [0, 2], y: [0.75, 0.88] })
    qPlot.axes({
        xTicks: [],
        yTicks: [0.76, 0.8, 0.84, 0.88],
        yFormat: (v) => v.toFixed(2),
        grid: true,
        labelSize: 12,
    })
    qPlot.hline(0.82, undefined, {
        color: c.textMuted,
        dash: '4 4',
    })
    ;[
        { label: 'Dense', val: 0.82, col: denseCol },
        { label: 'MoE', val: 0.83, col: moeCol },
    ].forEach((b, i) => {
        const cx = qPlot.px(i + 0.5)
        const top = qPlot.py(b.val)
        fig.rect(cx - bw / 2, top, bw, qPlot.bottom - top, {
            fill: fill(b.col),
            stroke: b.col,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(cx, top - 11, b.val.toFixed(2), {
            size: 13,
            weight: 700,
            color: b.col,
            align: 'center',
            mono: true,
        })
        fig.text(cx, qPlot.bottom + 15, b.label, {
            size: 12.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    })

    // 2. Throughput panel (0 .. 1300 tok/s, floor at 1000)
    const tX = 304
    const tW = 172
    fig.text(tX + tW / 2, 52, 'Throughput (tok/s)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    const tPlot = fig.plot({ x: tX, y: chartY, width: tW, height: chartH }, { x: [0, 2], y: [0, 1300] })
    tPlot.axes({
        xTicks: [],
        yTicks: [0, 400, 800, 1200],
        grid: true,
        labelSize: 12,
    })
    tPlot.hline(1000, 'floor 1,000', {
        color: red,
        dash: '4 4',
        labelPosition: 'left',
        labelSize: 11.5,
        labelOffset: 10,
        weight: 700,
    })
    ;[
        { label: 'Dense', val: 820, text: '820', col: denseCol },
        { label: 'MoE', val: 1100, text: '1,100', col: moeCol },
    ].forEach((b, i) => {
        const cx = tPlot.px(i + 0.5)
        const top = tPlot.py(b.val)
        fig.rect(cx - bw / 2, top, bw, tPlot.bottom - top, {
            fill: fill(b.col),
            stroke: b.col,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(cx, top - 11, b.text, {
            size: 13,
            weight: 700,
            color: b.col,
            align: 'center',
            mono: true,
        })
        fig.text(cx, tPlot.bottom + 15, b.label, {
            size: 12.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    })

    // 3. p95 Latency panel (0 .. 80 ms, caps at 60 ms and 50 ms)
    const lX = 540
    const lW = 152
    fig.text(lX + lW / 2, 50, 'p95 Latency (ms)', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    const lPlot = fig.plot({ x: lX, y: chartY, width: lW, height: chartH }, { x: [0, 2], y: [0, 80] })
    lPlot.axes({
        xTicks: [],
        yTicks: [0, 20, 40, 60, 80],
        grid: true,
        labelSize: 12,
    })
    lPlot.hline(60, undefined, { color: warn, dash: '4 4' })
    fig.text(lPlot.right + 6, lPlot.py(60), '60 cap', {
        size: 11.5,
        weight: 700,
        color: warn,
        mono: true,
    })
    lPlot.hline(50, undefined, { color: red, dash: '4 4' })
    fig.text(lPlot.right + 6, lPlot.py(50), '50 cap', {
        size: 11.5,
        weight: 700,
        color: red,
        mono: true,
    })
    ;[
        { label: 'Dense', val: 48, text: '48', col: denseCol },
        { label: 'MoE', val: 55, text: '55', col: moeCol },
    ].forEach((b, i) => {
        const cx = lPlot.px(i + 0.5)
        const top = lPlot.py(b.val)
        fig.rect(cx - bw / 2, top, bw, lPlot.bottom - top, {
            fill: fill(b.col),
            stroke: b.col,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(cx, top + 14, b.text, {
            size: 13,
            weight: 700,
            color: b.col,
            align: 'center',
            mono: true,
        })
        fig.text(cx, lPlot.bottom + 15, b.label, {
            size: 12.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    })

    // Bottom crisp verdict strip (replaces colliding DataTable)
    const sepY = 326
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })
    const pills = [
        { x: 24, w: 224, label: 'Dense: fails TPS (820 < 1k)', col: red },
        { x: 262, w: 236, label: 'MoE @ 60 ms cap: PASSES all 3', col: moeCol },
        { x: 512, w: 224, label: 'MoE @ 50 ms cap: fails p95', col: red },
    ]
    for (const p of pills) {
        fig.rect(p.x, sepY + 18, p.w, 34, {
            fill: tint(p.col, c.bg, isLight ? 0.1 : 0.18),
            stroke: p.col,
            strokeWidth: 1.3,
            radius: 17,
        })
        fig.text(p.x + p.w / 2, sepY + 35, p.label, {
            size: 12.5,
            weight: 700,
            color: p.col,
            align: 'center',
        })
    }

    return fig.render()
}

export default create('dark')
