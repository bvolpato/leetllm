import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    PixelGrid,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
    type RgbPixel,
} from 'vizmatic'
import data from '../assets/figure_data.json'

export const width = 640
export const height = 610
export const autoSize = false
export const alt =
    'The same parcel image is shown at full brightness, at quarter brightness, and after blur. Normalized sharpness is 9.66, 9.66, and 0.59; brightness is 0.459, 0.115, and 0.419. Separate gates reject dim and blurred views.'

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 21,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: size + 8,
        children: TextLabel({
            c,
            text: value,
            width: w,
            fontSize: size,
            color,
            align,
        }),
    })

const illustration = defineIllustration((c) => {
    const colors = ['green', 'warm', 'red'].map((tone) =>
        getReadableToneColor(tone as 'green' | 'warm' | 'red', c),
    )
    return Scene({
        c,
        padding: 12,
        gap: 0,
        contentWidth: 616,
        children: Board({
            c,
            width: 616,
            height: 586,
            children: [
                ...data.quality.flatMap((item, index) => {
                    const x = 12 + index * 204
                    return [
                        text(c, x, 0, 184, item.name, 24, colors[index]),
                        CanvasItem({
                            x: x + 16,
                            y: 42,
                            width: 152,
                            height: 152,
                            children: PixelGrid({
                                c,
                                width: 152,
                                height: 152,
                                pixels: item.pixels.map((row) =>
                                    row.map((pixel): RgbPixel => [
                                        pixel[0],
                                        pixel[1],
                                        pixel[2],
                                    ]),
                                ),
                            }),
                        }),
                        text(
                            c,
                            x,
                            211,
                            184,
                            `brightness ${item.brightness.toFixed(3)}`,
                            20,
                        ),
                        text(
                            c,
                            x,
                            244,
                            184,
                            `raw var ${item.raw.toFixed(3)}`,
                            20,
                            c.textSecondary,
                        ),
                        text(
                            c,
                            x,
                            277,
                            184,
                            ['Pass both', 'Too dim', 'Too blurred'][index],
                            22,
                            colors[index],
                        ),
                    ]
                }),
                text(
                    c,
                    14,
                    326,
                    590,
                    'Normalized sharpness',
                    25,
                    c.textPrimary,
                    'left',
                ),
                CanvasItem({
                    x: 62,
                    y: 374,
                    width: 525,
                    height: 160,
                    children: AxisPlot({
                        c,
                        width: 525,
                        height: 160,
                        padding: 0,
                        xMin: 0,
                        xMax: 3,
                        yMin: 0,
                        yMax: 11,
                        showAxes: false,
                        showFrame: false,
                        showGrid: false,
                        paths: [0, 5, 10].map((y) => ({
                            points: [
                                { x: 0, y },
                                { x: 3, y },
                            ],
                            color: c.borderSubtle,
                            strokeWidth: 1,
                        })),
                    }),
                }),
                ...[0, 5, 10].map((v) =>
                    text(
                        c,
                        4,
                        374 + (1 - v / 11) * 160 - 12,
                        44,
                        String(v),
                        20,
                        c.textSecondary,
                        'right',
                    ),
                ),
                ...data.quality.flatMap((item, i) => [
                    CanvasItem({
                        x: 62 + i * 175 + 66.5,
                        y: 534 - (item.sharpness / 11) * 160,
                        width: 42,
                        height: (item.sharpness / 11) * 160,
                        children: <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: colors[i] }} />,
                    }),
                    text(
                        c,
                        62 + i * 175,
                        374 + (1 - item.sharpness / 11) * 160 - 31,
                        175,
                        item.sharpness.toFixed(2),
                        22,
                        colors[i],
                    ),
                    text(
                        c,
                        62 + i * 175,
                        548,
                        175,
                        ['Full', 'Quarter', 'Blur'][i],
                        22,
                        colors[i],
                    ),
                ]),
            ],
        }),
    })
})
export const create = illustration.create
export default illustration.default
