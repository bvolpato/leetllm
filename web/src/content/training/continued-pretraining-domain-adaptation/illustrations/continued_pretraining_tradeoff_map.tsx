import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
    type ThemeColors,
} from 'vizmatic'

export const width = 640
export const height = 760
export const autoSize = false
export const alt =
    'The authored synthetic ledger plots (domain PPL drop, general PPL rise, probe accuracy): base (0, 0, 62 percent), cpt-1k (10.5, 0.3, 68 percent), cpt-4k (14.1, 0.9, 72 percent), cpt-12k (16.2, 4.7, 71 percent). The 1.5-point general-regression gate excludes cpt-12k; cpt-4k has the highest eligible probe accuracy.'

const plot = {
    x: 42,
    y: 132,
    width: 556,
    height: 458,
    padding: 42,
    xMin: 0,
    xMax: 17,
    yMin: 0,
    yMax: 5,
}

type Checkpoint = {
    name: string
    domainDrop: number
    generalRise: number
    probeAccuracy: number
    tone: 'neutral' | 'green' | 'critical'
    labelDx: number
    labelDy: number
    labelWidth: number
    align: 'left' | 'right'
}

const checkpoints: Checkpoint[] = [
    {
        name: 'base',
        domainDrop: 0,
        generalRise: 0,
        probeAccuracy: 0.62,
        tone: 'neutral',
        labelDx: 12,
        labelDy: -39,
        labelWidth: 150,
        align: 'left',
    },
    {
        name: '1k',
        domainDrop: 10.5,
        generalRise: 0.3,
        probeAccuracy: 0.68,
        tone: 'green',
        labelDx: -145,
        labelDy: -41,
        labelWidth: 132,
        align: 'right',
    },
    {
        name: '4k',
        domainDrop: 14.1,
        generalRise: 0.9,
        probeAccuracy: 0.72,
        tone: 'green',
        labelDx: 15,
        labelDy: 10,
        labelWidth: 115,
        align: 'left',
    },
    {
        name: '12k',
        domainDrop: 16.2,
        generalRise: 4.7,
        probeAccuracy: 0.71,
        tone: 'critical',
        labelDx: -151,
        labelDy: -43,
        labelWidth: 140,
        align: 'right',
    },
]

function project(point: { domainDrop: number; generalRise: number }) {
    const innerWidth = plot.width - plot.padding * 2
    const innerHeight = plot.height - plot.padding * 2
    return {
        x:
            plot.x +
            plot.padding +
            ((point.domainDrop - plot.xMin) / (plot.xMax - plot.xMin)) * innerWidth,
        y:
            plot.y +
            plot.padding +
            innerHeight -
            ((point.generalRise - plot.yMin) / (plot.yMax - plot.yMin)) * innerHeight,
    }
}

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    width: number,
    fontSize: number,
    options: { color?: string; align?: 'left' | 'center' | 'right'; weight?: number } = {},
) {
    return (
        <CanvasItem x={x} y={y} width={width} height={fontSize * 1.4}>
            <TextLabel
                c={c}
                text={text}
                width={width}
                fontSize={fontSize}
                fontWeight={options.weight ?? 700}
                color={options.color ?? c.textPrimary}
                align={options.align ?? 'left'}
            />
        </CanvasItem>
    )
}

const checkpointGatePlane = defineIllustration((themeColors) => {
    const c = { ...themeColors, shadow: 'transparent' }
    const xTicks = [0, 4, 8, 12, 16]
    const yTicks = [0, 1, 2, 3, 4, 5]
    const projectX = (value: number) =>
        plot.x +
        plot.padding +
        ((value - plot.xMin) / (plot.xMax - plot.xMin)) * (plot.width - plot.padding * 2)
    const projectY = (value: number) =>
        plot.y +
        plot.padding +
        (plot.height - plot.padding * 2) -
        ((value - plot.yMin) / (plot.yMax - plot.yMin)) * (plot.height - plot.padding * 2)
    const gateColor = getReadableToneColor('warm', c)
    const axisPlot = AxisPlot({
        c,
        width: plot.width,
        height: plot.height,
        xMin: plot.xMin,
        xMax: plot.xMax,
        yMin: plot.yMin,
        yMax: plot.yMax,
        padding: plot.padding,
        showAxes: true,
        showGrid: false,
        paths: [
            {
                points: [
                    { x: plot.xMin, y: 1.5 },
                    { x: plot.xMax, y: 1.5 },
                ],
                color: gateColor,
                strokeWidth: 3,
                dashed: true,
            },
            ...xTicks.map((value) => ({
                points: [
                    { x: value, y: 0 },
                    { x: value, y: 0.1 },
                ],
                color: c.borderLight,
                strokeWidth: 1.5,
            })),
            ...yTicks.map((value) => ({
                points: [
                    { x: 0, y: value },
                    { x: 0.3, y: value },
                ],
                color: c.borderLight,
                strokeWidth: 1.5,
            })),
        ],
        points: checkpoints.map((point) => ({
            x: point.domainDrop,
            y: point.generalRise,
            fill: getToneColor(point.tone, c),
            r: 13,
            stroke: c.bg,
            strokeWidth: 3,
        })),
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: 640,
        children: Board({
            c,
            width: 640,
            height: 760,
            children: [
                label(c, 'Gate first. Rank survivors.', 30, 16, 580, 32, { weight: 850 }),
                label(
                    c,
                    'Checkpoint trade-off sweep · each point is one checkpoint',
                    30,
                    62,
                    580,
                    22,
                    {
                        color: c.textSecondary,
                        weight: 650,
                    },
                ),
                label(c, 'x: domain PPL drop · y: general PPL rise', 30, 97, 580, 22, {
                    color: c.textSecondary,
                    weight: 700,
                }),
                <CanvasItem
                    key="plot"
                    x={plot.x}
                    y={plot.y}
                    width={plot.width}
                    height={plot.height}
                >
                    {axisPlot}
                </CanvasItem>,
                ...xTicks.map((value) =>
                    label(
                        c,
                        String(value),
                        projectX(value) - 20,
                        plot.y + plot.height - 31,
                        40,
                        22,
                        { color: c.textSecondary, align: 'center', weight: 700 },
                    ),
                ),
                ...yTicks.map((value) =>
                    label(c, String(value), 1, projectY(value) - 12, 32, 22, {
                        color: c.textSecondary,
                        align: 'right',
                        weight: 700,
                    }),
                ),
                ...checkpoints.map((point) => {
                    const position = project(point)
                    return label(
                        c,
                        `${point.name} · ${Math.round(point.probeAccuracy * 100)}%`,
                        position.x + point.labelDx,
                        position.y + point.labelDy,
                        point.labelWidth,
                        22,
                        {
                            color:
                                point.tone === 'critical'
                                    ? getReadableToneColor('critical', c)
                                    : point.tone === 'green'
                                      ? getReadableToneColor('green', c)
                                      : c.textPrimary,
                            align: point.align,
                            weight: 850,
                        },
                    )
                }),
                label(c, 'Budget = 1.5', 52, projectY(1.5) - 34, 150, 22, {
                    color: gateColor,
                    weight: 850,
                }),
                label(c, 'Domain PPL drop', 30, 608, 580, 22, {
                    color: c.textSecondary,
                    align: 'center',
                    weight: 750,
                }),
                label(c, 'Gate ≤ 1.5 keeps base, 1k, and 4k', 30, 652, 580, 22, {
                    color: c.textPrimary,
                    weight: 750,
                }),
                label(c, '4k ranks first among survivors · 72% probe accuracy', 30, 686, 580, 22, {
                    color: getReadableToneColor('green', c),
                    weight: 800,
                }),
            ],
        }),
    })
})

export const create = checkpointGatePlane.create
export default checkpointGatePlane.default
