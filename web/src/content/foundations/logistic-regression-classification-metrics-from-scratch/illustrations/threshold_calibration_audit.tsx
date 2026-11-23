export { createFilm } from './_parts/threshold-film'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const alt =
    'Three threshold cuts show validation error cost split into unnecessary-verification cost and missed-verification cost. At thresholds 0.20, 0.50, and 0.80, totals are 36, 138, and 240 dollars; the lowest tested total comes from two false positives and no false negatives.'
const boardWidth = 600
const boardHeight = 488
export const width = 632
export const height = 520
const labelScale = width / boardWidth

const policies = [
    { threshold: 0.2, fp: 2, fn: 0 },
    { threshold: 0.5, fp: 1, fn: 1 },
    { threshold: 0.8, fp: 0, fn: 2 },
].map((item) => ({
    ...item,
    fpCost: item.fp * 18,
    fnCost: item.fn * 120,
    total: item.fp * 18 + item.fn * 120,
}))

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 18,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: size + 8,
        children: TextLabel({
            c,
            text: value,
            width: w,
            fontSize: size * labelScale,
            color,
            mono: false,
            align,
        }),
    })

const illustration = defineIllustration((c) => {
    const plot = { x: 145, y: 110, width: 350, height: 220 }
    const px = (value: number) => plot.x + (value / 240) * plot.width
    const rows = policies.flatMap((item, index) => {
        const barValue = 2.75 - index
        const barPixelY = plot.y + plot.height * (1 - barValue / 3)
        const formula = `FP $${item.fpCost}  +  FN $${item.fnCost}  =  $${item.total}`
        return [
            text(
                c,
                18,
                barPixelY - 30,
                120,
                `t = ${item.threshold.toFixed(2)}`,
                21,
                c.textPrimary,
                'left',
            ),
            text(
                c,
                px(item.total) + 7,
                barPixelY - 30,
                82,
                `$${item.total}`,
                21,
                c.textPrimary,
                'left',
            ),
            text(c, 145, barPixelY + 14, 428, formula, 21, c.textSecondary, 'left'),
        ]
    })
    const grid = CanvasItem({
        x: plot.x,
        y: plot.y,
        width: plot.width,
        height: plot.height,
        children: AxisPlot({
            c,
            width: plot.width,
            height: plot.height,
            xMin: 0,
            xMax: 240,
            yMin: 0,
            yMax: 3,
            padding: 0,
            showFrame: false,
            showAxes: false,
            showGrid: false,
            paths: [0, 120, 240].map((tick) => ({
                points: [
                    { x: tick, y: 0 },
                    { x: tick, y: 3 },
                ],
                color: c.borderSubtle,
                strokeWidth: 1.5,
            })),
            vectors: [
                ...policies.map((_, index) => ({
                    x1: 0,
                    y1: 2.75 - index,
                    x2: 240,
                    y2: 2.75 - index,
                    color: c.bgCard,
                    strokeWidth: 24,
                })),
                ...policies.flatMap((item, index) => {
                    const y = 2.75 - index
                    const segments = []
                    if (item.fpCost > 0)
                        segments.push({
                            x1: 0,
                            y1: y,
                            x2: item.fpCost,
                            y2: y,
                            color: c.warningLight,
                            strokeWidth: 18,
                        })
                    if (item.fnCost > 0)
                        segments.push({
                            x1: item.fpCost,
                            y1: y,
                            x2: item.fpCost + item.fnCost,
                            y2: y,
                            color: c.criticalLight,
                            strokeWidth: 18,
                        })
                    return segments
                }),
            ],
        }),
    })

    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardWidth,
        children: Board({
            c,
            width: boardWidth,
            height: boardHeight,
            children: [
                text(c, 18, 12, 564, 'Misses carry the largest price', 24, c.textPrimary, 'left'),
                text(c, 18, 50, 278, 'FP: $18 each', 21, getReadableToneColor('warm', c), 'left'),
                text(
                    c,
                    312,
                    50,
                    270,
                    'FN: $120 each',
                    21,
                    getReadableToneColor('critical', c),
                    'left',
                ),
                grid,
                ...rows,
                ...[0, 120, 240].map((tick) =>
                    text(c, px(tick) - 30, 344, 60, `$${tick}`, 21, c.textSecondary),
                ),
                text(c, 145, 380, 350, 'validation error cost', 21, c.textSecondary),
                text(c, 18, 413, 564, 'At these tested cuts,', 21, c.textPrimary, 'left'),
                text(c, 18, 443, 564, 't = .20 totals $36.', 21, c.textPrimary, 'left'),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
