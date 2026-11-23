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
export const height = 654
export const alt =
    'Two scenarios compare teacher probabilities 0.58, 0.40, 0.02 against student distributions 0.54, 0.36, 0.10 and 0.40, 0.35, 0.25 for 7d, 3d, and never. All six tracks share a probability axis from zero to 0.60. The extra student mass on never is 0.08 and 0.23. Their forward and reverse KL results are 0.051 and 0.084, then 0.218 and 0.436. These full-support divergence values quantify distribution mismatch; factual correctness requires separate checks.'

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

const scenarios = [
    {
        title: 'A · student never = 0.10 · extra mass +0.08',
        forward: '0.051',
        reverse: '0.084',
        student: [0.54, 0.36, 0.1],
    },
    {
        title: 'B · student never = 0.25 · extra mass +0.23',
        forward: '0.218',
        reverse: '0.436',
        student: [0.4, 0.35, 0.25],
    },
]
const teacher = [0.58, 0.4, 0.02]
const outcomes = ['7d', '3d', 'never']

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const studentColor = getReadableToneColor('cyan', c)
    const alertColor = getReadableToneColor('warm', c)
    const axisStart = 150
    const axisWidth = 224
    const rows = [224, 260, 296]
    const panelY = [117, 347]
    const shapes = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...scenarios.flatMap((scenario, scenarioIndex) => {
            const top = panelY[scenarioIndex]
            return [
                SvgFrame({
                    c,
                    x: 12,
                    y: top,
                    width: 648,
                    height: 204,
                    rx: 10,
                    fill: c.bgCard,
                    stroke: c.border,
                    strokeWidth: 1.2,
                }),
                VectorSegment({
                    x1: axisStart,
                    y1: top + 92,
                    x2: axisStart + axisWidth,
                    y2: top + 92,
                    color: c.borderLight,
                    strokeWidth: 2,
                    showStartDot: false,
                    showEndDot: false,
                }),
                ...[0, 0.3, 0.6].flatMap((value) => {
                    const x = axisStart + (axisWidth * value) / 0.6
                    return [
                        VectorSegment({
                            x1: x,
                            y1: top + 88,
                            x2: x,
                            y2: top + 98,
                            color: c.textMuted,
                            strokeWidth: 1.5,
                            showStartDot: false,
                            showEndDot: false,
                        }),
                    ]
                }),
                ...rows.flatMap((rowY, outcomeIndex) => {
                    const teacherY = rowY + scenarioIndex * 230
                    const studentY = teacherY + 11
                    const teacherValue = teacher[outcomeIndex]
                    const studentValue = scenario.student[outcomeIndex]
                    return [
                        VectorSegment({
                            x1: axisStart,
                            y1: teacherY,
                            x2: axisStart + (axisWidth * teacherValue) / 0.6,
                            y2: teacherY,
                            color: c.textMuted,
                            strokeWidth: 5,
                            showStartDot: false,
                            showEndDot: true,
                            dotRadius: 4,
                        }),
                        VectorSegment({
                            x1: axisStart,
                            y1: studentY,
                            x2: axisStart + (axisWidth * studentValue) / 0.6,
                            y2: studentY,
                            color: studentColor,
                            strokeWidth: 6,
                            showStartDot: false,
                            showEndDot: true,
                            dotRadius: 4.5,
                        }),
                    ]
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
                'KL direction scores probability mismatch',
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
                'Teacher=gray · student=cyan · shared P axis 0–0.60',
                18,
                49,
                636,
                26,
                22,
                c.textSecondary,
                600,
            ),
            label(
                c,
                'Forward Dₖₗ(Pₜ∥Pₛ) · Reverse Dₖₗ(Pₛ∥Pₜ)',
                18,
                78,
                636,
                26,
                22,
                c.textPrimary,
                650,
            ),
            ...scenarios.flatMap((scenario, index) => {
                const top = panelY[index]
                return [
                    label(
                        c,
                        scenario.title,
                        24,
                        top + 7,
                        620,
                        25,
                        24,
                        index === 0 ? studentColor : alertColor,
                        750,
                    ),
                    label(
                        c,
                        `Forward KL ${scenario.forward} · Reverse KL ${scenario.reverse}`,
                        24,
                        top + 35,
                        620,
                        24,
                        24,
                        c.textPrimary,
                        700,
                    ),
                    ...[0, 0.3, 0.6].map((value) =>
                        label(
                            c,
                            value.toFixed(1),
                            axisStart + (axisWidth * value) / 0.6 - 22,
                            top + 61,
                            44,
                            19,
                            24,
                            c.textMuted,
                            550,
                            'center',
                            true,
                        ),
                    ),
                    ...outcomes.flatMap((outcome, outcomeIndex) => {
                        const rowY = rows[outcomeIndex] + index * 230
                        const studentValue = scenario.student[outcomeIndex]
                        return [
                            label(c, outcome, 24, rowY - 10, 100, 25, 24, c.textPrimary, 700),
                            label(
                                c,
                                `${teacher[outcomeIndex].toFixed(2)} / ${studentValue.toFixed(2)}`,
                                397,
                                rowY - 9,
                                250,
                                24,
                                24,
                                c.textPrimary,
                                650,
                                'left',
                                true,
                            ),
                        ]
                    }),
                ]
            }),
            label(
                c,
                'Full-support probability comparison.',
                18,
                568,
                636,
                26,
                22,
                c.textSecondary,
                600,
                'center',
            ),
            label(
                c,
                'KL measures distribution mismatch.',
                18,
                596,
                636,
                26,
                22,
                c.textSecondary,
                600,
                'center',
            ),
        ],
    })
}

export default create('dark')
