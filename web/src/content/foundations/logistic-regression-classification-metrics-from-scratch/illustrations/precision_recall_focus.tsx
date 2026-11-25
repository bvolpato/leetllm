import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 400
export const alt =
    'Precision-recall curve alongside ranked verification queues at thresholds 0.80, 0.50, and 0.20. False positive V4 (p = 0.624) enters ahead of positive V3 (p = 0.595), color-linked in red across both the PR dip to 0.667 and the verification queue tiles.'

const CURVE: readonly (readonly [number, number])[] = [
    [0, 1],
    [0.25, 1],
    [0.5, 1],
    [0.5, 2 / 3],
    [0.75, 0.75],
    [0.75, 0.6],
    [1, 2 / 3],
    [1, 4 / 7],
    [1, 0.5],
]

const THRESHOLDS = [
    { t: 0.8, recall: 0.5, precision: 1, selected: 2, tp: 2, fp: 0, tone: 'blue' as const },
    { t: 0.5, recall: 0.75, precision: 0.75, selected: 4, tp: 3, fp: 1, tone: 'warm' as const },
    { t: 0.2, recall: 1, precision: 2 / 3, selected: 6, tp: 4, fp: 2, tone: 'green' as const },
]

const RANKED = [
    { id: 'V7', pos: true },
    { id: 'V5', pos: true },
    { id: 'V4', pos: false },
    { id: 'V3', pos: true },
    { id: 'V6', pos: false },
    { id: 'V8', pos: true },
    { id: 'V2', pos: false },
    { id: 'V1', pos: false },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // Left: Precision-Recall curve (frameless, transparent ground)
    fig.text(64, 22, 'Precision-recall curve (AP = 0.854)', { size: 15, weight: 700 })

    const plot = fig.plot(
        { x: 64, y: 56, width: 320, height: 274 },
        { x: [-0.03, 1.06], y: [0.35, 1.05] },
    )
    plot.axes({
        xTicks: [0, 0.25, 0.5, 0.75, 1.0],
        yTicks: [0.4, 0.6, 0.8, 1.0],
        xFormat: (v) => v.toFixed(2),
        yFormat: (v) => v.toFixed(1),
        xLabel: 'Recall',
        yLabel: 'Precision',
        grid: true,
        labelSize: 12,
    })

    // Main PR curve
    plot.curve(CURVE, { color: blue, width: 2.6 })

    // Highlight the V4 false-positive dip segment in red!
    fig.line(plot.px(0.5), plot.py(1.0), plot.px(0.5), plot.py(2 / 3), {
        color: red,
        width: 3.4,
    })
    plot.point(0.5, 2 / 3, { color: red, r: 6 })
    fig.callout(
        [plot.px(0.5) - 6, plot.py(2 / 3) + 2],
        [plot.px(0.37), plot.py(0.51)],
        'V4 (FP) dips P',
        {
            color: red,
            labelColor: red,
            align: 'right',
            size: 12,
            weight: 700,
            bend: 0.16,
        },
    )
    fig.text(plot.px(0.37) - 6, plot.py(0.51) + 15, '1.00 -> 0.67', {
        size: 11,
        weight: 700,
        color: red,
        align: 'right',
        mono: true,
    })

    // Threshold checkpoints directly labeled
    for (const th of THRESHOLDS) {
        const tone = fig.tone(th.tone)
        plot.point(th.recall, th.precision, { color: tone, r: 6.5 })
    }
    fig.text(plot.px(0.5) + 10, plot.py(1.0) - 8, 't = 0.80', {
        size: 12,
        weight: 700,
        color: blue,
        mono: true,
    })
    fig.text(plot.px(0.75) + 10, plot.py(0.75) - 10, 't = 0.50', {
        size: 12,
        weight: 700,
        color: warm,
        mono: true,
    })
    fig.text(plot.px(1.0) - 4, plot.py(2 / 3) - 18, 't = 0.20', {
        size: 12,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    // Vertical divider
    fig.line(412, 28, 412, 368, { color: c.borderSubtle, width: 1 })

    // Right: Ranked verification queue at t = 0.80, 0.50, 0.20
    const qx = 436
    fig.text(qx, 22, 'Ranked verification queue (high p -> low p)', { size: 15, weight: 700 })

    // Compact legend for tiles
    fig.rect(qx, 48, 14, 12, {
        fill: tint(green, c.bg, isLight ? 0.28 : 0.4),
        stroke: green,
        strokeWidth: 1.3,
        radius: 3,
    })
    fig.text(qx + 20, 54, 'TP (flagged +)', { size: 12, color: green, weight: 600 })

    fig.rect(qx + 132, 48, 14, 12, {
        fill: tint(red, c.bg, isLight ? 0.28 : 0.42),
        stroke: red,
        strokeWidth: 1.5,
        radius: 3,
    })
    fig.text(qx + 152, 54, 'FP (V4, V6)', { size: 12, color: red, weight: 700 })

    fig.rect(qx + 250, 48, 14, 12, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.06 : 0.1),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 3,
    })
    fig.text(qx + 270, 54, 'Below cutoff', { size: 12, color: c.textMuted })

    const tileW = 42
    const tileH = 34
    const tileGap = 6
    const startTilesX = 456

    THRESHOLDS.forEach((th, rowIdx) => {
        const y = 96 + rowIdx * 92
        const tone = fig.tone(th.tone)

        fig.text(qx, y - 14, `t = ${th.t.toFixed(2)}`, {
            size: 13,
            weight: 700,
            color: tone,
            mono: true,
        })
        fig.text(
            startTilesX + 8 * (tileW + tileGap) - tileGap,
            y - 14,
            `${th.tp} TP, ${th.fp} FP  ·  P = ${th.precision.toFixed(2)}, R = ${th.recall.toFixed(2)}`,
            {
                size: 12,
                weight: 600,
                color: c.textSecondary,
                align: 'right',
                mono: true,
            },
        )

        // Cutoff divider line inside queue
        const cutPos = startTilesX + th.selected * (tileW + tileGap) - tileGap / 2
        fig.line(cutPos, y - 4, cutPos, y + tileH + 4, {
            color: tone,
            width: 2,
            dash: '3 3',
        })

        RANKED.forEach((item, idx) => {
            const x = startTilesX + idx * (tileW + tileGap)
            const selected = idx < th.selected
            const isTp = selected && item.pos
            const isFp = selected && !item.pos
            const isV4Fp = isFp && item.id === 'V4'

            const fill = isTp
                ? tint(green, c.bg, isLight ? 0.25 : 0.36)
                : isFp
                  ? tint(red, c.bg, isLight ? 0.28 : 0.42)
                  : tint(c.textMuted, c.bg, isLight ? 0.05 : 0.08)
            const stroke = isTp ? green : isFp ? red : c.borderSubtle

            fig.rect(x, y, tileW, tileH, {
                fill,
                stroke,
                strokeWidth: isV4Fp ? 2.2 : selected ? 1.4 : 0.9,
                radius: 5,
            })
            fig.text(x + tileW / 2, y + tileH / 2, item.id, {
                size: 13,
                weight: selected ? 700 : 400,
                color: isFp ? red : isTp ? c.textPrimary : c.textMuted,
                align: 'center',
                mono: true,
            })
        })
    })

    fig.text(startTilesX + 2 * (tileW + tileGap) + tileW / 2, 344, '↑ V4 enters before V3', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
    })

    return fig.render()
}

export default create
