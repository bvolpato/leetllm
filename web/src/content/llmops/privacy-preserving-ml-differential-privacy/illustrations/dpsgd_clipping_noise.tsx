import React from 'react'
import {
    AxisPlot,
    Column,
    Row,
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
    'A coordinate plot marks a circle with radius C = 1. The gradient (3, 4), with norm 5, is scaled by 0.2 to (0.6, 0.8) on the circle. The vector (0.4, 0.3) stays inside, and (0.6, 0.8) lies on the boundary. Clip each record before summing, then add Gaussian noise with coordinate standard deviation sigma C and divide by fixed public L.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = { ...base, textMuted: base.textSecondary, shadow: 'transparent' }
    const raw = getReadableToneColor('warm', c)
    const clipped = getReadableToneColor('blue', c)
    const inside = getReadableToneColor('green', c)
    const boundary = getReadableToneColor('purple', c)
    const plotSize = 460
    const padding = 42
    const min = -1.2
    const max = 4.4
    const circle = Array.from({ length: 161 }, (_, index) => {
        const angle = (index / 160) * Math.PI * 2
        return { x: Math.cos(angle), y: Math.sin(angle) }
    })
    const plot = AxisPlot({
        c,
        width: plotSize,
        height: plotSize,
        xMin: min,
        xMax: max,
        yMin: min,
        yMax: max,
        padding,
        showGrid: true,
        gridCount: 4,
        paths: [{ points: circle, color: c.borderLight, strokeWidth: 3 }],
        vectors: [
            { x1: 0, y1: 0, x2: 3, y2: 4, color: raw, strokeWidth: 4, arrow: true, arrowSize: 7 },
            {
                x1: 0,
                y1: 0,
                x2: 0.6,
                y2: 0.8,
                color: clipped,
                strokeWidth: 6,
                arrow: true,
                arrowSize: 7,
            },
            {
                x1: 0,
                y1: 0,
                x2: 0.4,
                y2: 0.3,
                color: inside,
                strokeWidth: 4,
                arrow: true,
                arrowSize: 7,
            },
        ],
        points: [
            { x: 3, y: 4, fill: raw, r: 8 },
            { x: 0.4, y: 0.3, fill: inside, r: 8 },
            { x: 0.6, y: 0.8, fill: clipped, stroke: boundary, strokeWidth: 4, r: 11 },
        ],
    })
    const example = (text: string, color: string) => (
        <TextLabel
            key={text}
            c={c}
            text={text}
            math
            width={428}
            fontSize={34}
            fontWeight={700}
            color={color}
        />
    )

    return Scene({
        c,
        padding: 24,
        gap: 12,
        contentWidth: 960,
        children: Column({
            gap: 10,
            children: [
                TextLabel({
                    c,
                    text: 'Bound each record before aggregation',
                    fontSize: 38,
                    fontWeight: 850,
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'L₂ clip · direction stays · norm ≤ C = 1',
                    math: true,
                    fontSize: 34,
                    fontWeight: 650,
                    color: c.textSecondary,
                }),
                Row({
                    gap: 24,
                    width: 912,
                    align: 'start',
                    children: [
                        <div
                            key="geometry"
                            style={{
                                display: 'flex',
                                width: plotSize,
                                height: plotSize,
                                flexShrink: 0,
                            }}
                        >
                            {plot}
                        </div>,
                        Column({
                            gap: 13,
                            width: 428,
                            align: 'stretch',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'α = min(1, C / ‖g‖_2)',
                                    math: true,
                                    width: 428,
                                    fontSize: 34,
                                    fontWeight: 750,
                                    color: c.textPrimary,
                                }),
                                TextLabel({
                                    c,
                                    text: 'ḡ = αg',
                                    math: true,
                                    width: 428,
                                    fontSize: 40,
                                    fontWeight: 800,
                                    color: clipped,
                                }),
                                Column({
                                    gap: 4,
                                    width: 428,
                                    align: 'stretch',
                                    children: [
                                        TextLabel({
                                            c,
                                            text: 'g_2 = (3, 4) · norm 5',
                                            math: true,
                                            width: 428,
                                            fontSize: 32,
                                            fontWeight: 750,
                                            color: raw,
                                        }),
                                        TextLabel({
                                            c,
                                            text: 'scale by α = 0.2',
                                            math: true,
                                            width: 428,
                                            fontSize: 32,
                                            fontWeight: 650,
                                            color: c.textSecondary,
                                        }),
                                        TextLabel({
                                            c,
                                            text: 'ḡ_2 = (0.6, 0.8)',
                                            math: true,
                                            width: 428,
                                            fontSize: 36,
                                            fontWeight: 750,
                                            color: clipped,
                                        }),
                                    ],
                                }),
                                Column({
                                    gap: 5,
                                    width: 428,
                                    align: 'stretch',
                                    children: [
                                        example('g_1 · norm 0.5C · unchanged', inside),
                                        example('g_3 · norm C · unchanged', boundary),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                Column({
                    gap: 4,
                    width: 912,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Clip → sum + Gaussian noise (std σC)',
                            math: true,
                            width: 912,
                            fontSize: 34,
                            fontWeight: 750,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: '→ divide by public L',
                            math: true,
                            width: 912,
                            fontSize: 34,
                            fontWeight: 750,
                            color: c.textPrimary,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
