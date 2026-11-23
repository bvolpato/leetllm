import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    getThemeColors,
    getToneColor,
    type AxisPlotPath,
    type AxisPlotVector,
    type ThemeMode,
} from 'vizmatic'

export const width = 640
export const height = 590
export const preset = 'engineering'
export const alt =
    'Equal-MSE contours for the five latency rows form a narrow valley around intercept 100 and slope 20. At learning rate 0.05, full-batch descent starts at [0, 0], overshoots to [16, 52], and approaches the OLS minimum [100, 20]. Contours mark MSE levels 50, 150, 300, and 500 milliseconds squared.'

const evidence = [1, 2, 3, 4, 5]
const latency = [118, 141, 162, 181, 198]
const stepsForMarkers = new Set([0, 1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000])
const minimumMse = 2.8

type State = {
    step: number
    intercept: number
    slope: number
}

function train(learningRate: number, steps: number): State[] {
    let intercept = 0
    let slope = 0
    const history: State[] = []

    for (let step = 0; step <= steps; step += 1) {
        history.push({ step, intercept, slope })
        const errors = evidence.map((x, index) => intercept + slope * x - latency[index])
        const interceptGradient =
            (2 / evidence.length) * errors.reduce((sum, error) => sum + error, 0)
        const slopeGradient =
            (2 / evidence.length) *
            errors.reduce((sum, error, index) => sum + error * evidence[index], 0)
        intercept -= learningRate * interceptGradient
        slope -= learningRate * slopeGradient
    }

    return history
}

function labelAt(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color = c.textSecondary,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
    fontWeight = 600,
) {
    return React.createElement(
        CanvasItem,
        {
            x,
            y,
            width,
            height,
        },
        TextLabel({
            c,
            text,
            color,
            fontSize,
            fontWeight,
            width: '100%',
            align,
            mono,
        }),
    )
}

function axisGridPaths(
    xTicks: number[],
    yTicks: number[],
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    color: string,
): AxisPlotPath[] {
    return [
        ...xTicks.map((x) => ({
            points: [
                { x, y: yMin },
                { x, y: yMax },
            ],
            color,
            strokeWidth: 1,
            opacity: 0.55,
        })),
        ...yTicks.map((y) => ({
            points: [
                { x: xMin, y },
                { x: xMax, y },
            ],
            color,
            strokeWidth: 1,
            opacity: 0.55,
        })),
    ]
}

function plotX(
    value: number,
    plot: { x: number; width: number; padding: number; xMin: number; xMax: number },
) {
    return (
        plot.x +
        plot.padding +
        ((value - plot.xMin) / (plot.xMax - plot.xMin)) * (plot.width - plot.padding * 2)
    )
}

function plotY(
    value: number,
    plot: { y: number; height: number; padding: number; yMin: number; yMax: number },
) {
    return (
        plot.y +
        plot.padding +
        (plot.height - plot.padding * 2) -
        ((value - plot.yMin) / (plot.yMax - plot.yMin)) * (plot.height - plot.padding * 2)
    )
}

function getContour(
    level: number,
    lambdaShallow: number,
    lambdaSteep: number,
    shallow: { x: number; y: number },
    steep: { x: number; y: number },
): AxisPlotPath {
    const radiusShallow = Math.sqrt((2 * (level - minimumMse)) / lambdaShallow)
    const radiusSteep = Math.sqrt((2 * (level - minimumMse)) / lambdaSteep)
    const points = Array.from({ length: 97 }, (_, index) => {
        const angle = (index / 96) * Math.PI * 2
        const alongShallow = radiusShallow * Math.cos(angle)
        const alongSteep = radiusSteep * Math.sin(angle)

        return {
            x: 100 + alongShallow * shallow.x + alongSteep * steep.x,
            y: 20 + alongShallow * shallow.y + alongSteep * steep.y,
        }
    })

    return { points, strokeWidth: 2.5 }
}

function shortenBeforeMarker(
    start: { x: number; y: number },
    end: { x: number; y: number },
    plot: {
        width: number
        height: number
        padding: number
        xMin: number
        xMax: number
        yMin: number
        yMax: number
    },
    gap: number,
) {
    const dx = ((end.x - start.x) * (plot.width - plot.padding * 2)) / (plot.xMax - plot.xMin)
    const dy = ((end.y - start.y) * (plot.height - plot.padding * 2)) / (plot.yMax - plot.yMin)
    const fraction = Math.max(0, 1 - gap / Math.hypot(dx, dy))
    return {
        x: end.x - (end.x - start.x) * (1 - fraction),
        y: end.y - (end.y - start.y) * (1 - fraction),
    }
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const history = train(0.05, 1000)
    const markerHistory = history.filter((state) => stepsForMarkers.has(state.step))

    // H = (2 / N) XᵀX = [[2, 6], [6, 22]] for x = 1, 2, 3, 4, 5.
    const trace = 24
    const determinant = 8
    const discriminant = Math.sqrt(trace * trace - 4 * determinant)
    const lambdaSteep = (trace + discriminant) / 2
    const lambdaShallow = (trace - discriminant) / 2
    const steepLength = Math.hypot(6, lambdaSteep - 2)
    const steep = { x: 6 / steepLength, y: (lambdaSteep - 2) / steepLength }
    const shallow = { x: steep.y, y: -steep.x }

    const plot = {
        x: 24,
        y: 66,
        width: 560,
        height: 284,
        padding: 40,
        xMin: -5,
        xMax: 160,
        yMin: -5,
        yMax: 65,
    }
    const xTicks = [0, 25, 50, 75, 100, 125, 150]
    const yTicks = [0, 20, 40, 60]
    const contourLevels = [
        { value: 500, tone: 'warm' as const },
        { value: 300, tone: 'purple' as const },
        { value: 150, tone: 'blue' as const },
        { value: 50, tone: 'green' as const },
    ]
    const contours = contourLevels.map((item) => ({
        ...getContour(item.value, lambdaShallow, lambdaSteep, shallow, steep),
        tone: item.tone,
        opacity: 0.9,
    }))
    const trajectory = history.slice(1).map((state) => ({ x: state.intercept, y: state.slope }))
    const first = history[0]
    const firstUpdate = history[1]
    const shortenedArrowEnd = shortenBeforeMarker(
        { x: first.intercept, y: first.slope },
        { x: firstUpdate.intercept, y: firstUpdate.slope },
        plot,
        12,
    )
    const gridPaths = axisGridPaths(
        xTicks,
        yTicks,
        plot.xMin,
        plot.xMax,
        plot.yMin,
        plot.yMax,
        c.borderSubtle,
    )
    const points = [
        ...markerHistory
            .filter((state) => state.step > 1 && state.step < 1000 && state.step !== 100)
            .map((state) => ({
                x: state.intercept,
                y: state.slope,
                tone: 'purple' as const,
                r: 4,
                stroke: c.bgCard,
                strokeWidth: 1.5,
            })),
        {
            x: history[100].intercept,
            y: history[100].slope,
            tone: 'cyan' as const,
            r: 7,
            stroke: c.bgCard,
            strokeWidth: 2,
        },
        {
            x: first.intercept,
            y: first.slope,
            tone: 'warm' as const,
            r: 8,
            stroke: c.bgCard,
            strokeWidth: 2,
        },
        {
            x: firstUpdate.intercept,
            y: firstUpdate.slope,
            tone: 'critical' as const,
            r: 8,
            stroke: c.bgCard,
            strokeWidth: 2,
        },
        {
            x: history[1000].intercept,
            y: history[1000].slope,
            tone: 'green' as const,
            r: 8,
            stroke: c.bgCard,
            strokeWidth: 2,
        },
    ]
    const vectors: AxisPlotVector[] = [
        {
            x1: first.intercept,
            y1: first.slope,
            x2: shortenedArrowEnd.x,
            y2: shortenedArrowEnd.y,
            tone: 'warm',
            strokeWidth: 3,
            arrow: true,
            arrowSize: 6,
        },
    ]
    const paths: AxisPlotPath[] = [
        ...gridPaths,
        ...contours,
        {
            points: trajectory,
            tone: 'purple',
            strokeWidth: 4,
            opacity: 0.95,
        },
    ]

    const boardChildren: React.ReactNode[] = [
        labelAt(
            c,
            'x: intercept b (ms)',
            28,
            2,
            552,
            30,
            24,
            c.textSecondary,
            'center',
            false,
            650,
        ),
        labelAt(
            c,
            'y: slope m (ms / 100 tokens)',
            28,
            34,
            552,
            30,
            24,
            c.textSecondary,
            'center',
            false,
            650,
        ),
        CanvasItem({
            x: plot.x,
            y: plot.y,
            width: plot.width,
            height: plot.height,
            children: AxisPlot({
                c,
                width: plot.width,
                height: plot.height,
                xMin: plot.xMin,
                xMax: plot.xMax,
                yMin: plot.yMin,
                yMax: plot.yMax,
                padding: plot.padding,
                showFrame: true,
                showAxes: false,
                frameFill: c.bgSubtle,
                frameStroke: c.borderSubtle,
                paths,
                vectors,
                points,
            }),
        }),
        ...xTicks.map((tick) =>
            labelAt(
                c,
                String(tick),
                plotX(tick, plot) - 25,
                plot.y + plot.height - plot.padding + 4,
                50,
                30,
                24,
                c.textMuted,
                'center',
                true,
            ),
        ),
        ...yTicks.map((tick) =>
            labelAt(
                c,
                String(tick),
                0,
                plotY(tick, plot) - 15,
                38,
                30,
                24,
                c.textMuted,
                'right',
                true,
            ),
        ),
        labelAt(
            c,
            'Start (0, 0)',
            22,
            372,
            270,
            30,
            24,
            getToneColor('warm', c),
            'center',
            false,
            700,
        ),
        labelAt(
            c,
            'Step 1 (16, 52)',
            316,
            372,
            270,
            30,
            24,
            getToneColor('critical', c),
            'center',
            false,
            700,
        ),
        labelAt(
            c,
            'Step 100 (84, 24)',
            22,
            406,
            270,
            30,
            24,
            getToneColor('cyan', c),
            'center',
            false,
            700,
        ),
        labelAt(
            c,
            'OLS (100, 20)',
            316,
            406,
            270,
            30,
            24,
            getToneColor('green', c),
            'center',
            false,
            700,
        ),
        labelAt(c, 'MSE (ms²)', 30, 448, 130, 30, 24, c.textSecondary, 'center', false, 650),
        labelAt(c, '500', 174, 448, 50, 30, 24, getToneColor('warm', c), 'center', true, 700),
        labelAt(c, '300', 232, 448, 50, 30, 24, getToneColor('purple', c), 'center', true, 700),
        labelAt(c, '150', 290, 448, 50, 30, 24, getToneColor('blue', c), 'center', true, 700),
        labelAt(c, '50', 348, 448, 50, 30, 24, getToneColor('green', c), 'center', true, 700),
    ]

    return Scene({
        c,
        padding: 16,
        gap: 8,
        title: 'The first step overshoots the valley',
        subtitle: 'Contours show why the valley slows later updates.',
        contentWidth: 608,
        align: 'center',
        children: Board({
            c,
            width: 608,
            height: 482,
            children: boardChildren,
        }),
    })
}

export default create()
