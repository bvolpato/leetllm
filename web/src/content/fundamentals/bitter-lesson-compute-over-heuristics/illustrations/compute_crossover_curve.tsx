import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 540
export const alt =
    'Connect-Four 5-by-6 match score of pure alpha-beta terminal search against a one-ply domain tactical heuristic: 0.000 at depth 1 (26 nodes), overtaking the 0.500 parity line at depth 2 with 0.583 (268 nodes), reaching 0.667 at depth 3 (621 nodes), and reaching 0.750 at depth 6 (14,015 nodes).'

const searchCurve = [
    { x: 1, y: 0.0 },
    { x: 2, y: 0.583 },
    { x: 3, y: 0.667 },
    { x: 4, y: 0.667 },
    { x: 5, y: 0.667 },
    { x: 6, y: 0.75 },
]

const heuristicBaseline = [
    { x: 1, y: 0.5 },
    { x: 6, y: 0.5 },
]

const yTicks = [
    { y: 1.0, label: '1.00' },
    { y: 0.5, label: '0.50' },
    { y: 0.0, label: '0.00' },
]

const xTicks = [
    { x: 1, label: 'd=1', highlight: false },
    { x: 2, label: 'd=2', highlight: true },
    { x: 3, label: 'd=3', highlight: false },
    { x: 4, label: 'd=4', highlight: false },
    { x: 5, label: 'd=5', highlight: false },
    { x: 6, label: 'd=6', highlight: true },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const boardW = 636
    const boardH = 304
    const plotX = 76
    const plotY = 14
    const plotW = 514
    const plotH = 248
    const pad = 18
    const xMin = 1
    const xMax = 6
    const yMin = 0
    const yMax = 1
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

    return Scene({
        c,
        title: 'Pure search overtakes fixed heuristics with depth',
        contentWidth: 636,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Pure search overtakes fixed heuristics with depth',
                        fontSize: 22,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: '5x6 Connect-Four win/draw score vs 1-ply tactical heuristic',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
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
                            width: plotX - 6,
                            height: 24,
                            children: TextLabel({
                                c,
                                text: label,
                                width: plotX - 6,
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
                                {
                                    points: heuristicBaseline,
                                    tone: 'warm',
                                    strokeWidth: 3,
                                    dashed: true,
                                },
                                { points: searchCurve, tone: 'purple', strokeWidth: 4 },
                            ],
                            points: [
                                { x: 1, y: 0.0, tone: 'purple', r: 7 },
                                { x: 2, y: 0.583, tone: 'purple', r: 7 },
                                { x: 3, y: 0.667, tone: 'purple', r: 7 },
                                { x: 4, y: 0.667, tone: 'purple', r: 6 },
                                { x: 5, y: 0.667, tone: 'purple', r: 6 },
                                { x: 6, y: 0.75, tone: 'purple', r: 8 },
                            ],
                            ariaLabel:
                                'Alpha-beta search score rising from 0.000 at depth 1 to 0.750 at depth 6, crossing the 0.500 heuristic baseline at depth 2',
                        }),
                    }),
                    ...xTicks.map(({ x, label, highlight }) =>
                        CanvasItem({
                            x: sx(x) - 32,
                            y: plotY + plotH - pad / 2 + 6,
                            width: 64,
                            height: 26,
                            children: TextLabel({
                                c,
                                text: label,
                                width: 64,
                                fontSize: 19,
                                mono: true,
                                fontWeight: highlight ? 700 : 400,
                                align: 'center',
                                color: highlight ? getReadableToneColor('purple', c) : c.textMuted,
                            }),
                        }),
                    ),
                ],
            }),
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Purple: terminal alpha-beta (0.00 at d=1 to 0.75 at d=6)',
                        fontSize: 19,
                        fontWeight: 700,
                        color: getReadableToneColor('purple', c),
                    }),
                    TextLabel({
                        c,
                        text: 'Dashed orange: 0.50 parity against fixed domain heuristic',
                        fontSize: 19,
                        fontWeight: 700,
                        color: getReadableToneColor('warm', c),
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
