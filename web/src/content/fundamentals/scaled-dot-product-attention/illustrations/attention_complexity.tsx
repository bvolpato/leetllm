import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 700
export const alt =
    'Standard attention writes an N-by-N score matrix to HBM, scaling quadratically from 2 MB at sequence length 1024 to 512 MB at length 16384 per head in FP16, while tiled FlashAttention keeps the active tile in on-chip SRAM with linear O(N) HBM output.'

const yTicks = [
    { y: 512, label: '512 MB' },
    { y: 256, label: '256 MB' },
    { y: 0, label: '0 MB' },
]

const xTicks = [
    { x: 0, label: '0', highlight: false },
    { x: 4, label: '4k', highlight: false },
    { x: 8, label: '8k', highlight: false },
    { x: 12, label: '12k', highlight: false },
    { x: 16, label: '16k', highlight: true },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    const boardW = 636
    const boardH = 258
    const plotX = 96
    const plotY = 12
    const plotW = 496
    const plotH = 206
    const pad = 16
    const xMin = 0
    const xMax = 16
    const yMin = 0
    const yMax = 512
    const innerW = plotW - pad * 2
    const innerH = plotH - pad * 2
    const sx = (x: number) => plotX + pad + ((x - xMin) / (xMax - xMin)) * innerW
    const sy = (y: number) => plotY + pad + innerH - ((y - yMin) / (yMax - yMin)) * innerH

    const gridH = yTicks.map(({ y }) => ({
        points: [
            { x: xMin, y },
            { x: xMax, y },
        ],
        tone: 'neutral' as const,
        strokeWidth: y === yMin ? 2 : 1,
        opacity: y === yMin ? 0.65 : 0.32,
    }))
    const gridV = xTicks.map(({ x }) => ({
        points: [
            { x, y: yMin },
            { x, y: yMax },
        ],
        tone: 'neutral' as const,
        strokeWidth: x === xMin ? 2 : 1,
        opacity: x === xMin ? 0.65 : 0.32,
    }))

    const curvePoints = Array.from({ length: 17 }, (_, k) => {
        const n = Math.max(1, k)
        return { x: n, y: 2 * n * n }
    })
    const sramPoints = Array.from({ length: 17 }, (_, k) => {
        const n = Math.max(1, k)
        return { x: n, y: 0.25 * n }
    })

    return Scene({
        c,
        title: 'Score-matrix materialization scales quadratically with N',
        contentWidth: 640,
        padding: 10,
        gap: 12,
        children: [
            Row({
                gap: 16,
                align: 'start',
                justify: 'center',
                children: [
                    Column({
                        gap: 6,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Standard attention (HBM)',
                                fontSize: 21,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            TiledMatrix({
                                c,
                                rows: 8,
                                cols: 8,
                                cellSize: 22,
                                gap: 3,
                                muted: true,
                                tone: 'neutral',
                                regions: [
                                    {
                                        rowStart: 0,
                                        rowEnd: 8,
                                        colStart: 0,
                                        colEnd: 8,
                                        tone: 'warm',
                                    },
                                ],
                                ariaLabel:
                                    'Dense 8 by 8 materialized attention score matrix in HBM',
                            }),
                            TextLabel({
                                c,
                                text: 'Full N×N · O(N²) HBM',
                                fontSize: 20,
                                mono: true,
                                fontWeight: 700,
                                color: c.textPrimary,
                                align: 'center',
                            }),
                        ],
                    }),
                    Column({
                        gap: 6,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'FlashAttention (SRAM)',
                                fontSize: 21,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            TiledMatrix({
                                c,
                                rows: 8,
                                cols: 8,
                                cellSize: 22,
                                gap: 3,
                                muted: true,
                                tone: 'neutral',
                                regions: [
                                    {
                                        rowStart: 2,
                                        rowEnd: 4,
                                        colStart: 2,
                                        colEnd: 4,
                                        tone: 'purple',
                                    },
                                ],
                                ariaLabel:
                                    'Tiled attention computing one small highlighted block in SRAM',
                            }),
                            TextLabel({
                                c,
                                text: 'One B_r×B_c tile · O(N)',
                                fontSize: 20,
                                mono: true,
                                fontWeight: 700,
                                color: c.textPrimary,
                                align: 'center',
                            }),
                        ],
                    }),
                ],
            }),
            Column({
                gap: 6,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'FP16 score-matrix size per head (2N² bytes) vs sequence length N',
                        fontSize: 21,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    Board({
                        c,
                        width: boardW,
                        height: boardH,
                        children: [
                            ...yTicks.map(({ y, label }) =>
                                CanvasItem({
                                    x: 0,
                                    y: sy(y) - 12,
                                    width: plotX - 8,
                                    height: 24,
                                    children: TextLabel({
                                        c,
                                        text: label,
                                        width: plotX - 8,
                                        fontSize: 19,
                                        mono: true,
                                        align: 'right',
                                        color: c.textMuted,
                                    }),
                                }),
                            ),
                            CanvasItem({
                                x: plotX,
                                y: plotY,
                                width: plotW,
                                height: plotH,
                                children: AxisPlot({
                                    c,
                                    width: plotW,
                                    height: plotH,
                                    padding: pad,
                                    xMin,
                                    xMax,
                                    yMin,
                                    yMax,
                                    showGrid: false,
                                    showAxes: false,
                                    paths: [
                                        ...gridH,
                                        ...gridV,
                                        { points: curvePoints, tone: 'warm', strokeWidth: 4 },
                                        { points: sramPoints, tone: 'purple', strokeWidth: 4 },
                                    ],
                                    points: [
                                        { x: 1, y: 2, tone: 'warm', r: 6 },
                                        { x: 4, y: 32, tone: 'warm', r: 6 },
                                        { x: 8, y: 128, tone: 'warm', r: 6 },
                                        { x: 16, y: 512, tone: 'warm', r: 7 },
                                        { x: 16, y: 4, tone: 'purple', r: 7 },
                                    ],
                                    ariaLabel:
                                        'Quadratic growth of FP16 attention score memory versus sequence length compared to linear O(N) tiled SRAM footprint',
                                }),
                            }),
                            ...xTicks.map(({ x, label, highlight }) =>
                                CanvasItem({
                                    x: sx(x) - 34,
                                    y: plotY + plotH - pad / 2 + 6,
                                    width: 68,
                                    height: 24,
                                    children: TextLabel({
                                        c,
                                        text: label,
                                        width: 68,
                                        fontSize: 20,
                                        mono: true,
                                        fontWeight: highlight ? 700 : 400,
                                        align: 'center',
                                        color: highlight
                                            ? getReadableToneColor('warm', c)
                                            : c.textMuted,
                                    }),
                                }),
                            ),
                        ],
                    }),
                    Row({
                        gap: 16,
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: '1k: 2 MB',
                                fontSize: 19,
                                mono: true,
                                color: c.textMuted,
                            }),
                            TextLabel({
                                c,
                                text: '4k: 32 MB',
                                fontSize: 19,
                                mono: true,
                                color: c.textMuted,
                            }),
                            TextLabel({
                                c,
                                text: '8k: 128 MB',
                                fontSize: 19,
                                mono: true,
                                color: c.textMuted,
                            }),
                            TextLabel({
                                c,
                                text: '16k: 512 MB',
                                fontSize: 19,
                                mono: true,
                                fontWeight: 700,
                                color: getReadableToneColor('warm', c),
                            }),
                        ],
                    }),
                    Row({
                        gap: 18,
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Orange: Standard O(N²) HBM',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('warm', c),
                            }),
                            TextLabel({
                                c,
                                text: 'Purple: FlashAttention O(N) SRAM',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('purple', c),
                            }),
                        ],
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
