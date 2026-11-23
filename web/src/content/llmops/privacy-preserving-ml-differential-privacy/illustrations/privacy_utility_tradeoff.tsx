import React from 'react'
import {
    AxisPlot,
    CanvasItem,
    Column,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 800
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A log-log plot shows the RMS noise norm divided by per-coordinate standard deviation sigma C growing as the square root of trainable dimension d. At sigma C = 1, five million coordinates give RMS 2,236; seven billion give RMS 83,666. With normalizer L = 128 and learning rate eta = 0.01, parameter-step RMS values are 0.17 for the adapter and 6.54 for the full model. Measure task quality for each parameterization.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = { ...base, textMuted: base.textSecondary, shadow: 'transparent' }
    const full = getReadableToneColor('blue', c)
    const adapter = getReadableToneColor('purple', c)
    const plotWidth = 760
    const plotHeight = 420
    const padding = 44
    const xMin = 3
    const xMax = 10
    const yMin = 1.5
    const yMax = 5
    const toPlotPoint = (screenX: number, screenY: number) => ({
        x: xMin + ((screenX - padding) / (plotWidth - padding * 2)) * (xMax - xMin),
        y: yMax - ((screenY - padding) / (plotHeight - padding * 2)) * (yMax - yMin),
    })
    const adapterLeader = [toPlotPoint(362, 158), toPlotPoint(388, 185)]
    const fullX = Math.log10(7_000_000_000)
    const adapterX = Math.log10(5_000_000)
    const markerLabels = [
        <CanvasItem key="adapter-label" x={142} y={118} width={220} height={30 * 1.35 + 4}>
            <div
                style={{
                    width: 220,
                    display: 'flex',
                    padding: '2px 5px',
                    backgroundColor: c.bg,
                    borderRadius: 4,
                }}
            >
                <TextLabel c={c} text="5M · 2,236" fontSize={30} fontWeight={800} color={adapter} />
            </div>
        </CanvasItem>,
        <CanvasItem key="full-label" x={420} y={1} width={238} height={30 * 1.35 + 4}>
            <div
                style={{
                    width: 238,
                    display: 'flex',
                    padding: '2px 5px',
                    backgroundColor: c.bg,
                    borderRadius: 4,
                }}
            >
                <TextLabel c={c} text="7B · 83,666" fontSize={30} fontWeight={800} color={full} />
            </div>
        </CanvasItem>,
    ]
    const chart = AxisPlot({
        c,
        width: plotWidth,
        height: plotHeight,
        xMin,
        xMax,
        yMin,
        yMax,
        padding,
        showAxes: false,
        showGrid: true,
        gridCount: 4,
        paths: [
            {
                points: [
                    { x: 3, y: 1.5 },
                    { x: 10, y: 5 },
                ],
                color: c.textSecondary,
                strokeWidth: 3,
            },
            { points: adapterLeader, color: adapter, strokeWidth: 2 },
            {
                points: [
                    { x: 3, y: 1.5 },
                    { x: 10, y: 1.5 },
                ],
                color: c.borderLight,
                strokeWidth: 2,
            },
            {
                points: [
                    { x: 3, y: 1.5 },
                    { x: 3, y: 5 },
                ],
                color: c.borderLight,
                strokeWidth: 2,
            },
        ],
        points: [
            {
                x: adapterX,
                y: Math.log10(Math.sqrt(5_000_000)),
                fill: adapter,
                r: 11,
                stroke: c.bg,
                strokeWidth: 3,
            },
            {
                x: fullX,
                y: Math.log10(Math.sqrt(7_000_000_000)),
                fill: full,
                r: 11,
                stroke: c.bg,
                strokeWidth: 3,
            },
        ],
    })

    return Scene({
        c,
        padding: 24,
        gap: 12,
        contentWidth: 960,
        children: Column({
            gap: 9,
            children: [
                TextLabel({
                    c,
                    text: 'Independent noise grows with √d',
                    fontSize: 39,
                    fontWeight: 850,
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'RMS(Z) = σC√d  ·  d counts trainable coordinates',
                    math: true,
                    fontSize: 31,
                    fontWeight: 750,
                    color: c.textSecondary,
                }),
                TextLabel({
                    c,
                    text: 'log₁₀(RMS / σC)  ·  both axes are logarithmic',
                    math: true,
                    fontSize: 25,
                    fontWeight: 650,
                    color: c.textSecondary,
                }),
                <div
                    key="plot"
                    style={{
                        position: 'relative',
                        display: 'flex',
                        width: plotWidth,
                        height: plotHeight,
                        alignSelf: 'center',
                    }}
                >
                    {chart}
                    {markerLabels}
                </div>,
                TextLabel({
                    c,
                    text: 'log₁₀(d), trainable coordinates',
                    math: true,
                    align: 'center',
                    fontSize: 25,
                    fontWeight: 650,
                    color: c.textSecondary,
                }),
                TextLabel({
                    c,
                    text: 'Same σC = 1 · public L = 128 · learning rate η = 0.01',
                    math: true,
                    fontSize: 26,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Column({
                    gap: 6,
                    width: 760,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: '7B full model · step RMS 6.54',
                            fontSize: 30,
                            fontWeight: 800,
                            color: full,
                        }),
                        TextLabel({
                            c,
                            text: '5M adapter · step RMS 0.17',
                            fontSize: 30,
                            fontWeight: 800,
                            color: adapter,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
