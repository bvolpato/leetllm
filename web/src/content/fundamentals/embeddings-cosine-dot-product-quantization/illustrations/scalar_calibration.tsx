import {
    AxisPlot,
    Column,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'AxisPlot over [-1, 1] shows how signed INT8 calibration with bound 25 creates coarse 0.197 quantization steps compared with clipped bound 1 at step 0.0079 closely tracking y = x. A ProgressList reports ordinary-range mean absolute error dropping from 0.0483 to 0.0019 (25x finer), while clipping saturates the single outlier 25 at 1.00.'
export const width = 640
export const height = 760

function quantizeCurve(bound: number) {
    const step = bound / 127
    const pts: Array<{ x: number; y: number }> = []
    for (let i = -60; i <= 60; i++) {
        const x = i / 60
        const q = Math.max(-127, Math.min(127, Math.round(x / step)))
        pts.push({ x, y: q * step })
    }
    return pts
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const red = getReadableToneColor('red', c)
    const green = getReadableToneColor('green', c)
    const gridLines = [-1, -0.5, 0, 0.5, 1]

    return Scene({
        c,
        title: 'One large outlier inflates scalar quantization step size',
        subtitle: 'Signed INT8 [−127, 127] calibrated to max(|v|) = 25 vs clipped bound = 1',
        padding: 14,
        gap: 8,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Reconstructed value vs true coordinate across [−1, 1]',
                    fontSize: 20,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 530,
                    height: 256,
                    padding: 20,
                    xMin: -1.04,
                    xMax: 1.04,
                    yMin: -1.08,
                    yMax: 1.08,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: [
                        ...gridLines.map((y) => ({
                            points: [
                                { x: -1, y },
                                { x: 1, y },
                            ],
                            tone: 'neutral' as const,
                            strokeWidth: y === 0 ? 2 : 1,
                            opacity: y === 0 ? 0.6 : 0.25,
                        })),
                        ...gridLines.map((x) => ({
                            points: [
                                { x, y: -1 },
                                { x, y: 1 },
                            ],
                            tone: 'neutral' as const,
                            strokeWidth: x === 0 ? 2 : 1,
                            opacity: x === 0 ? 0.6 : 0.25,
                        })),
                        {
                            points: [
                                { x: -1, y: -1 },
                                { x: 1, y: 1 },
                            ],
                            tone: 'neutral',
                            strokeWidth: 2,
                            dashed: true,
                            opacity: 0.7,
                        },
                        { points: quantizeCurve(25), color: red, strokeWidth: 4 },
                        { points: quantizeCurve(1), color: green, strokeWidth: 4 },
                    ],
                }),
                Row({
                    gap: 18,
                    align: 'center',
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Red: bound 25 (step 0.197)',
                            fontSize: 19,
                            color: red,
                        }),
                        TextLabel({
                            c,
                            text: 'Green: bound 1 (step 0.0079)',
                            fontSize: 19,
                            color: green,
                        }),
                    ],
                }),
                Column({
                    gap: 6,
                    align: 'stretch',
                    width: 590,
                    children: [
                        ProgressList({
                            c,
                            labelWidth: 300,
                            valueWidth: 88,
                            barHeight: 16,
                            fontSize: 19,
                            gap: 8,
                            rows: [
                                {
                                    label: 'Bound 25 · ordinary MAE',
                                    value: 0.0483 / 0.05,
                                    valueLabel: '0.0483',
                                    tone: 'red',
                                },
                                {
                                    label: 'Bound 1 · ordinary (25× finer)',
                                    value: 0.0019 / 0.05,
                                    valueLabel: '0.0019',
                                    tone: 'green',
                                },
                            ],
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Trade-off: bound 1 clips outlier 25 down to 1.00 (clipped error 24.0).',
                    fontSize: 19,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
