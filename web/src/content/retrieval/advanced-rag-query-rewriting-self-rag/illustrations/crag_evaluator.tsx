import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 600
export const height = 716
export const alt =
    'The maximum document score on a 0–1 teaching scale selects a CRAG route: 0.17 is Incorrect, 0.45 is Ambiguous, and 0.81 is Correct. Scores below 0.2 discard internal evidence, scores from 0.2 through 0.7 inclusive take the Ambiguous route, and scores above 0.7 refine usable internal evidence. A separate policy gate controls any public search.'
export const caption =
    'Maximum document score selects route across [0.2, 0.7] cutoffs; external web search requires explicit egress policy approval.'

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
    stroke = c.border,
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

function marker(
    c: Colors,
    x: number,
    y: number,
    text: string,
    tone: 'critical' | 'warm' | 'green',
) {
    const color = getReadableToneColor(tone, c, c.bgCard)
    return [
        label(c, text, x - 36, y, 72, 26, 20, color, 800, 'center'),
        CanvasItem({
            x: x - 2,
            y: y + 24,
            width: 4,
            height: 39,
            children: React.createElement(
                'svg',
                {
                    width: 4,
                    height: 39,
                    viewBox: '0 0 4 39',
                    role: 'presentation',
                    'aria-hidden': true,
                },
                VectorSegment({
                    x1: 2,
                    y1: 0,
                    x2: 2,
                    y2: 39,
                    color,
                    strokeWidth: 3,
                    showStartDot: false,
                    showEndDot: false,
                }),
            ),
        }),
    ]
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const incorrect = getReadableToneColor('critical', c, c.bgCard)
    const ambiguous = getReadableToneColor('warm', c, c.bgCard)
    const correct = getReadableToneColor('green', c, c.bgCard)
    const axisX = 42
    const axisWidth = 516
    const xAt = (value: number) => axisX + axisWidth * value
    const children: React.ReactNode[] = [
        label(
            c,
            'The best passage score selects the route',
            24,
            14,
            552,
            34,
            25,
            c.textPrimary,
            800,
        ),
        label(
            c,
            'Teaching scale 0–1 · max document score selects route',
            24,
            51,
            552,
            28,
            20,
            c.textSecondary,
            600,
        ),

        frame(c, axisX, 113, axisWidth * 0.2, 30, getToneFill('critical', c), c.borderSubtle, 4),
        frame(c, xAt(0.2), 113, axisWidth * 0.5, 30, getToneFill('warm', c), c.borderSubtle, 0),
        frame(c, xAt(0.7), 113, axisWidth * 0.3, 30, getToneFill('green', c), c.borderSubtle, 4),
        label(c, 'LOW', axisX, 148, axisWidth * 0.2, 26, 20, incorrect, 800, 'center'),
        label(c, 'UNCERTAIN', xAt(0.2), 148, axisWidth * 0.5, 26, 20, ambiguous, 800, 'center'),
        label(c, 'STRONG', xAt(0.7), 148, axisWidth * 0.3, 26, 20, correct, 800, 'center'),
        label(c, '0', axisX - 15, 177, 30, 25, 20, c.textMuted, 600, 'center'),
        label(c, '.20', xAt(0.2) - 25, 177, 50, 25, 20, c.textMuted, 700, 'center'),
        label(c, '.70', xAt(0.7) - 25, 177, 50, 25, 20, c.textMuted, 700, 'center'),
        label(c, '1', axisX + axisWidth - 15, 177, 30, 25, 20, c.textMuted, 600, 'center'),
        ...marker(c, xAt(0.17), 79, '0.17', 'critical'),
        ...marker(c, xAt(0.45), 79, '0.45', 'warm'),
        ...marker(c, xAt(0.81), 79, '0.81', 'green'),
        label(
            c,
            'Both threshold values enter Ambiguous.',
            28,
            204,
            544,
            26,
            20,
            c.textPrimary,
            700,
            'center',
        ),

        frame(c, 22, 239, 176, 156, c.bgCard, c.border, 11),
        label(c, 'Incorrect', 34, 250, 152, 26, 20, incorrect, 800),
        label(c, 'Below 0.20', 34, 280, 152, 26, 20, c.textSecondary, 650),
        label(c, 'Discard passages.', 34, 312, 152, 52, 20, c.textPrimary, 650),

        frame(c, 212, 239, 176, 156, c.bgCard, c.border, 11),
        label(c, 'Ambiguous', 224, 250, 152, 26, 20, ambiguous, 800),
        label(c, '0.20–0.70', 224, 280, 152, 26, 20, c.textSecondary, 650),
        label(c, 'Refine evidence.', 224, 312, 152, 52, 20, c.textPrimary, 650),

        frame(c, 402, 239, 176, 156, c.bgCard, c.border, 11),
        label(c, 'Correct', 414, 250, 152, 26, 20, correct, 800),
        label(c, 'Above 0.70', 414, 280, 152, 26, 20, c.textSecondary, 650),
        label(c, 'Use internal evidence.', 414, 312, 152, 52, 20, c.textPrimary, 650),

        frame(c, 22, 410, 556, 294, c.bgCardAlt, c.borderSubtle, 12),
        label(c, 'Public-search permission gate', 38, 423, 520, 28, 22, c.textPrimary, 750),
        label(
            c,
            'Policy decides if a public search may run.',
            38,
            453,
            520,
            28,
            20,
            c.textSecondary,
            600,
        ),
        frame(c, 38, 492, 248, 91, c.bgCard, c.borderSubtle, 10),
        label(c, 'ALLOWED', 52, 503, 220, 26, 20, correct, 800),
        label(c, 'Search approved public sources.', 52, 531, 220, 48, 20, c.textPrimary, 650),
        frame(c, 300, 492, 260, 91, c.bgCard, c.borderSubtle, 10),
        label(c, 'DENIED', 314, 503, 232, 26, 20, incorrect, 800),
        label(c, 'Keep query internal; show the gap.', 314, 531, 232, 48, 20, c.textPrimary, 650),
        label(
            c,
            'Incorrect and Ambiguous routes reach this gate.',
            38,
            594,
            520,
            27,
            20,
            c.textMuted,
            600,
        ),
        label(
            c,
            'Review sources before accepting a claim.',
            38,
            628,
            520,
            27,
            20,
            c.textSecondary,
            600,
            'center',
        ),
    ]
    return Board({ c, width, height, children })
}

export default create('dark')
