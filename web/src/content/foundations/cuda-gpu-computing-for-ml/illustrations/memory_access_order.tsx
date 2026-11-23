import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneFill,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const preset = 'engineering'
export const width = 820
export const height = 636
export const alt =
    'Eight adjacent 4-byte words fit in one aligned 32-byte global-memory segment; column reads at stride 32 words scatter across eight separate segments. In shared memory, column-zero addresses 0, 32, through 224 all map to bank zero and serialize as an eight-way conflict. Padding the tile stride from 32 to 33 maps those lanes to banks zero through seven.'

const lbl = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    fontSize = 24,
    color = c.textSecondary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 550,
    mono = false,
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: fontSize + 10,
        children: TextLabel({ c, text, width: w, fontSize, color, align, fontWeight, mono }),
    })

const illustration = defineIllustration((c: ThemeColors) => {
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('critical', c)
    const greenBoxText = getReadableToneColor('green', c, getToneFill('green', c))
    const warmBoxText = getReadableToneColor('warm', c, getToneFill('warm', c))
    const redBoxText = getReadableToneColor('critical', c, getToneFill('critical', c))

    const shapes: React.ReactNode[] = [
        SvgFrame({
            x: 16,
            y: 92,
            width: 788,
            height: 130,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: 16,
            y: 234,
            width: 788,
            height: 130,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: 16,
            y: 380,
            width: 386,
            height: 240,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: 418,
            y: 380,
            width: 386,
            height: 240,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        ...Array.from({ length: 8 }, (_, lane) =>
            SvgFrame({
                key: `ga-${lane}`,
                x: 32 + lane * 94,
                y: 144,
                width: 94,
                height: 64,
                c,
                rx: lane === 0 || lane === 7 ? 8 : 0,
                fill: getToneFill('green', c),
                stroke: green,
                strokeWidth: 1.2,
            }),
        ),
        ...Array.from({ length: 8 }, (_, lane) =>
            SvgFrame({
                key: `gs-${lane}`,
                x: 32 + lane * 95,
                y: 286,
                width: 89,
                height: 64,
                c,
                rx: 8,
                fill: getToneFill('warm', c),
                stroke: warm,
                strokeWidth: 1.4,
            }),
        ),
        ...Array.from({ length: 8 }, (_, lane) => {
            const row = Math.floor(lane / 4)
            const col = lane % 4
            return [
                SvgFrame({
                    key: `sc-${lane}`,
                    x: 28 + col * 91,
                    y: 472 + row * 68,
                    width: 85,
                    height: 60,
                    c,
                    rx: 8,
                    fill: getToneFill('critical', c),
                    stroke: red,
                    strokeWidth: 1.3,
                }),
                SvgFrame({
                    key: `sp-${lane}`,
                    x: 430 + col * 91,
                    y: 472 + row * 68,
                    width: 85,
                    height: 60,
                    c,
                    rx: 8,
                    fill: getToneFill('green', c),
                    stroke: green,
                    strokeWidth: 1.3,
                }),
            ]
        }).flat(),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            background: 'transparent',
            c,
            width,
            height,
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: React.createElement(
                        'svg',
                        { width, height, viewBox: `0 0 ${width} ${height}` },
                        ...shapes,
                    ),
                }),
                lbl(c, 'Access patterns shape memory', 18, 12, 780, 29, c.textPrimary, 'left', 760),
                lbl(
                    c,
                    'Eight lanes load 4-byte words in global and shared memory.',
                    18,
                    50,
                    780,
                    24,
                ),
                lbl(
                    c,
                    'Global · adjacent words → 1 aligned 32-B segment',
                    32,
                    102,
                    756,
                    25,
                    green,
                    'left',
                    720,
                ),
                ...Array.from({ length: 8 }, (_, lane) => [
                    lbl(
                        c,
                        `L${lane}`,
                        32 + lane * 94,
                        148,
                        94,
                        24,
                        greenBoxText,
                        'center',
                        700,
                        true,
                    ),
                    lbl(
                        c,
                        `w${lane}`,
                        32 + lane * 94,
                        176,
                        94,
                        24,
                        greenBoxText,
                        'center',
                        650,
                        true,
                    ),
                ]).flat(),
                lbl(
                    c,
                    'Global · column stride 32 → 8 separate 32-B segments',
                    32,
                    244,
                    756,
                    25,
                    warm,
                    'left',
                    720,
                ),
                ...Array.from({ length: 8 }, (_, lane) => [
                    lbl(
                        c,
                        `L${lane}`,
                        32 + lane * 95,
                        290,
                        89,
                        24,
                        warmBoxText,
                        'center',
                        700,
                        true,
                    ),
                    lbl(
                        c,
                        `w${lane * 32}`,
                        32 + lane * 95,
                        318,
                        89,
                        24,
                        warmBoxText,
                        'center',
                        650,
                        true,
                    ),
                ]).flat(),
                lbl(c, 'Shared · stride 32 → Bank 0', 28, 392, 362, 25, red, 'left', 720),
                lbl(c, 'Lanes L0–L7 · 8-way conflict', 28, 426, 362, 24, c.textSecondary),
                ...Array.from({ length: 8 }, (_, lane) => {
                    const r = Math.floor(lane / 4)
                    const col = lane % 4
                    const bx = 28 + col * 91
                    const by = 474 + r * 68
                    return [
                        lbl(
                            c,
                            `w${lane * 32}`,
                            bx,
                            by + 2,
                            85,
                            24,
                            redBoxText,
                            'center',
                            650,
                            true,
                        ),
                        lbl(c, '→ B0', bx, by + 29, 85, 24, redBoxText, 'center', 720, true),
                    ]
                }).flat(),
                lbl(c, 'Shared · pad stride 33', 430, 392, 362, 25, green, 'left', 720),
                lbl(c, 'Lanes L0–L7 · conflict removed', 430, 426, 362, 24, c.textSecondary),
                ...Array.from({ length: 8 }, (_, lane) => {
                    const r = Math.floor(lane / 4)
                    const col = lane % 4
                    const bx = 430 + col * 91
                    const by = 474 + r * 68
                    return [
                        lbl(
                            c,
                            `w${lane * 33}`,
                            bx,
                            by + 2,
                            85,
                            24,
                            greenBoxText,
                            'center',
                            650,
                            true,
                        ),
                        lbl(
                            c,
                            `→ B${lane}`,
                            bx,
                            by + 29,
                            85,
                            24,
                            greenBoxText,
                            'center',
                            720,
                            true,
                        ),
                    ]
                }).flat(),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
