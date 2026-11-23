import React from 'react'
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
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const width = 560
export const height = 650
export const alt =
    'Worked linear readout s = Σzᵢwᵢ with feature contributions credential cue 0.90 × 1.20 = +1.08, urgency cue 0.80 × 0.10 = +0.08, and formatting cue 0.70 × 0 = 0, summing to 1.16. Removing the credential cue reduces the score to 0.08; removing the zero-weight formatting cue leaves the score at 1.16.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    width: number,
    color = c.textPrimary,
    fontSize = 19,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
): React.ReactElement {
    return CanvasItem({
        x,
        y,
        width,
        height: Math.ceil(fontSize * 1.4),
        children: TextLabel({ c, text, width, color, fontSize, fontWeight: 650, align, mono }),
    })
}

function scoreLines(
    c: ThemeColors,
    rows: Array<{ y: number; label: string; value: number; valueLabel: string; color: string }>,
): React.ReactElement {
    const plot = {
        x: 156,
        y: 4,
        width: 370,
        height: 170,
        padding: 26,
        xMin: 0,
        xMax: 1.3,
        yMin: 0,
        yMax: 3,
    }
    const innerWidth = plot.width - 2 * plot.padding
    const innerHeight = plot.height - 2 * plot.padding
    const xAt = (value: number) =>
        plot.x + plot.padding + ((value - plot.xMin) / (plot.xMax - plot.xMin)) * innerWidth
    const yAt = (value: number) =>
        plot.y + plot.padding + ((plot.yMax - value) / (plot.yMax - plot.yMin)) * innerHeight
    const values = [0, 0.5, 1]

    return Board({
        c,
        width: 560,
        height: 228,
        children: [
            CanvasItem({
                x: plot.x,
                y: plot.y,
                width: plot.width,
                height: plot.height,
                children: AxisPlot({
                    c,
                    width: plot.width,
                    height: plot.height,
                    padding: plot.padding,
                    xMin: plot.xMin,
                    xMax: plot.xMax,
                    yMin: plot.yMin,
                    yMax: plot.yMax,
                    showFrame: false,
                    showAxes: true,
                    showGrid: true,
                    gridCount: 2,
                    vectors: rows
                        .filter((row) => row.value > 0)
                        .map((row) => ({
                            x1: 0,
                            y1: row.y,
                            x2: row.value,
                            y2: row.y,
                            color: row.color,
                            strokeWidth: 6,
                            arrow: true,
                            arrowSize: 8,
                        })),
                }),
            }),
            ...rows
                .map((row) => {
                    const y = yAt(row.y)
                    const endpoint = xAt(row.value)
                    return [
                        label(c, row.label, 4, y - 13, 146, row.color, 20, 'right', true),
                        label(
                            c,
                            row.valueLabel,
                            endpoint + 14,
                            y - 13,
                            80,
                            row.color,
                            21,
                            'left',
                            true,
                        ),
                    ]
                })
                .flat(),
            ...values.map((value) =>
                label(
                    c,
                    value === 1 ? '1.0' : String(value),
                    xAt(value) - 30,
                    170,
                    60,
                    c.textSecondary,
                    19,
                    'center',
                    true,
                ),
            ),
            label(c, 'score', 294, 195, 84, c.textSecondary, 19, 'center'),
        ],
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const credential = getReadableToneColor('green', c, c.bg, c.bg)
    const urgency = getReadableToneColor('warm', c, c.bg, c.bg)
    const formatting = getReadableToneColor('neutral', c, c.bg, c.bg)
    const score = getReadableToneColor('purple', c, c.bg, c.bg)
    const remove = getReadableToneColor('critical', c, c.bg, c.bg)
    const preserve = getReadableToneColor('blue', c, c.bg, c.bg)

    return Scene({
        c,
        title: 'A toy circuit turns feature values into a score',
        subtitle: 'authored numbers expose each contribution and edit',
        padding: 10,
        gap: 5,
        align: 'center',
        contentWidth: 560,
        children: Column({
            width: 560,
            gap: 5,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 's = Σ zᵢwᵢ',
                    width: 540,
                    fontSize: 24,
                    color: c.textPrimary,
                    fontWeight: 750,
                    align: 'center',
                    mono: true,
                }),
                TextLabel({
                    c,
                    text: 'Feature value × assigned weight = score contribution',
                    width: 540,
                    fontSize: 19,
                    color: c.textSecondary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Add the three contributions',
                    width: 540,
                    fontSize: 21,
                    color: c.textPrimary,
                    fontWeight: 700,
                    align: 'center',
                }),
                scoreLines(c, [
                    {
                        y: 2.5,
                        label: 'z₁: .9×1.2',
                        value: 1.08,
                        valueLabel: '+1.08',
                        color: credential,
                    },
                    {
                        y: 1.5,
                        label: 'z₂: .8×.1',
                        value: 0.08,
                        valueLabel: '+0.08',
                        color: urgency,
                    },
                    { y: 0.5, label: 'z₃: .7×0', value: 0, valueLabel: '+0.00', color: formatting },
                ]),
                TextLabel({
                    c,
                    text: 'Total score = 1.16',
                    width: 540,
                    fontSize: 22,
                    color: score,
                    fontWeight: 750,
                    align: 'center',
                    mono: true,
                }),
                TextLabel({
                    c,
                    text: 'Remove one feature value, then recompute',
                    width: 540,
                    fontSize: 21,
                    color: c.textPrimary,
                    fontWeight: 700,
                    align: 'center',
                }),
                scoreLines(c, [
                    { y: 2.5, label: 'baseline', value: 1.16, valueLabel: '1.16', color: score },
                    { y: 1.5, label: 'remove z₁', value: 0.08, valueLabel: '0.08', color: remove },
                    {
                        y: 0.5,
                        label: 'remove z₃',
                        value: 1.16,
                        valueLabel: '1.16',
                        color: preserve,
                    },
                ]),
            ],
        }),
    })
}

export default create('dark')
