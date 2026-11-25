import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 355
export const alt =
    'On one elapsed-time axis, Python enqueues CUDA work in 2 ms and returns while device work continues. CUDA events span 40 ms on the GPU stream. A synchronized host timer can report 42 ms in this example because it includes caller overhead and waiting; submission can overlap execution, so 2 plus 40 is not a general rule.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    fig.text(24, 20, 'Asynchronous CUDA launch: Python returns 38 ms before the GPU finishes', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const leftX = 24
    const chartW = 732
    const mapT = (ms: number) => leftX + (ms / 42) * chartW
    const topY = 58
    const axisY = 296

    // Subtle vertical time gridlines (omit 40 ms bottom tick text so 42 ms sits cleanly)
    for (const ms of [0, 10, 20, 30, 40]) {
        const tx = mapT(ms)
        fig.line(tx, topY, tx, axisY, {
            color: ms === 0 ? c.textMuted : c.borderSubtle,
            width: ms === 0 ? 1.5 : 1,
            dash: ms === 0 ? undefined : '3 3',
        })
        if (ms !== 40) {
            fig.text(tx, axisY + 18, `${ms} ms`, {
                size: 12,
                color: c.textSecondary,
                mono: true,
                align: ms === 0 ? 'left' : 'center',
            })
        }
    }
    // 42 ms end tick
    fig.line(mapT(42), topY, mapT(42), axisY, { color: green, width: 1.2, dash: '3 3', opacity: 0.6 })
    fig.text(mapT(42), axisY + 18, '42 ms', {
        size: 12,
        weight: 700,
        color: green,
        mono: true,
        align: 'right',
    })
    fig.line(leftX, axisY, leftX + chartW, axisY, { color: c.textMuted, width: 1.2 })

    // Vertical reference cue at t = 2 ms (naive timer stops)
    fig.line(mapT(2), 92, mapT(2), axisY, {
        color: warm,
        width: 1.5,
        dash: '4 3',
        opacity: 0.85,
    })

    // Track 1: Host enqueue (2 ms filled amber bar + arrow showing Python returns)
    fig.text(leftX + 4, 68, 'Host · naive wall timer (no sync)', {
        size: 13.5,
        weight: 700,
        color: warm,
    })
    const w2 = mapT(2) - mapT(0)
    fig.rect(mapT(0), 84, w2, 34, { fill: warm, radius: 5 })
    fig.arrow(mapT(2) + 8, 101, mapT(40) - 6, 101, {
        color: c.textMuted,
        width: 2,
        dash: '5 4',
        head: 7,
    })
    fig.text(mapT(2) + 18, 86, '2 ms enqueue → Python returns immediately while GPU keeps running', {
        size: 12.5,
        weight: 600,
        color: warm,
    })

    // Track 2: CUDA stream event interval (40 ms)
    fig.text(leftX + 4, 150, 'CUDA stream · event-timed GPU execution', {
        size: 13.5,
        weight: 700,
        color: purple,
    })
    const w40 = mapT(40) - mapT(0)
    fig.rect(mapT(0), 166, w40, 38, {
        fill: tint(purple, c.bg, theme === 'dark' ? 0.25 : 0.16),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(mapT(20), 185, '40 ms · CUDA event interval (start → end)', {
        size: 13.5,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Track 3: Synchronized host timer (42 ms)
    fig.text(leftX + 4, 228, 'Host timer · after explicit torch.cuda.synchronize()', {
        size: 13.5,
        weight: 700,
        color: green,
    })
    const w42 = mapT(42) - mapT(0)
    fig.rect(mapT(0), 244, w42, 38, {
        fill: tint(green, c.bg, theme === 'dark' ? 0.22 : 0.14),
        stroke: green,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(mapT(21), 263, '42 ms · includes device wait & host caller overhead', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    fig.text(width / 2, 336, 'Elapsed wall time (ms)', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create()
