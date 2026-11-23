import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    getToneColor,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Log₂-spaced H100 SXM roofline. Bandwidth is 3.35 TB/s and dense FP16 compute is 989.5 TFLOP/s; their curves meet at 295.4 FLOP/byte. The plotted ceilings are 3.35, 107.2, and 428.8 TFLOP/s at intensity 1, 32, and 128, then 989.5 TFLOP/s at the ridge. The lower of the byte-transfer and arithmetic ceilings limits the rate. I approximately equals batch size only when FP16 weights dominate; KV traffic changes intensity.'
export const width = 1120
export const height = 900

const bandwidth = 3.35
const compute = 989.5
const ridge = compute / bandwidth
const ridgeLog = Math.log2(ridge)
const log2 = (value: number) => Math.log2(value)
const chartWidth = 1060
const chartHeight = 520
const padding = 110
const xMin = -0.5
const xMax = 9.5
const yMin = 0
const yMax = 1100
const innerWidth = Math.max(1, chartWidth - padding * 2)
const innerHeight = Math.max(1, chartHeight - padding * 2)
const xTicks = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]
const yTicks = [0, 250, 500, 750, 1000]

// Keep these transforms identical to AxisPlot's SVG coordinate mapping.
const mapX = (value: number) => padding + ((value - xMin) / (xMax - xMin)) * innerWidth
const mapY = (value: number) =>
    padding + innerHeight - ((value - yMin) / (yMax - yMin)) * innerHeight
const dataX = (pixel: number) => xMin + ((pixel - padding) / innerWidth) * (xMax - xMin)
const dataY = (pixel: number) =>
    yMin + ((chartHeight - padding - pixel) / innerHeight) * (yMax - yMin)

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'center',
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
                    align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'center',
            },
        },
        TextLabel({ c, text, width, fontSize, fontWeight: 800, color, align }),
    )
    return CanvasItem({ x, y, width, height, children: content })
}

function sampledPath(start: number, end: number, yAt: (x: number) => number, segments = 40) {
    return Array.from({ length: segments + 1 }, (_, index) => {
        const x = start + ((end - start) * index) / segments
        return { x, y: yAt(x) }
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const hbm = getToneColor('blue', c)
    const fp16 = getToneColor('purple', c)
    const callouts = [
        {
            intensity: 1,
            rate: bandwidth,
            text: 'I=1 · 3.35',
            color: hbm,
            x: 165,
            y: 362,
            width: 230,
            fontSize: 38,
        },
        {
            intensity: 32,
            rate: 107.2,
            text: 'I=32 · 107.2',
            color: hbm,
            x: 405,
            y: 315,
            width: 260,
            fontSize: 38,
        },
        {
            intensity: 128,
            rate: 428.8,
            text: 'I=128 · 428.8',
            color: hbm,
            x: 590,
            y: 218,
            width: 310,
            fontSize: 38,
        },
        {
            intensity: ridge,
            rate: compute,
            text: 'Ridge I=295.4 · 989.5',
            color: fp16,
            x: 640,
            y: 66,
            width: 380,
            fontSize: 36,
        },
    ].map((callout) => ({
        ...callout,
        px: mapX(log2(callout.intensity)),
        py: mapY(callout.rate),
        height: 48,
    }))

    const hbmTop = log2(yMax / bandwidth)
    const plotVectors = [
        {
            x1: xMin,
            y1: yMin,
            x2: xMax,
            y2: yMin,
            color: c.borderLight,
            strokeWidth: 2,
            opacity: 0.9,
        },
        {
            x1: xMin,
            y1: yMin,
            x2: xMin,
            y2: yMax,
            color: c.borderLight,
            strokeWidth: 2,
            opacity: 0.9,
        },
        ...xTicks.map((intensity) => ({
            x1: log2(intensity),
            y1: yMin,
            x2: log2(intensity),
            y2: yMax,
            color: c.borderSubtle,
            strokeWidth: 1,
            opacity: 0.68,
        })),
        ...yTicks.slice(1).map((rate) => ({
            x1: xMin,
            y1: rate,
            x2: xMax,
            y2: rate,
            color: c.borderSubtle,
            strokeWidth: 1,
            opacity: 0.68,
        })),
        ...callouts.map((callout) => {
            const edgeX = Math.max(callout.x, Math.min(callout.px, callout.x + callout.width))
            const edgeY = Math.max(callout.y, Math.min(callout.py, callout.y + callout.height))
            return {
                x1: log2(callout.intensity),
                y1: callout.rate,
                x2: dataX(edgeX),
                y2: dataY(edgeY),
                color: callout.color,
                strokeWidth: 2.2,
                opacity: 0.96,
            }
        }),
    ]

    const plot = AxisPlot({
        c,
        width: chartWidth,
        height: chartHeight,
        xMin,
        xMax,
        yMin,
        yMax,
        padding,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        gridCount: 0,
        vectors: plotVectors,
        paths: [
            {
                points: sampledPath(xMin, hbmTop, (x) => bandwidth * 2 ** x),
                tone: 'blue',
                strokeWidth: 3,
                opacity: 0.52,
                dashed: true,
            },
            {
                points: [
                    { x: xMin, y: compute },
                    { x: xMax, y: compute },
                ],
                tone: 'purple',
                strokeWidth: 3,
                opacity: 0.52,
                dashed: true,
            },
            {
                points: sampledPath(xMin, ridgeLog, (x) => bandwidth * 2 ** x),
                tone: 'blue',
                strokeWidth: 7,
            },
            {
                points: [
                    { x: ridgeLog, y: compute },
                    { x: xMax, y: compute },
                ],
                tone: 'purple',
                strokeWidth: 7,
            },
            {
                points: [
                    { x: ridgeLog, y: yMin },
                    { x: ridgeLog, y: compute },
                ],
                tone: 'neutral',
                strokeWidth: 2,
                opacity: 0.78,
                dashed: true,
            },
        ],
        points: [
            { x: log2(1), y: bandwidth, fill: hbm, r: 15, stroke: c.bgCard, strokeWidth: 3 },
            { x: log2(32), y: 107.2, fill: hbm, r: 15, stroke: c.bgCard, strokeWidth: 3 },
            { x: log2(128), y: 428.8, fill: hbm, r: 15, stroke: c.bgCard, strokeWidth: 3 },
            { x: ridgeLog, y: compute, fill: fp16, r: 17, stroke: c.bgCard, strokeWidth: 3 },
        ],
    })

    const chartOverlays = [
        CanvasItem({ x: 0, y: 0, width: chartWidth, height: chartHeight, children: plot }),
        label(c, 'Rate · TFLOP/s', 0, 8, 330, 44, 36, c.textSecondary, 'left'),
        ...yTicks.map((rate) =>
            label(
                c,
                String(rate),
                0,
                mapY(rate) - 22,
                padding - 10,
                44,
                36,
                c.textSecondary,
                'right',
            ),
        ),
        ...xTicks.map((intensity) =>
            label(
                c,
                String(intensity),
                mapX(log2(intensity)) - 28,
                mapY(0) + 10,
                56,
                38,
                36,
                c.textSecondary,
            ),
        ),
        ...callouts.map((callout) =>
            label(
                c,
                callout.text,
                callout.x,
                callout.y,
                callout.width,
                callout.height,
                callout.fontSize,
                callout.color,
            ),
        ),
    ]

    return Scene({
        c,
        padding: 24,
        gap: 8,
        align: 'center',
        contentWidth: 1060,
        children: [
            TextLabel({
                c,
                text: 'H100 SXM · dense FP16 roofline',
                fontSize: 42,
                fontWeight: 850,
                color: c.textPrimary,
                width: 1060,
            }),
            Board({ c, width: chartWidth, height: chartHeight, children: chartOverlays }),
            TextLabel({
                c,
                text: 'Operational intensity I (FLOP/byte, log₂)',
                fontSize: 36,
                fontWeight: 800,
                color: c.textMuted,
                width: 1060,
                align: 'center',
            }),
            Row({
                width: 1060,
                gap: 16,
                align: 'center',
                justify: 'space-between',
                children: [
                    TextLabel({
                        c,
                        text: 'HBM roof · 3.35 × I',
                        fontSize: 36,
                        fontWeight: 800,
                        color: hbm,
                        width: '49%',
                    }),
                    TextLabel({
                        c,
                        text: 'FP16 cap · 989.5',
                        fontSize: 36,
                        fontWeight: 800,
                        color: fp16,
                        width: '49%',
                        align: 'right',
                    }),
                ],
            }),
            TextLabel({
                c,
                text: 'Roof = min(3.35 × I, 989.5) · FP16 weights: I ≈ B',
                fontSize: 36,
                fontWeight: 750,
                color: c.textSecondary,
                width: 1060,
            }),
            TextLabel({
                c,
                text: 'KV traffic changes I · 0.34% compares ceiling rates',
                fontSize: 36,
                fontWeight: 750,
                color: c.textSecondary,
                width: 1060,
            }),
        ],
    })
}

export default create('dark')
