import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 390
export const alt =
    'Side-by-side A/A peeking simulation across 5,000 zero-effect trials. Left: Trial 328 z-score trajectory crosses the +1.96 rejection boundary at look 5 (z = 2.39) yet returns inside the null band by look 20 (z = 0.90). Right: false-win rate climbs from 5.3% (264/5,000) at 1 planned final look to 14.2% at 5 looks, 19.2% at 10 looks, and 24.7% (1,236/5,000) at 20 peeks.'

const Z_TRAJ = [
    1.18, 1.35, 1.59, 1.81, 2.39, 2.3, 2.18, 2.44, 2.16, 2.41, 1.99, 1.45, 1.31, 1.46, 1.56, 1.37,
    0.94, 1.09, 0.89, 0.9,
]

const BARS = [
    { label: '1', pct: 5.3, count: '264', tone: 'green' as const },
    { label: '5', pct: 14.2, count: '710', tone: 'warm' as const },
    { label: '10', pct: 19.2, count: '962', tone: 'warm' as const },
    { label: '20', pct: 24.7, count: '1,236', tone: 'critical' as const },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const green = fig.tone('green')
    const isLight = theme === 'light'

    // Left: Trial #328 null z-trajectory across 20 peeks
    fig.text(56, 24, 'Null A/A trajectory (Trial #328)', {
        size: 15,
        weight: 700,
    })

    const leftPlot = fig.plot(
        { x: 58, y: 54, width: 458, height: 274 },
        { x: [1, 20], y: [-2.6, 3.1] },
    )

    // Shaded rejection zones (|z| > 1.96) and calm null band
    fig.rect(leftPlot.area.x, leftPlot.area.y, leftPlot.area.width, leftPlot.py(1.96) - leftPlot.area.y, {
        fill: tint(red, c.bg, isLight ? 0.1 : 0.16),
    })
    fig.rect(
        leftPlot.area.x,
        leftPlot.py(-1.96),
        leftPlot.area.width,
        leftPlot.bottom - leftPlot.py(-1.96),
        {
            fill: tint(red, c.bg, isLight ? 0.1 : 0.16),
        },
    )
    fig.rect(
        leftPlot.area.x,
        leftPlot.py(1.96),
        leftPlot.area.width,
        leftPlot.py(-1.96) - leftPlot.py(1.96),
        {
            fill: tint(green, c.bg, isLight ? 0.05 : 0.08),
        },
    )

    leftPlot.axes({
        xTicks: [1, 5, 10, 15, 20],
        yTicks: [-2, -1, 0, 1, 2, 3],
        xLabel: 'Interim peek index (100 units / arm per look)',
        yLabel: 'z-score',
        grid: true,
        labelSize: 12,
    })

    // Reference lines at +1.96, 0, -1.96
    leftPlot.hline(1.96, undefined, {
        color: red,
        dash: '5 4',
        width: 1.6,
    })
    fig.text(leftPlot.area.x + 6, leftPlot.py(1.96) - 11, '+1.96', {
        size: 12,
        weight: 700,
        color: red,
        mono: true,
    })
    leftPlot.hline(0, undefined, { color: c.textMuted, dash: '2 4', width: 1 })
    leftPlot.hline(-1.96, '-1.96', {
        color: red,
        dash: '5 4',
        width: 1.4,
        labelPosition: 'right',
        labelOffset: 10,
        labelSize: 12,
    })

    // Random-walk polyline
    const pts = Z_TRAJ.map((v, i) => [i + 1, v] as const)
    leftPlot.curve(pts, { color: blue, width: 2.4 })
    for (const [x, y] of pts) {
        const over = Math.abs(y) > 1.96
        leftPlot.point(x, y, { color: over ? red : blue, r: over ? 3.5 : 2.8 })
    }

    // Highlight first false crossing at look 5 (z = 2.39) and final look 20 (z = 0.90)
    leftPlot.point(5, 2.39, { color: red, r: 6 })
    fig.callout(
        [leftPlot.px(5) + 6, leftPlot.py(2.39)],
        [leftPlot.px(9.5), leftPlot.py(2.82)],
        'Look 5: z = 2.39 (false stop)',
        {
            color: red,
            labelColor: red,
            align: 'left',
            size: 12,
            weight: 700,
            bend: -0.14,
        },
    )

    leftPlot.point(20, 0.9, { color: green, r: 6 })
    fig.callout(
        [leftPlot.px(20) - 4, leftPlot.py(0.9) + 6],
        [leftPlot.px(14.5), leftPlot.py(-0.2)],
        'Look 20: z = 0.90 (null holds)',
        {
            color: green,
            labelColor: green,
            align: 'right',
            size: 12,
            weight: 700,
            bend: 0.18,
        },
    )

    // Divider
    fig.line(542, 34, 542, 360, { color: c.borderSubtle, width: 1 })

    // Right: False-win rate bar chart out of 5,000 A/A trials
    fig.text(578, 24, 'False-win rate (5,000 A/A runs)', {
        size: 15,
        weight: 700,
    })

    const rightPlot = fig.plot(
        { x: 598, y: 54, width: 214, height: 274 },
        { x: [0.3, 4.7], y: [0, 30] },
    )
    rightPlot.axes({
        yTicks: [0, 5, 10, 15, 20, 25, 30],
        yFormat: (v) => `${v}%`,
        xLabel: 'Number of peeks',
        grid: true,
        labelSize: 12,
    })

    // 5% nominal alpha line with label cleanly outside right edge
    rightPlot.hline(5, undefined, {
        color: green,
        dash: '4 3',
        width: 1.5,
    })
    fig.text(rightPlot.right + 4, rightPlot.py(5), '5% α', {
        size: 11,
        weight: 700,
        color: green,
    })

    const barW = 36
    BARS.forEach((b, i) => {
        const cx = rightPlot.px(i + 1)
        const yTop = rightPlot.py(b.pct)
        const yBot = rightPlot.py(0)
        const tone = fig.tone(b.tone)

        fig.rect(cx - barW / 2, yTop, barW, yBot - yTop, {
            fill: tint(tone, c.bg, isLight ? 0.24 : 0.36),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(cx, yTop - 14, `${b.pct.toFixed(1)}%`, {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
        fig.text(cx, rightPlot.bottom + 15, b.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        if (i === 0 || i === 3) {
            fig.text(cx, yTop - 29, `(${b.count})`, {
                size: 11,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        }
    })

    return fig.render()
}

export default create
