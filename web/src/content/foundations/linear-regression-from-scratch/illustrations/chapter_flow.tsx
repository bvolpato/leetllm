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
export const height = 820
export const preset = 'engineering'
export const alt =
    'Five latency observations sit near the fitted line y-hat = 100 + 20x. A lower residual plot enlarges the signed errors: minus 2, plus 1, plus 2, plus 1, minus 2 milliseconds. Dashed line segments show predictions at x = 0 and x = 6 beyond the observed range.'

const rows = [
    { x: 1, y: 118, yHat: 120, residual: -2 },
    { x: 2, y: 141, yHat: 140, residual: 1 },
    { x: 3, y: 162, yHat: 160, residual: 2 },
    { x: 4, y: 181, yHat: 180, residual: 1 },
    { x: 5, y: 198, yHat: 200, residual: -2 },
]

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

function textAtPlotX(
    value: number,
    plot: { x: number; width: number; padding: number; xMin: number; xMax: number },
) {
    return (
        plot.x +
        plot.padding +
        ((value - plot.xMin) / (plot.xMax - plot.xMin)) * (plot.width - plot.padding * 2)
    )
}

function textAtPlotY(
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

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')

    const latencyPlot = {
        x: 54,
        y: 34,
        width: 520,
        height: 292,
        padding: 42,
        xMin: 0,
        xMax: 6,
        yMin: 100,
        yMax: 220,
    }
    const latencyXTicks = [0, 1, 2, 3, 4, 5, 6]
    const latencyYTicks = [100, 120, 140, 160, 180, 200, 220]
    const latencyPaths: AxisPlotPath[] = [
        ...axisGridPaths(latencyXTicks, latencyYTicks, 0, 6, 100, 220, c.borderSubtle),
        {
            points: [
                { x: 0, y: 100 },
                { x: 1, y: 120 },
            ],
            tone: 'warm',
            strokeWidth: 3,
            dashed: true,
        },
        {
            points: [
                { x: 1, y: 120 },
                { x: 5, y: 200 },
            ],
            tone: 'green',
            strokeWidth: 4,
        },
        {
            points: [
                { x: 5, y: 200 },
                { x: 6, y: 220 },
            ],
            tone: 'warm',
            strokeWidth: 3,
            dashed: true,
        },
    ]
    const latencyResiduals: AxisPlotVector[] = rows.map((row) => ({
        x1: row.x,
        y1: row.yHat,
        x2: row.x,
        y2: row.y,
        tone: row.residual > 0 ? 'cyan' : 'warm',
        strokeWidth: 3,
    }))

    const residualPlot = {
        x: 54,
        y: 414,
        width: 520,
        height: 250,
        padding: 42,
        xMin: 0.5,
        xMax: 5.5,
        yMin: -3,
        yMax: 3,
    }
    const residualXTicks = [1, 2, 3, 4, 5]
    const residualYTicks = [-2, -1, 0, 1, 2]
    const residualPaths: AxisPlotPath[] = [
        ...axisGridPaths(
            residualXTicks,
            residualYTicks.filter((value) => value !== 0),
            0.5,
            5.5,
            -3,
            3,
            c.borderSubtle,
        ),
        {
            points: [
                { x: 0.5, y: 0 },
                { x: 5.5, y: 0 },
            ],
            tone: 'green',
            strokeWidth: 3,
        },
        {
            points: rows.map(({ x, residual }) => ({ x, y: residual })),
            tone: 'purple',
            strokeWidth: 2.5,
            dashed: true,
        },
    ]
    const residualStems: AxisPlotVector[] = rows.map((row) => ({
        x1: row.x,
        y1: 0,
        x2: row.x,
        y2: row.residual,
        tone: row.residual > 0 ? 'cyan' : 'warm',
        strokeWidth: 4,
    }))

    const boardChildren: React.ReactNode[] = [
        labelAt(c, 'Latency y (ms)', 54, 2, 300, 30, 24, c.textPrimary, 'left', false, 750),
        CanvasItem({
            x: latencyPlot.x,
            y: latencyPlot.y,
            width: latencyPlot.width,
            height: latencyPlot.height,
            children: AxisPlot({
                c,
                width: latencyPlot.width,
                height: latencyPlot.height,
                xMin: latencyPlot.xMin,
                xMax: latencyPlot.xMax,
                yMin: latencyPlot.yMin,
                yMax: latencyPlot.yMax,
                padding: latencyPlot.padding,
                showFrame: true,
                showAxes: false,
                frameFill: c.bgSubtle,
                frameStroke: c.borderSubtle,
                paths: latencyPaths,
                vectors: latencyResiduals,
                points: rows.map((row) => ({
                    x: row.x,
                    y: row.y,
                    tone: 'blue',
                    r: 7,
                    stroke: c.bgCard,
                    strokeWidth: 2,
                })),
            }),
        }),
        ...latencyYTicks.map((tick) =>
            labelAt(
                c,
                String(tick),
                0,
                textAtPlotY(tick, latencyPlot) - 11,
                50,
                30,
                24,
                c.textMuted,
                'right',
                true,
            ),
        ),
        ...latencyXTicks.map((tick) =>
            labelAt(
                c,
                String(tick),
                textAtPlotX(tick, latencyPlot) - 14,
                latencyPlot.y + latencyPlot.height - latencyPlot.padding + 4,
                36,
                30,
                24,
                tick === 0 || tick === 6 ? getToneColor('warm', c) : c.textMuted,
                'center',
                true,
            ),
        ),
        labelAt(
            c,
            'Context x (100 tokens)',
            110,
            320,
            410,
            30,
            24,
            c.textSecondary,
            'center',
            true,
        ),
        labelAt(
            c,
            'Signed residual eᵢ (ms)',
            54,
            359,
            360,
            30,
            24,
            c.textPrimary,
            'left',
            false,
            750,
        ),
        CanvasItem({
            x: residualPlot.x,
            y: residualPlot.y,
            width: residualPlot.width,
            height: residualPlot.height,
            children: AxisPlot({
                c,
                width: residualPlot.width,
                height: residualPlot.height,
                xMin: residualPlot.xMin,
                xMax: residualPlot.xMax,
                yMin: residualPlot.yMin,
                yMax: residualPlot.yMax,
                padding: residualPlot.padding,
                showFrame: true,
                showAxes: false,
                frameFill: c.bgSubtle,
                frameStroke: c.borderSubtle,
                paths: residualPaths,
                vectors: residualStems,
                points: rows.map((row) => ({
                    x: row.x,
                    y: row.residual,
                    tone: row.residual > 0 ? 'cyan' : 'warm',
                    r: 7,
                    stroke: c.bgCard,
                    strokeWidth: 2,
                })),
            }),
        }),
        ...residualYTicks.map((tick) =>
            labelAt(
                c,
                tick > 0 ? '+' + tick : String(tick),
                0,
                textAtPlotY(tick, residualPlot) - 11,
                50,
                30,
                24,
                tick === 0 ? getToneColor('green', c) : c.textMuted,
                'right',
                true,
            ),
        ),
        ...residualXTicks.map((tick) =>
            labelAt(
                c,
                String(tick),
                textAtPlotX(tick, residualPlot) - 14,
                residualPlot.y + residualPlot.height - residualPlot.padding + 4,
                36,
                30,
                24,
                c.textMuted,
                'center',
                true,
            ),
        ),
        ...rows.map((row) => {
            const x = textAtPlotX(row.x, residualPlot)
            const y = textAtPlotY(row.residual, residualPlot)
            return labelAt(
                c,
                row.residual > 0 ? '+' + row.residual : '−' + Math.abs(row.residual),
                x - 25,
                y + (row.residual > 0 ? -36 : 6),
                56,
                30,
                24,
                getToneColor(row.residual > 0 ? 'cyan' : 'warm', c),
                'center',
                true,
                750,
            )
        }),
        labelAt(
            c,
            'Context x (100 tokens)',
            110,
            669,
            410,
            30,
            24,
            c.textSecondary,
            'center',
            true,
        ),
    ]

    return Scene({
        c,
        padding: 16,
        gap: 8,
        title: 'A close fit can still carry a pattern',
        subtitle: 'Five latency points above; the signed residuals are enlarged below.',
        contentWidth: 608,
        align: 'center',
        children: Board({
            c,
            width: 608,
            height: 704,
            children: boardChildren,
        }),
    })
}

export default create()
