import { createElement } from 'react'
import {
    SvgFrame,
    SvgPoint,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    mapNumberLine,
    type ThemeMode,
} from 'vizmatic'
import { figure, label } from './decision_canvas'

export const width = 860
export const height = 520
export const preset = 'engineering'
export const alt =
    'Selective risk and coverage tradeoff across eight decision model evaluation cases on a probability axis from 0.50 to 1.00. A direct probability threshold of 0.80 selects four cases (three correct, one error) yielding 50.0% coverage and 25.0% selective risk. A normalized choice-confidence threshold of 0.80 (equivalent to p >= 0.867 for three choices) selects three cases (two correct, one error) yielding 37.5% coverage and 33.3% selective risk because the high-confidence error at 0.90 survives while the correct case at 0.86 is dropped.'

export const K = 3
export const threshold = 0.8
export const equivProb = 1 / K + (1 - 1 / K) * threshold // 0.8667

export const records = [
    { id: 1, p: 0.96, correct: true },
    { id: 2, p: 0.92, correct: true },
    { id: 3, p: 0.9, correct: false },
    { id: 4, p: 0.86, correct: true },
    { id: 5, p: 0.78, correct: true },
    { id: 6, p: 0.74, correct: false },
    { id: 7, p: 0.65, correct: true },
    { id: 8, p: 0.55, correct: false },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)
    const warm = getReadableToneColor('warm', c)

    const geometry = []
    const labels = []

    const line = (
        id: string,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color = c.border,
        dashed = false,
        width = 1.5,
    ) =>
        createElement(
            'g',
            { id, ...(dashed ? { strokeDasharray: '5 4' } : {}) },
            VectorSegment({
                x1,
                y1,
                x2,
                y2,
                color,
                strokeWidth: width,
                showStartDot: false,
                showEndDot: false,
            }),
        )

    const box = (id: string, x: number, y: number, w: number, h: number, tone: string) =>
        createElement(
            'g',
            { id },
            SvgFrame({
                c,
                x,
                y,
                width: w,
                height: h,
                rx: 8,
                fill: c.bgSubtle,
                stroke: tone,
                strokeWidth: 1.5,
            }),
        )

    // Layout
    const leftW = 460
    const rightW = 340
    const leftX = 24
    const rightX = 496
    const topY = 70
    const cardH = 410

    // Left Panel: Probability Axis & Gating Points
    geometry.push(box('plot-box', leftX, topY, leftW, cardH, blue))
    labels.push(
        label(
            c,
            'title-plot',
            '1. Evaluated Cases on Probability Axis',
            leftX + 16,
            topY + 16,
            leftW - 32,
            {
                size: 15,
                weight: 700,
                color: blue,
            },
        ),
        label(
            c,
            'sub-plot',
            'Green = Correctly classified, Red = Misclassification',
            leftX + 16,
            topY + 38,
            leftW - 32,
            {
                size: 13,
                color: c.textSecondary,
            },
        ),
    )

    // Number line axis across left panel: probability [0.50, 1.00] mapped to [leftX + 40, leftX + leftW - 40]
    const pAxisY = topY + 330
    const pMinX = leftX + 40
    const pMaxX = leftX + leftW - 40
    const pRange = pMaxX - pMinX
    const mapP = (p: number) => pMinX + ((p - 0.5) / 0.5) * pRange

    geometry.push(line('p-axis', pMinX - 10, pAxisY, pMaxX + 10, pAxisY, c.textSecondary, false, 2))
    labels.push(
        label(c, 'ax-lbl-min', '0.50', pMinX - 15, pAxisY + 8, 30, {
            size: 10,
            align: 'center',
            color: c.textSecondary,
        }),
        label(c, 'ax-lbl-mid', '0.75', mapP(0.75) - 15, pAxisY + 8, 30, {
            size: 10,
            align: 'center',
            color: c.textSecondary,
        }),
        label(c, 'ax-lbl-max', '1.00', pMaxX - 15, pAxisY + 8, 30, {
            size: 10,
            align: 'center',
            color: c.textSecondary,
        }),
        label(
            c,
            'ax-title',
            'Winning Option Probability (p)',
            leftX + 16,
            pAxisY + 28,
            leftW - 32,
            { size: 11, align: 'center', color: c.textPrimary, weight: 600 },
        ),
    )

    // Threshold lines
    const tProbX = mapP(threshold) // p = 0.80
    const tConfX = mapP(equivProb) // p = 0.8667

    geometry.push(
        line('thresh-prob-line', tProbX, topY + 70, tProbX, pAxisY, blue, true, 2),
        line('thresh-conf-line', tConfX, topY + 70, tConfX, pAxisY, purple, true, 2),
    )
    labels.push(
        label(c, 'lbl-tp', 'p >= 0.80', tProbX - 35, topY + 54, 70, {
            size: 11,
            weight: 700,
            align: 'center',
            color: blue,
        }),
        label(c, 'lbl-tc', 'p >= 0.867', tConfX - 35, topY + 70, 70, {
            size: 11,
            weight: 700,
            align: 'center',
            color: purple,
        }),
    )

    // Plot cases
    records.forEach((r, i) => {
        const cx = mapP(r.p)
        const cy = topY + 110 + i * 24
        const tone = r.correct ? green : red

        // Dashed drop line to axis
        geometry.push(
            line(`drop-${r.id}`, cx, cy + 6, cx, pAxisY, c.border, true, 1),
            createElement(
                'g',
                { id: `dot-${r.id}` },
                SvgPoint({
                    cx,
                    cy,
                    r: 6,
                    fill: tone,
                    stroke: tone,
                }),
            ),
        )

        labels.push(
            label(
                c,
                `case-lbl-${r.id}`,
                `Case ${r.id} (p=${r.p.toFixed(2)})`,
                cx > leftX + leftW - 140 ? cx - 125 : cx + 10,
                cy - 8,
                120,
                {
                    size: 11,
                    weight: 600,
                    align: cx > leftX + leftW - 140 ? 'right' : 'left',
                    color: tone,
                },
            ),
        )
    })

    // Highlight row 4 gap
    geometry.push(
        createElement(
            'g',
            { id: 'highlight-gap' },
            SvgFrame({
                c,
                x: tProbX,
                y: topY + 170,
                width: tConfX - tProbX,
                height: 40,
                rx: 3,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),
        ),
    )
    labels.push(
        label(c, 'lbl-gap', 'Case 4 dropped!', tProbX + 2, topY + 182, tConfX - tProbX - 4, {
            size: 9,
            weight: 700,
            align: 'center',
            color: c.textPrimary,
        }),
    )

    // Right Panel: Decision Metrics & Tradeoff Summary
    geometry.push(box('metrics-box', rightX, topY, rightW, cardH, purple))
    labels.push(
        label(
            c,
            'title-metrics',
            '2. Gating Tradeoff Comparison',
            rightX + 16,
            topY + 16,
            rightW - 32,
            {
                size: 15,
                weight: 700,
                color: purple,
            },
        ),
        label(
            c,
            'sub-metrics',
            'Stricter threshold can increase selective risk',
            rightX + 16,
            topY + 38,
            rightW - 32,
            {
                size: 13,
                color: c.textSecondary,
            },
        ),
    )

    // Card A: Probability Cutoff
    geometry.push(
        createElement(
            'g',
            { id: 'card-metric-a' },
            SvgFrame({
                c,
                x: rightX + 14,
                y: topY + 70,
                width: rightW - 28,
                height: 120,
                rx: 6,
                fill: c.bg,
                stroke: blue,
                strokeWidth: 1.5,
            }),
        ),
    )
    labels.push(
        label(
            c,
            'ma-title',
            'Probability Gate (tau = 0.80):',
            rightX + 24,
            topY + 80,
            rightW - 48,
            { size: 13, weight: 700, color: blue },
        ),
        label(
            c,
            'ma-selected',
            'Selected: Cases 1, 2, 3, 4 (4 of 8)',
            rightX + 24,
            topY + 102,
            rightW - 48,
            { size: 12, color: c.textPrimary },
        ),
        label(c, 'ma-cov', 'Coverage: 4/8 = 50.0%', rightX + 24, topY + 124, rightW - 48, {
            size: 12,
            weight: 600,
            color: green,
        }),
        label(
            c,
            'ma-risk',
            'Selective Risk: 1/4 = 25.0% (Case 3 error)',
            rightX + 24,
            topY + 146,
            rightW - 48,
            { size: 12, weight: 600, color: warm },
        ),
    )

    // Card B: Choice-Confidence Cutoff
    geometry.push(
        createElement(
            'g',
            { id: 'card-metric-b' },
            SvgFrame({
                c,
                x: rightX + 14,
                y: topY + 204,
                width: rightW - 28,
                height: 120,
                rx: 6,
                fill: c.bg,
                stroke: purple,
                strokeWidth: 1.5,
            }),
        ),
    )
    labels.push(
        label(
            c,
            'mb-title',
            'Choice-Confidence Gate (c >= 0.80):',
            rightX + 24,
            topY + 214,
            rightW - 48,
            { size: 13, weight: 700, color: purple },
        ),
        label(
            c,
            'mb-selected',
            'Selected: Cases 1, 2, 3 (p >= 0.867)',
            rightX + 24,
            topY + 236,
            rightW - 48,
            { size: 12, color: c.textPrimary },
        ),
        label(c, 'mb-cov', 'Coverage: 3/8 = 37.5%', rightX + 24, topY + 258, rightW - 48, {
            size: 12,
            weight: 600,
            color: warm,
        }),
        label(
            c,
            'mb-risk',
            'Selective Risk: 1/3 = 33.3% (Higher!)',
            rightX + 24,
            topY + 280,
            rightW - 48,
            { size: 12, weight: 700, color: red },
        ),
    )

    // Takeaway explanation
    labels.push(
        label(
            c,
            'takeaway-text',
            'Takeaway: High-confidence misclassifications (Case 3 at p=0.90) survive stricter gating while correct edge cases (Case 4 at p=0.86) get rejected.',
            rightX + 16,
            topY + 338,
            rightW - 32,
            { size: 11, color: c.textSecondary, lines: 4 },
        ),
    )

    // Top Header Banner
    labels.push(
        label(
            c,
            'header-main',
            'Confidence Gating & Selective Risk: The Impact of Calibration Errors',
            24,
            20,
            812,
            {
                size: 18,
                weight: 700,
                color: c.textPrimary,
            },
        ),
    )

    return figure(c, width, height, geometry, labels)
}

export default create('dark')
