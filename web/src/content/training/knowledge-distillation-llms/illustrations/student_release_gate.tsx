import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 672
export const height = 590
export const alt =
    'An assigned deployment example tests four student values against release thresholds: checked accuracy 0.92 meets at least 0.90, policy error 0.04 fails at most 0.02, latency 42 milliseconds meets at most 60, and monthly cost 18,000 dollars meets at most 20,000. Three checks pass and the conjunctive release decision is blocked by policy error. These are exercise numbers, not measured deployment results.'

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
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

const rows = [
    {
        name: 'Checked accuracy',
        requirement: '≥ 0.90',
        value: '0.92',
        min: 0.8,
        max: 1,
        minLabel: '0.80',
        maxLabel: '1.00',
        threshold: 0.9,
        actual: 0.92,
        pass: true,
    },
    {
        name: 'Policy error',
        requirement: '≤ 0.02',
        value: '0.04',
        min: 0,
        max: 0.05,
        minLabel: '0.00',
        maxLabel: '0.05',
        threshold: 0.02,
        actual: 0.04,
        pass: false,
    },
    {
        name: 'Latency',
        requirement: '≤ 60 ms',
        value: '42 ms',
        min: 0,
        max: 80,
        minLabel: '0',
        maxLabel: '80 ms',
        threshold: 60,
        actual: 42,
        pass: true,
    },
    {
        name: 'Monthly cost',
        requirement: '≤ $20,000',
        value: '$18,000',
        min: 0,
        max: 25000,
        minLabel: '$0',
        maxLabel: '$25,000',
        threshold: 20000,
        actual: 18000,
        pass: true,
    },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const passColor = getReadableToneColor('green', c)
    const failColor = getReadableToneColor('red', c)
    const trackStart = 260
    const trackWidth = 202
    const rowY = [154, 235, 316, 397]
    const shapes = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...rows.flatMap((row, index) => {
            const y = rowY[index]
            const thresholdX =
                trackStart + (trackWidth * (row.threshold - row.min)) / (row.max - row.min)
            const valueX = trackStart + (trackWidth * (row.actual - row.min)) / (row.max - row.min)
            const color = row.pass ? passColor : failColor
            return [
                SvgFrame({
                    c,
                    x: trackStart,
                    y: y + 20,
                    width: trackWidth,
                    height: 14,
                    rx: 7,
                    fill: c.borderSubtle,
                    stroke: c.borderSubtle,
                    strokeWidth: 1,
                }),
                VectorSegment({
                    x1: trackStart,
                    y1: y + 27,
                    x2: valueX,
                    y2: y + 27,
                    color,
                    strokeWidth: 8,
                    showStartDot: false,
                    showEndDot: true,
                    dotRadius: 5,
                }),
                VectorSegment({
                    x1: thresholdX,
                    y1: y + 10,
                    x2: thresholdX,
                    y2: y + 44,
                    color: c.textPrimary,
                    strokeWidth: 2,
                    showStartDot: false,
                    showEndDot: false,
                }),
                SvgFrame({
                    c,
                    x: 574,
                    y: y + 12,
                    width: 80,
                    height: 37,
                    rx: 18,
                    fill: `${color}14`,
                    stroke: color,
                    strokeWidth: 1.4,
                }),
            ]
        }),
    )

    return Board({
        c,
        width,
        height,
        background: c.bgSubtle,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapes }),
            label(
                c,
                'A fast student can still fail the release gate',
                18,
                12,
                636,
                34,
                29,
                c.textPrimary,
                800,
            ),
            label(
                c,
                'Assigned exercise values · every threshold must pass',
                18,
                48,
                636,
                26,
                22,
                c.textSecondary,
                600,
            ),
            label(
                c,
                'Bar = student value · line = limit · labeled row units',
                18,
                83,
                636,
                25,
                22,
                c.textPrimary,
                650,
            ),
            ...rows.flatMap((row, index) => {
                const y = rowY[index]
                const color = row.pass ? passColor : failColor
                return [
                    label(c, row.name, 18, y + 1, 228, 25, 24, c.textPrimary, 700),
                    label(c, row.requirement, 18, y + 29, 228, 23, 24, c.textSecondary, 650),
                    label(c, row.value, 470, y + 13, 98, 27, 24, color, 800, 'right', true),
                    label(
                        c,
                        row.pass ? 'PASS' : 'FAIL',
                        579,
                        y + 17,
                        70,
                        25,
                        24,
                        color,
                        800,
                        'center',
                    ),
                ]
            }),
            ...rows.flatMap((row, index) => {
                const y = rowY[index]
                return [
                    label(
                        c,
                        row.minLabel,
                        trackStart - 24,
                        y + 54,
                        54,
                        21,
                        24,
                        c.textMuted,
                        550,
                        'center',
                        true,
                    ),
                    label(
                        c,
                        row.maxLabel,
                        trackStart + trackWidth + 8,
                        y + 54,
                        178,
                        21,
                        24,
                        c.textMuted,
                        550,
                        'left',
                        true,
                    ),
                ]
            }),
            label(
                c,
                'One failing gate blocks release.',
                18,
                496,
                636,
                27,
                24,
                failColor,
                750,
                'center',
            ),
            label(
                c,
                'Assigned exercise · not measured deployment data.',
                18,
                536,
                636,
                25,
                22,
                c.textSecondary,
                600,
                'center',
            ),
        ],
    })
}

export default create('dark')
