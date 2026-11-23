import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 540
export const alt =
    'Best-of-N test-time compute scaling under an exact verifier versus a flawed proxy reward model across 2,000 simulated tasks: an exact verifier climbs from 0.226 at k=1 to 0.653 at k=4, 0.985 at k=16, and 1.000 at k=64 and k=256, whereas maximizing a proxy reward peaks at 0.453 at k=16 before degrading to 0.419 at k=256 due to Goodhart overoptimization.'

const oracleCurve = [
    { x: 0, y: 0.226 },
    { x: 2, y: 0.653 },
    { x: 4, y: 0.985 },
    { x: 6, y: 1.0 },
    { x: 8, y: 1.0 },
]

const proxyCurve = [
    { x: 0, y: 0.226 },
    { x: 2, y: 0.399 },
    { x: 4, y: 0.453 },
    { x: 6, y: 0.427 },
    { x: 8, y: 0.419 },
]

const yTicks = [
    { y: 1.0, label: '1.00' },
    { y: 0.5, label: '0.50' },
    { y: 0.0, label: '0.00' },
]

const xTicks = [
    { x: 0, label: 'k=1', highlight: false },
    { x: 2, label: 'k=4', highlight: false },
    { x: 4, label: 'k=16', highlight: true },
    { x: 6, label: 'k=64', highlight: false },
    { x: 8, label: 'k=256', highlight: false },
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
    const xMin = 0
    const xMax = 8
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
        title: 'Test-time search needs verified objectives to scale',
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
                        text: 'Test-time search needs verified objectives to scale',
                        fontSize: 22,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Best-of-N pass rate across rollout budgets k (log2 scale)',
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
                                { points: oracleCurve, tone: 'purple', strokeWidth: 4 },
                                { points: proxyCurve, tone: 'warm', strokeWidth: 4 },
                            ],
                            points: [
                                { x: 0, y: 0.226, tone: 'purple', r: 7 },
                                { x: 2, y: 0.653, tone: 'purple', r: 7 },
                                { x: 4, y: 0.985, tone: 'purple', r: 7 },
                                { x: 6, y: 1.0, tone: 'purple', r: 7 },
                                { x: 8, y: 1.0, tone: 'purple', r: 8 },
                                { x: 0, y: 0.226, tone: 'warm', r: 6 },
                                { x: 2, y: 0.399, tone: 'warm', r: 7 },
                                { x: 4, y: 0.453, tone: 'warm', r: 8 },
                                { x: 6, y: 0.427, tone: 'warm', r: 7 },
                                { x: 8, y: 0.419, tone: 'warm', r: 7 },
                            ],
                            ariaLabel:
                                'Exact verifier climbs from 0.226 to 1.000 at k=64 while flawed proxy reward peaks at 0.453 at k=16 and declines to 0.419 at k=256',
                        }),
                    }),
                    ...xTicks.map(({ x, label, highlight }) =>
                        CanvasItem({
                            x: sx(x) - 38,
                            y: plotY + plotH - pad / 2 + 6,
                            width: 76,
                            height: 26,
                            children: TextLabel({
                                c,
                                text: label,
                                width: 76,
                                fontSize: 19,
                                mono: true,
                                fontWeight: highlight ? 700 : 400,
                                align: 'center',
                                color: highlight ? getReadableToneColor('warm', c) : c.textMuted,
                            }),
                        }),
                    ),
                ],
            }),
            Column({
                gap: 4,
                align: 'center',
                children: [
                    Row({
                        gap: 14,
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Purple: exact verifier scales cleanly to 1.000',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('purple', c),
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Orange: flawed proxy peaks at k=16 (0.453), drops to 0.419',
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
