import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 790
export const alt =
    'Eight physical values occupy offsets 0 through 7. The transposed logical 2-by-4 view shows those offsets in its cells: row 0 maps to 0,2,4,6 and row 1 to 1,3,5,7 under stride (1,2). An arrow connects (r0,c2), offset 4, to physical value 4.5. A separate contiguous-index calculation would choose offset 2 and value 2.5. The actual CPU teaching candidate returns zeros_like for both held-out inputs: shape [3,5] and shape [2,4] with stride (1,2).'

type ThemeColors = ReturnType<typeof getThemeColors>
type Tone = 'blue' | 'warm' | 'neutral' | 'critical' | 'green'

const label = (
    c: ThemeColors,
    value: string,
    x: number,
    y: number,
    labelWidth: number,
    labelHeight: number,
    fontSize: number,
    color = c.textPrimary,
    options: { align?: 'left' | 'center' | 'right'; weight?: number; mono?: boolean } = {},
) =>
    React.createElement(
        CanvasItem,
        {
            x: x + (options.align === 'left' || options.align === undefined ? 6 : 0),
            y,
            width: labelWidth - (options.align === 'left' || options.align === undefined ? 6 : 0),
            height: labelHeight,
        },
        React.createElement(TextLabel, {
            c,
            text: value,
            width: labelWidth - (options.align === 'left' || options.align === undefined ? 6 : 0),
            fontSize,
            fontWeight: options.weight ?? 650,
            color,
            align: options.align ?? 'left',
            mono: options.mono ?? false,
        }),
    )

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const neutral = getReadableToneColor('neutral', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const critical = getReadableToneColor('critical', c)

    const storageX = 62
    const storageY = 164
    const storageCellWidth = 90
    const storageGap = 8
    const storageCellHeight = 58
    const logicalX = 82
    const logicalCellWidth = 148
    const logicalGap = 48
    const logicalCellHeight = 66
    const logicalRowY = [380, 452] as const

    const storageValues = Array.from({ length: 8 }, (_, offset) => `${offset + 0.5}`)
    const logicalOffsets = [
        ['0', '2', '4', '6'],
        ['1', '3', '5', '7'],
    ]

    const cellFrame = (
        x: number,
        y: number,
        cellWidth: number,
        cellHeight: number,
        stroke: string,
        strokeWidth = 2,
    ) =>
        SvgFrame({
            c,
            x,
            y,
            width: cellWidth,
            height: cellHeight,
            rx: 8,
            fill: c.bgCard,
            stroke,
            strokeWidth,
        })

    const storageFrames = storageValues.map((_, offset) => {
        const x = storageX + offset * (storageCellWidth + storageGap)
        return cellFrame(
            x,
            storageY,
            storageCellWidth,
            storageCellHeight,
            offset === 4 ? warm : neutral,
            offset === 4 ? 3 : 2,
        )
    })
    const logicalFrames = logicalOffsets.flatMap((row, rowIndex) =>
        row.map((_, colIndex) => {
            const x = logicalX + colIndex * (logicalCellWidth + logicalGap)
            const y = logicalRowY[rowIndex]
            const selected = rowIndex === 0 && colIndex === 2
            return cellFrame(
                x,
                y,
                logicalCellWidth,
                logicalCellHeight,
                selected ? warm : neutral,
                selected ? 3 : 2,
            )
        }),
    )

    const selectedStorageCenter =
        storageX + 4 * (storageCellWidth + storageGap) + storageCellWidth / 2
    const selectedLogicalCenter =
        logicalX + 2 * (logicalCellWidth + logicalGap) + logicalCellWidth / 2
    const mappingArrow = VectorArrow({
        x1: selectedLogicalCenter,
        y1: logicalRowY[0],
        x2: selectedStorageCenter,
        y2: storageY + storageCellHeight,
        color: warm,
        strokeWidth: 5,
        arrowSize: 3,
    })

    const geometry = AxisPlot({
        c,
        width,
        height,
        xMin: 0,
        xMax: width,
        yMin: 0,
        yMax: height,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        children: [...storageFrames, ...logicalFrames, mappingArrow],
    })

    const storageLabels = storageValues.flatMap((value, offset) => {
        const x = storageX + offset * (storageCellWidth + storageGap)
        return [
            label(
                c,
                String(offset),
                x,
                116,
                storageCellWidth,
                42,
                32,
                offset === 4 ? warm : c.textSecondary,
                { align: 'center', weight: 750, mono: true },
            ),
            label(
                c,
                value,
                x,
                storageY + 9,
                storageCellWidth,
                44,
                32,
                offset === 4 ? warm : c.textPrimary,
                { align: 'center', weight: 750, mono: true },
            ),
        ]
    })

    const logicalLabels = logicalOffsets.flatMap((row, rowIndex) =>
        row.flatMap((offset, colIndex) => {
            const x = logicalX + colIndex * (logicalCellWidth + logicalGap)
            const y = logicalRowY[rowIndex]
            const selected = rowIndex === 0 && colIndex === 2
            return [
                label(
                    c,
                    offset,
                    x + 2,
                    y + 11,
                    logicalCellWidth - 4,
                    43,
                    32,
                    selected ? warm : c.textPrimary,
                    { align: 'center', weight: 800, mono: true },
                ),
            ]
        }),
    )

    const columnLabels = Array.from({ length: 4 }, (_, colIndex) => {
        const x = logicalX + colIndex * (logicalCellWidth + logicalGap)
        return label(
            c,
            `c${colIndex}`,
            x,
            523,
            logicalCellWidth,
            40,
            32,
            colIndex === 2 ? warm : c.textSecondary,
            { align: 'center', weight: 700, mono: true },
        )
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                geometry,
                label(
                    c,
                    'A stride turns coordinates into addresses',
                    24,
                    16,
                    852,
                    44,
                    32,
                    c.textPrimary,
                    { align: 'center', weight: 800 },
                ),
                label(
                    c,
                    'Physical storage · offsets 0–7 · values arange(8) + 0.5',
                    24,
                    59,
                    852,
                    44,
                    32,
                    c.textSecondary,
                    { align: 'center' },
                ),
                ...storageLabels,

                label(c, 'Offsets', 24, 330, 170, 44, 32, blue, { weight: 750 }),
                label(c, 'shape 2×4', 250, 329, 190, 44, 32, c.textSecondary, { weight: 700 }),
                label(c, 'stride (1,2)', 690, 329, 190, 44, 32, blue, { weight: 750 }),
                label(c, 'r₀', 20, logicalRowY[0] + 12, 54, 44, 32, blue, {
                    weight: 800,
                    mono: true,
                    align: 'center',
                }),
                label(c, 'r₁', 20, logicalRowY[1] + 12, 54, 44, 32, neutral, {
                    weight: 800,
                    mono: true,
                    align: 'center',
                }),
                ...logicalLabels,
                ...columnLabels,

                label(c, 'stride map · (r₀,c₂): 0×1+2×2=4 → 4.5', 30, 564, 840, 44, 32, warm, {
                    weight: 750,
                    mono: true,
                }),
                label(
                    c,
                    'counterfactual contiguous: 0×4+2=2 → 2.5',
                    30,
                    606,
                    840,
                    44,
                    32,
                    neutral,
                    { weight: 650, mono: true },
                ),

                label(c, '4 visible cases · PASS', 30, 650, 840, 44, 32, green, { weight: 750 }),
                label(c, '2 held-out cases · zeros_like · REJECT', 30, 692, 840, 44, 32, critical, {
                    weight: 750,
                }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
