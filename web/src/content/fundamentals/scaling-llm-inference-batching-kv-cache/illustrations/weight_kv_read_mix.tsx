import { createElement } from 'react'
import { AxisPlot, Board, CanvasItem, TextLabel, getThemeColors, getToneColor } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 680
export const alt =
    'Four stacked byte-read rows share a 0-to-160 decimal-GB scale for batch 64. At 4K, KV stays 34.36 GB while weight reads fall from 16 to 4 GB, changing the assumed total from 50.36 to 38.36 GB and the rate ratio to 1.31x. At 16K, KV stays 137.44 GB and totals fall from 153.44 to 141.44 GB, a 1.08x ratio. The 16K traffic case needs 128 GiB of KV, above the 51.6 GiB pool.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 750,
) {
    const content = createElement(
        'div',
        {
            style: {
                display: 'flex',
                width,
                height,
                alignItems: 'center',
                justifyContent:
                    align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
            },
        },
        TextLabel({ c, text, width, fontSize, fontWeight, color, align }),
    )
    return CanvasItem({ x, y, width, height, children: content })
}

function rect(
    c: Colors,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    stroke: string,
    strokeWidth = 2,
) {
    return CanvasItem({
        x,
        y,
        width,
        height,
        children: createElement('div', {
            style: {
                boxSizing: 'border-box',
                width,
                height,
                backgroundColor: fill,
                border: `${strokeWidth}px solid ${stroke}`,
            },
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const kvTone = getToneColor('blue', c)
    const weightTone = getToneColor('purple', c)
    const plotX = 270
    const plotWidth = 780
    const mapGB = (value: number) => plotX + (value / 160) * plotWidth
    const grid = AxisPlot({
        c,
        width: plotWidth,
        height: 360,
        xMin: 0,
        xMax: 160,
        yMin: 0,
        yMax: 4,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        gridCount: 0,
        vectors: [0, 40, 80, 120, 160].map((value) => ({
            x1: value,
            y1: 0,
            x2: value,
            y2: 4,
            color: value === 0 ? c.borderLight : c.borderSubtle,
            strokeWidth: value === 0 ? 2 : 1.5,
            opacity: 0.72,
        })),
    })
    const rows = [
        { label: '4K · FP16', y: 170, kvGB: 34.359738368, weightGB: 16 },
        { label: '4K · INT4', y: 230, kvGB: 34.359738368, weightGB: 4 },
        { label: '16K · FP16', y: 350, kvGB: 137.438953472, weightGB: 16 },
        { label: '16K · INT4', y: 410, kvGB: 137.438953472, weightGB: 4 },
    ]
    const children = [
        label(c, 'KV reads limit weight-only gains', 36, 18, 1128, 56, 48),
        label(c, 'B64 · assumed full read · decimal GB', 36, 76, 1128, 44, 42, c.textSecondary),
        rect(c, 40, 130, 36, 28, kvTone, kvTone),
        label(c, 'KV', 86, 122, 210, 44, 40, kvTone),
        rect(c, 610, 130, 36, 28, weightTone, weightTone),
        label(c, 'weight read 16 → 4 GB', 656, 122, 500, 44, 40, weightTone),
        CanvasItem({ x: plotX, y: 170, width: plotWidth, height: 340, children: grid }),
        ...rows.flatMap((row) => {
            const total = row.kvGB + row.weightGB
            const kvWidth = mapGB(row.kvGB) - plotX
            const weightWidth = mapGB(total) - mapGB(row.kvGB)
            return [
                label(c, row.label, 36, row.y - 2, 220, 48, 42, c.textPrimary),
                rect(c, plotX, row.y, plotWidth, 44, c.bgSubtle, c.borderLight, 2),
                rect(c, plotX, row.y, kvWidth, 44, kvTone, kvTone, 1),
                rect(c, mapGB(row.kvGB), row.y, weightWidth, 44, weightTone, weightTone, 1),
                label(
                    c,
                    total.toFixed(2),
                    mapGB(total) + 8,
                    row.y - 3,
                    140,
                    48,
                    42,
                    c.textPrimary,
                    'left',
                    850,
                ),
            ]
        }),
        label(
            c,
            '4K · 50.36 / 38.36 = 1.31× rate ratio',
            270,
            286,
            780,
            46,
            42,
            c.textSecondary,
            'center',
        ),
        label(
            c,
            '16K · 153.44 / 141.44 = 1.08× rate ratio',
            270,
            466,
            780,
            46,
            42,
            c.textSecondary,
            'center',
        ),
        ...[0, 40, 80, 120, 160].map((value) =>
            label(c, String(value), mapGB(value) - 32, 510, 64, 42, 40, c.textSecondary, 'center'),
        ),
        label(
            c,
            'Shared decimal-GB scale · 0–160',
            36,
            556,
            1128,
            44,
            42,
            c.textSecondary,
            'center',
        ),
        label(
            c,
            '16K raw KV = 128 GiB; above the 51.6 GiB pool.',
            36,
            612,
            1128,
            48,
            40,
            weightTone,
        ),
    ]

    return Board({ c, width, height, children })
}

export default create('dark')
