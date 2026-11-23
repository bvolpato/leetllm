import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 600
export const height = 742
export const alt =
    'Known endpoint names let three independent embedding API searches start together and merge into a comparison that marks missing evidence. Finding the endpoint with the most errors first creates a dependency: the circuit-breaker search waits for that endpoint result.'
export const caption =
    'Independent sub-queries execute in parallel; unresolved hops wait for upstream results and surface missing evidence explicitly.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align }),
    })
}

function frame(
    c: Colors,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke = c.borderSubtle,
    rx = 10,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: React.createElement(
            'svg',
            {
                width: w,
                height: h,
                viewBox: `0 0 ${w} ${h}`,
                role: 'presentation',
                'aria-hidden': true,
            },
            SvgFrame({ c, x: 0, y: 0, width: w, height: h, rx, fill, stroke, strokeWidth: 1.2 }),
        ),
    })
}

function arrow(c: Colors, x: number, y: number, w: number, h: number) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: React.createElement(
            'svg',
            {
                width: w,
                height: h,
                viewBox: `0 0 ${w} ${h}`,
                role: 'presentation',
                'aria-hidden': true,
            },
            VectorSegment({
                x1: 2,
                y1: h / 2,
                x2: w - 12,
                y2: h / 2,
                color: getReadableToneColor('blue', c, c.bgCard),
                strokeWidth: 2.5,
                showStartDot: false,
                showEndDot: false,
            }),
            VectorArrow({
                x1: w - 12,
                y1: h / 2,
                x2: w - 2,
                y2: h / 2,
                color: getReadableToneColor('blue', c, c.bgCard),
                strokeWidth: 2.5,
                arrowSize: 4,
            }),
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bgCard)
    const purple = getReadableToneColor('purple', c, c.bgCard)
    const green = getReadableToneColor('green', c, c.bgCard)
    const children: React.ReactNode[] = [
        label(c, 'Two query shapes, two paths', 24, 14, 552, 34, 25, c.textPrimary, 800),
        label(
            c,
            'Known lookups run together; dependencies wait.',
            24,
            51,
            552,
            30,
            20,
            c.textSecondary,
            550,
        ),

        frame(c, 22, 98, 556, 286, c.bgCard, c.border, 12),
        label(c, 'PARALLEL · endpoint names are known', 38, 110, 524, 25, 20, blue, 800),
        label(
            c,
            'Compare sync + batch latency, limits, and retries.',
            38,
            139,
            524,
            28,
            20,
            c.textSecondary,
            600,
        ),

        frame(c, 38, 176, 150, 164, c.bgCardAlt, c.borderSubtle, 10),
        label(c, 'Start now', 50, 188, 126, 27, 20, blue, 800, 'center'),
        label(c, 'Both names are known.', 50, 220, 126, 82, 20, c.textPrimary, 600, 'center'),

        frame(c, 211, 176, 157, 46, c.bgCardAlt, c.borderSubtle, 9),
        label(c, '01  Latency', 221, 186, 140, 26, 20, c.textPrimary, 650),
        frame(c, 211, 235, 157, 46, c.bgCardAlt, c.borderSubtle, 9),
        label(c, '02  Limits', 221, 245, 140, 26, 20, c.textPrimary, 650),
        frame(c, 211, 294, 157, 46, c.bgCardAlt, c.borderSubtle, 9),
        label(c, '03  Retries', 221, 304, 140, 26, 20, c.textPrimary, 650),
        arrow(c, 188, 188, 20, 22),
        arrow(c, 188, 247, 20, 22),
        arrow(c, 188, 306, 20, 22),
        arrow(c, 370, 188, 20, 22),
        arrow(c, 370, 247, 20, 22),
        arrow(c, 370, 306, 20, 22),
        frame(c, 392, 176, 168, 164, c.bgCardAlt, c.borderSubtle, 10),
        label(c, 'Gather results', 404, 188, 144, 27, 20, green, 800, 'center'),
        label(
            c,
            'Compare measures; show missing as gaps.',
            404,
            220,
            144,
            112,
            20,
            c.textPrimary,
            600,
            'center',
        ),

        frame(c, 22, 398, 556, 312, c.bgCard, c.border, 12),
        label(c, 'SEQUENTIAL · the endpoint is unknown', 38, 410, 524, 25, 20, purple, 800),
        label(
            c,
            'Hop 2 needs the endpoint returned by hop 1.',
            38,
            439,
            524,
            28,
            20,
            c.textSecondary,
            600,
        ),

        frame(c, 38, 480, 205, 156, c.bgCardAlt, c.borderSubtle, 10),
        label(c, '1 · Find endpoint', 50, 490, 181, 27, 20, purple, 800),
        label(c, 'Which endpoint had most errors?', 50, 519, 181, 58, 20, c.textPrimary, 600),
        frame(c, 50, 580, 181, 54, c.bgCard, c.borderSubtle, 7),
        label(c, 'embeddings/sync', 56, 580, 169, 54, 20, blue, 650, 'center'),

        arrow(c, 249, 535, 28, 28),
        frame(c, 283, 480, 277, 156, c.bgCardAlt, c.borderSubtle, 10),
        label(c, '2 · Search that endpoint', 295, 490, 253, 27, 20, green, 800),
        label(c, 'Read its circuit-breaker settings.', 295, 522, 253, 60, 20, c.textPrimary, 600),
        label(
            c,
            'If hop 1 has no result, show the missing endpoint.',
            38,
            646,
            524,
            28,
            20,
            c.textSecondary,
            600,
        ),
        label(
            c,
            'Dependent queries wait for their required result.',
            38,
            678,
            524,
            28,
            20,
            c.textMuted,
            550,
        ),
    ]

    return Board({ c, width, height, children })
}

export default create('dark')
