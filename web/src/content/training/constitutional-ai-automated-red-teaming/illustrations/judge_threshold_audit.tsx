import { createElement } from 'react'
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

export const width = 760
export const height = 770
export const alt =
    'Six calibrated judge probabilities sit on a common 0 to 1 violation-score axis. Scores at or below 0.20 are classified clear, scores at or above 0.80 are flagged, and middle scores go to review. The evaluated sample has two true positives, one false positive, one false negative, one true negative, and one review, so coverage is 5/6. Brier score over all six probabilities is 0.325.'

type Colors = ReturnType<typeof getThemeColors>

function text(
    c: Colors,
    value: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    weight = 650,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text: value,
            width: w,
            fontSize,
            color,
            fontWeight: weight,
            align,
        }),
    })
}

const labels = [1, 0, 1, 0, 1, 1] as const
const scores = [0.95, 0.9, 0.8, 0.2, 0.1, 0.5] as const

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)
    const purple = getReadableToneColor('purple', c)
    const blue = getReadableToneColor('blue', c)
    const left = 220
    const right = 720
    const xAt = (value: number) => left + value * (right - left)
    const yAt = (index: number) => 206 + index * 39
    const decisionColor = (score: number) => (score >= 0.8 ? red : score <= 0.2 ? green : purple)
    const geometry = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        SvgFrame({
            c,
            x: left,
            y: 158,
            width: xAt(0.2) - left,
            height: 294,
            rx: 0,
            fill: getToneFill('green', c),
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: xAt(0.2),
            y: 158,
            width: xAt(0.8) - xAt(0.2),
            height: 294,
            rx: 0,
            fill: getToneFill('purple', c),
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: xAt(0.8),
            y: 158,
            width: right - xAt(0.8),
            height: 294,
            rx: 0,
            fill: getToneFill('critical', c),
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        ...scores.map((score, index) =>
            VectorSegment({
                x1: left,
                y1: yAt(index),
                x2: right,
                y2: yAt(index),
                color: c.borderSubtle,
                strokeWidth: 1.4,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...[0, 0.2, 0.5, 0.8, 1].map((tick) =>
            VectorSegment({
                x1: xAt(tick),
                y1: 158,
                x2: xAt(tick),
                y2: 452,
                color: tick === 0.2 || tick === 0.8 ? c.border : c.borderSubtle,
                strokeWidth: tick === 0.2 || tick === 0.8 ? 2.5 : 1.2,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...scores.map((score, index) =>
            createElement('circle', {
                key: `case-${index + 1}`,
                cx: xAt(score),
                cy: yAt(index),
                r: 12,
                fill: decisionColor(score),
                stroke: c.bgCard,
                strokeWidth: 3,
            }),
        ),
        ...[
            { x: 38, y: 562, width: 190, height: 55, fill: getToneFill('green', c), stroke: green },
            {
                x: 230,
                y: 562,
                width: 242,
                height: 55,
                fill: getToneFill('critical', c),
                stroke: red,
            },
            { x: 476, y: 562, width: 250, height: 55, fill: getToneFill('blue', c), stroke: blue },
            {
                x: 38,
                y: 629,
                width: 190,
                height: 55,
                fill: getToneFill('critical', c),
                stroke: red,
            },
            {
                x: 230,
                y: 629,
                width: 242,
                height: 55,
                fill: getToneFill('green', c),
                stroke: green,
            },
            { x: 476, y: 629, width: 250, height: 55, fill: c.bgCard, stroke: c.borderSubtle },
        ].map((cell) => SvgFrame({ c, ...cell, rx: 10, strokeWidth: 2 })),
    )
    const rowLabels = scores.map((score, index) =>
        text(
            c,
            `${labels[index] ? 'V' : 'N'} · ${score.toFixed(2)}`,
            30,
            yAt(index) - 17,
            176,
            34,
            27,
            c.textPrimary,
            700,
        ),
    )
    return Board({
        background: 'transparent',
        c,
        width,
        height,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: geometry }),
            text(c, 'Thresholds expose judge errors', 28, 20, 704, 42, 34, c.textPrimary, 800),
            text(
                c,
                'Six authored scores · V = violation · N = no violation',
                28,
                66,
                704,
                34,
                25,
                c.textSecondary,
                550,
            ),
            text(c, 'Clear', left, 120, xAt(0.2) - left, 30, 25, green, 800, 'center'),
            text(c, 'Review', xAt(0.2), 120, xAt(0.8) - xAt(0.2), 30, 25, purple, 800, 'center'),
            text(c, 'Flag', xAt(0.8), 120, right - xAt(0.8), 30, 25, red, 800, 'center'),
            text(c, 'True label · p', 30, 164, 176, 28, 27, c.textSecondary, 650),
            ...rowLabels,
            text(c, '0', left - 12, 454, 32, 30, 27, c.textSecondary, 650, 'center'),
            text(c, '0.20', xAt(0.2) - 36, 454, 72, 30, 27, c.textSecondary, 650, 'center'),
            text(c, '0.50', xAt(0.5) - 36, 454, 72, 30, 27, c.textSecondary, 650, 'center'),
            text(c, '0.80', xAt(0.8) - 36, 454, 72, 30, 27, c.textSecondary, 650, 'center'),
            text(c, '1', right - 14, 454, 28, 30, 27, c.textSecondary, 650, 'center'),
            text(
                c,
                'Clear ≤ 0.20 · review between · flag ≥ 0.80',
                28,
                490,
                704,
                30,
                27,
                c.textPrimary,
                650,
            ),
            text(c, 'One middle score goes to review.', 28, 524, 704, 28, 25, c.textSecondary, 600),
            text(c, 'Violation', 45, 574, 174, 32, 27, c.textPrimary, 700, 'center'),
            text(c, 'No violation', 45, 641, 174, 32, 27, c.textPrimary, 700, 'center'),
            text(c, 'TP · 2', 240, 570, 222, 38, 28, green, 800, 'center'),
            text(c, 'FN · 1', 486, 570, 230, 38, 28, red, 800, 'center'),
            text(c, 'FP · 1', 240, 637, 222, 38, 28, red, 800, 'center'),
            text(c, 'TN · 1', 486, 637, 230, 38, 28, green, 800, 'center'),
            text(
                c,
                'Coverage 5/6 · Brier over all six = 0.325',
                28,
                709,
                704,
                32,
                27,
                c.textPrimary,
                700,
            ),
        ],
    })
}

export default create('dark')
