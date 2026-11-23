import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneColor,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 620
export const alt =
    'An assumed 80,000,000,000-byte device budget is 74.5058 GiB. A proportional partition subtracts 14.9012 GiB of 8B FP16 weights and an assumed 8 GiB runtime reserve, leaving a 51.6046 GiB KV pool. On one shared pool scale, 103 current 4K payloads use 51.5 GiB; reserving 512 output tokens leaves room for 91 requests at 0.5625 GiB each. A 92nd requires 51.75 GiB and exceeds the pool by 0.1454 GiB.'

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
                backgroundColor: fill === 'none' ? 'transparent' : fill,
                border: `${strokeWidth}px solid ${stroke === 'none' ? 'transparent' : stroke}`,
            },
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const weights = getToneColor('purple', c)
    const reserve = getToneColor('warm', c)
    const reserveLabel = getReadableToneColor('warm', c)
    const poolTone = getToneColor('blue', c)
    const failure = getToneColor('critical', c)
    const totalGiB = 80_000_000_000 / 1024 ** 3
    const weightGiB = 16_000_000_000 / 1024 ** 3
    const poolGiB = totalGiB - weightGiB - 8
    const partitionX = 80
    const partitionWidth = 1040
    const partitionY = 166
    const weightWidth = (partitionWidth * weightGiB) / totalGiB
    const reserveWidth = (partitionWidth * 8) / totalGiB
    const kvWidth = partitionWidth - weightWidth - reserveWidth
    const poolX = 360
    const poolWidth = 600
    const poolMap = (value: number) => poolX + (value / poolGiB) * poolWidth
    const axis = AxisPlot({
        c,
        width: poolWidth,
        height: 120,
        xMin: 0,
        xMax: poolGiB,
        yMin: 0,
        yMax: 1,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        gridCount: 0,
        vectors: [0, poolGiB / 2, poolGiB].map((value) => ({
            x1: value,
            y1: 0,
            x2: value,
            y2: 1,
            color: value === 0 || value === poolGiB ? c.borderLight : c.borderSubtle,
            strokeWidth: value === 0 || value === poolGiB ? 2 : 1.5,
            opacity: 0.75,
        })),
    })
    const rows = [
        {
            label: 'Now · 103',
            detail: '× 0.50 GiB',
            y: 378,
            used: 103 * 0.5,
            free: poolGiB - 103 * 0.5,
        },
        {
            label: '+512: 91',
            detail: '× 0.5625 GiB',
            y: 450,
            used: 91 * 0.5625,
            free: poolGiB - 91 * 0.5625,
        },
    ]
    const children = [
        label(c, 'Replica growth spends KV headroom', 36, 18, 1128, 56, 48),
        label(c, '80,000,000,000 bytes = 74.5058 GiB', 36, 76, 1128, 50, 42, c.textSecondary),
        rect(c, partitionX, partitionY, partitionWidth, 68, c.bgSubtle, c.borderLight, 2),
        rect(c, partitionX, partitionY, weightWidth, 68, weights, weights, 1),
        rect(c, partitionX + weightWidth, partitionY, reserveWidth, 68, reserve, reserve, 1),
        rect(
            c,
            partitionX + weightWidth + reserveWidth,
            partitionY,
            kvWidth,
            68,
            poolTone,
            poolTone,
            1,
        ),
        label(c, 'Weights 14.9012 GiB', 36, 244, 470, 48, 38, weights),
        label(c, 'Reserve 8 GiB', 470, 244, 320, 48, 38, reserveLabel),
        label(c, 'KV 51.6046 GiB', 800, 244, 364, 48, 38, poolTone),
        label(c, 'Same pool scale · current and +512 output', 36, 306, 1128, 48, 42),
        label(c, 'Free GiB', 972, 346, 192, 42, 38, c.textSecondary, 'center'),
        ...rows.flatMap((row) => [
            label(c, row.label, 36, row.y - 18, 300, 36, 38, c.textPrimary),
            label(c, row.detail, 36, row.y + 18, 300, 34, 38, c.textSecondary),
            rect(c, poolX, row.y, poolWidth, 34, c.bgSubtle, c.borderLight, 2),
            rect(c, poolX, row.y, poolMap(row.used) - poolX, 34, poolTone, poolTone, 1),
            label(
                c,
                row.free.toFixed(4),
                972,
                row.y - 2,
                192,
                42,
                42,
                c.textPrimary,
                'center',
                800,
            ),
        ]),
        CanvasItem({ x: poolX, y: 360, width: poolWidth, height: 148, children: axis }),
        ...[0, poolGiB / 2, poolGiB].map((value) =>
            label(
                c,
                value.toFixed(2),
                poolMap(value) - 54,
                510,
                108,
                40,
                38,
                c.textSecondary,
                'center',
            ),
        ),
        label(c, '92 × 0.5625 = 51.7500 GiB > pool by 0.1454 GiB', 36, 556, 1128, 50, 42, failure),
    ]

    return Board({ c, width, height, children })
}

export default create('dark')
