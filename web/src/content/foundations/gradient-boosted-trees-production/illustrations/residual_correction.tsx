import {
    AxisPlot,
    BadgePill,
    Board,
    CanvasItem,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    VectorArrow,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Three delay predictions start at 6 hours. Actual delays of 2, 8, and 20 leave residuals of minus 4, plus 2, and plus 14. A split on large_model groups the first two rows with mean residual minus 1 and the third with mean plus 14. A quarter learning rate updates predictions to 5.75, 5.75, and 9.5; mean squared error falls from 72 to 43.125 hours squared.'
export const width = 860
export const height = 580

function residualPlot(c: ThemeColors) {
    const plotLeft = 110
    const plotTop = 16
    const plotWidth = 280
    const plotHeight = 220
    const padding = 24
    const x = (value: number) => plotLeft + padding + (value / 20) * (plotWidth - padding * 2)
    const y = (value: number) => plotTop + padding + ((3 - value) / 3) * (plotHeight - padding * 2)
    const label = (
        text: string,
        xPos: number,
        yPos: number,
        boxWidth: number,
        color = c.textSecondary,
        fontSize = 16,
    ) =>
        CanvasItem({
            x: xPos,
            y: yPos,
            width: boxWidth,
            height: 24,
            children: TextLabel({
                c,
                text,
                width: boxWidth,
                fontSize,
                color,
                mono: true,
                align: 'center',
            }),
        })

    return Board({
        c,
        width: 400,
        height: 290,
        children: [
            CanvasItem({
                x: plotLeft,
                y: plotTop,
                width: plotWidth,
                height: plotHeight,
                children: AxisPlot({
                    c,
                    width: plotWidth,
                    height: plotHeight,
                    padding,
                    xMin: 0,
                    xMax: 20,
                    yMin: 0,
                    yMax: 3,
                    showAxes: false,
                    showGrid: false,
                    frameFill: c.bgSubtle,
                    frameStroke: c.borderSubtle,
                    paths: [
                        ...[0.5, 1.5, 2.5].map((row) => ({
                            points: [
                                { x: 0, y: row },
                                { x: 20, y: row },
                            ],
                            color: c.borderSubtle,
                            strokeWidth: 1,
                        })),
                        ...[0, 5, 10, 15, 20].map((hour) => ({
                            points: [
                                { x: hour, y: 0 },
                                { x: hour, y: 3 },
                            ],
                            color: c.borderSubtle,
                            strokeWidth: 1,
                        })),
                        {
                            points: [
                                { x: 2, y: 2.5 },
                                { x: 6, y: 2.5 },
                            ],
                            color: c.warning,
                            strokeWidth: 4,
                        },
                        {
                            points: [
                                { x: 6, y: 1.5 },
                                { x: 8, y: 1.5 },
                            ],
                            color: c.positive,
                            strokeWidth: 4,
                        },
                        {
                            points: [
                                { x: 6, y: 0.5 },
                                { x: 20, y: 0.5 },
                            ],
                            color: c.positive,
                            strokeWidth: 4,
                        },
                        {
                            points: [
                                { x: 0, y: 0 },
                                { x: 20, y: 0 },
                            ],
                            color: c.borderLight,
                            strokeWidth: 1.5,
                        },
                    ],
                    points: [
                        ...[2.5, 1.5, 0.5].map((row) => ({
                            x: 6,
                            y: row,
                            tone: 'neutral' as const,
                            r: 5,
                            stroke: c.bgCard,
                            strokeWidth: 2,
                        })),
                        { x: 2, y: 2.5, tone: 'warm', r: 6, stroke: c.bgCard, strokeWidth: 2 },
                        { x: 8, y: 1.5, tone: 'warm', r: 6, stroke: c.bgCard, strokeWidth: 2 },
                        { x: 20, y: 0.5, tone: 'warm', r: 6, stroke: c.bgCard, strokeWidth: 2 },
                    ],
                }),
            }),
            ...[
                { text: 'Row 1', row: 2.5 },
                { text: 'Row 2', row: 1.5 },
                { text: 'Row 3', row: 0.5 },
            ].map((item) =>
                CanvasItem({
                    x: 0,
                    y: y(item.row) - 12,
                    width: plotLeft - 6,
                    height: 26,
                    children: TextLabel({
                        c,
                        text: item.text,
                        width: plotLeft - 6,
                        fontSize: 16,
                        color: c.textPrimary,
                        align: 'right',
                    }),
                }),
            ),
            label('−4', (x(2) + x(6)) / 2 - 20, y(2.5) - 24, 40, c.warningDark, 17),
            label('+2', (x(6) + x(8)) / 2 - 20, y(1.5) - 24, 40, c.positive, 17),
            label('+14', (x(6) + x(20)) / 2 - 25, y(0.5) - 24, 50, c.positive, 17),
            ...[0, 5, 10, 15, 20].map((hour) =>
                label(String(hour), x(hour) - 14, 238, 28, c.textSecondary, 14),
            ),
            CanvasItem({
                x: plotLeft + 60,
                y: 262,
                width: 160,
                height: 22,
                children: TextLabel({
                    c,
                    text: 'delay · hours (F₀ = 6)',
                    width: 160,
                    fontSize: 15,
                    color: c.textSecondary,
                    align: 'center',
                }),
            }),
        ],
    })
}

function splitTreeBoard(c: ThemeColors) {
    const w = 390
    const h = 180
    return Board({
        c,
        width: w,
        height: h,
        children: [
            AxisPlot({
                c,
                width: w,
                height: h,
                xMin: 0,
                xMax: w,
                yMin: 0,
                yMax: h,
                padding: 0,
                showFrame: false,
                showAxes: false,
                showGrid: false,
                children: [
                    VectorArrow({
                        x1: 195,
                        y1: 44,
                        x2: 95,
                        y2: 96,
                        color: c.info,
                        strokeWidth: 2.5,
                        arrowSize: 6,
                    }),
                    VectorArrow({
                        x1: 195,
                        y1: 44,
                        x2: 295,
                        y2: 96,
                        color: c.positive,
                        strokeWidth: 2.5,
                        arrowSize: 6,
                    }),
                ],
            }),
            CanvasItem({
                x: 105,
                y: 6,
                width: 180,
                height: 48,
                children: Panel({
                    c,
                    width: 180,
                    padding: 6,
                    gap: 2,
                    tone: 'purple',
                    title: 'large_model == 0?',
                    titleFontSize: 16,
                    children: TextLabel({
                        c,
                        text: 'decision stump',
                        width: 168,
                        fontSize: 14,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                }),
            }),
            CanvasItem({
                x: 10,
                y: 106,
                width: 170,
                height: 64,
                children: Panel({
                    c,
                    width: 170,
                    padding: 6,
                    gap: 2,
                    tone: 'cyan',
                    title: 'Left Leaf (R1, R2)',
                    titleFontSize: 15,
                    children: TextLabel({
                        c,
                        text: 'γ = (−4 + 2) / 2 = −1.0',
                        width: 158,
                        fontSize: 14,
                        color: c.textPrimary,
                        mono: true,
                        align: 'center',
                    }),
                }),
            }),
            CanvasItem({
                x: 210,
                y: 106,
                width: 170,
                height: 64,
                children: Panel({
                    c,
                    width: 170,
                    padding: 6,
                    gap: 2,
                    tone: 'green',
                    title: 'Right Leaf (R3)',
                    titleFontSize: 15,
                    children: TextLabel({
                        c,
                        text: 'γ = +14.0',
                        width: 158,
                        fontSize: 14,
                        color: c.textPrimary,
                        mono: true,
                        align: 'center',
                    }),
                }),
            }),
        ],
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 10,
        align: 'center',
        contentWidth: 824,
        title: 'Sequential Shrinkage Updates Step Toward Residuals',
        subtitle:
            'Each boosting round fits a shallow tree to pseudo-residuals and applies shrinkage η = 0.25.',
        children: Column({
            width: 824,
            gap: 12,
            align: 'stretch',
            children: [
                Row({
                    width: 824,
                    gap: 16,
                    align: 'center',
                    justify: 'space-between',
                    children: [
                        Panel({
                            c,
                            width: 414,
                            padding: 10,
                            gap: 6,
                            tone: 'neutral',
                            title: 'Step 1: Baseline Residuals (F₀ = 6h)',
                            titleFontSize: 18,
                            children: residualPlot(c),
                        }),
                        Panel({
                            c,
                            width: 394,
                            padding: 10,
                            gap: 6,
                            tone: 'neutral',
                            title: 'Step 2: Residual Tree Fit',
                            titleFontSize: 18,
                            children: splitTreeBoard(c),
                        }),
                    ],
                }),
                Panel({
                    c,
                    width: 824,
                    padding: 10,
                    gap: 6,
                    tone: 'warm',
                    title: 'Step 3: Shrinkage Update (η = 0.25) & Loss Reduction',
                    titleFontSize: 17,
                    children: Row({
                        width: 804,
                        gap: 12,
                        justify: 'space-around',
                        align: 'center',
                        children: [
                            BadgePill({
                                c,
                                text: 'Row 1: 6 + 0.25(−1.0) = 5.75h',
                                tone: 'cyan',
                                fontSize: 16,
                                height: 28,
                            }),
                            BadgePill({
                                c,
                                text: 'Row 2: 6 + 0.25(−1.0) = 5.75h',
                                tone: 'cyan',
                                fontSize: 16,
                                height: 28,
                            }),
                            BadgePill({
                                c,
                                text: 'Row 3: 6 + 0.25(+14.0) = 9.50h',
                                tone: 'green',
                                fontSize: 16,
                                height: 28,
                            }),
                            BadgePill({
                                c,
                                text: 'MSE: 72.00 → 43.125',
                                tone: 'warm',
                                fontSize: 16,
                                height: 28,
                            }),
                        ],
                    }),
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
