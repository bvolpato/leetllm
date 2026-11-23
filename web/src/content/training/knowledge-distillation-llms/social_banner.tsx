import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    renderToPngWithOutput,
    type ThemeMode,
} from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Knowledge Distillation for LLMs. A constructed teacher target assigns probabilities 0.8183, 0.1107, 0.0407, and 0.0302 to 7d, 3d, 30d, and never. An assigned four-check release exercise passes accuracy 0.92, latency 42 milliseconds, and monthly cost 18,000 dollars, but fails policy error at 0.04 against a 0.02 limit, so release is held.'

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

const teacher = [
    { answer: '7d', probability: 0.8183, shown: '0.8183' },
    { answer: '3d', probability: 0.1107, shown: '0.1107' },
    { answer: '30d', probability: 0.0407, shown: '0.0407' },
    { answer: 'never', probability: 0.0302, shown: '0.0302' },
]

const checks = [
    { name: 'Accuracy', value: '0.92', threshold: '≥ 0.90', pass: true },
    { name: 'Policy error', value: '0.04', threshold: '≤ 0.02', pass: false },
    { name: 'Latency', value: '42 ms', threshold: '≤ 60 ms', pass: true },
    { name: 'Monthly cost', value: '$18,000', threshold: '≤ $20,000', pass: true },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const teacherColor = getReadableToneColor('cyan', c)
    const passColor = getReadableToneColor('green', c)
    const failColor = getReadableToneColor('red', c)
    const trackStart = 180
    const trackWidth = 236
    const trackRows = [332, 376, 420, 464]
    const checkRows = [312, 352, 392, 432]
    const badgeColor = checks.map(row => row.pass ? passColor : failColor)
    const shapes = createElement(
        'svg',
        { width, height, viewBox: `0 0 ${width} ${height}`, role: 'presentation', 'aria-hidden': true },
        SvgFrame({ c, x: 40, y: 205, width: 520, height: 330, rx: 14, fill: c.bgCard, stroke: c.border, strokeWidth: 1.4 }),
        SvgFrame({ c, x: 580, y: 205, width: 580, height: 330, rx: 14, fill: c.bgCard, stroke: c.border, strokeWidth: 1.4 }),
        ...teacher.flatMap((row, index) => {
            const y = trackRows[index]
            return [
                VectorSegment({ x1: trackStart, y1: y, x2: trackStart + trackWidth, y2: y, color: c.borderSubtle, strokeWidth: 7, showStartDot: false, showEndDot: false }),
                VectorSegment({ x1: trackStart, y1: y, x2: trackStart + trackWidth * row.probability, y2: y, color: teacherColor, strokeWidth: 8, showStartDot: false, showEndDot: true, dotRadius: 5.5 }),
            ]
        }),
        ...[0, 0.5, 1].map(value => VectorSegment({
            x1: trackStart + trackWidth * value,
            y1: 299,
            x2: trackStart + trackWidth * value,
            y2: 307,
            color: c.textMuted,
            strokeWidth: 1.6,
            showStartDot: false,
            showEndDot: false,
        })),
        ...checks.flatMap((row, index) => {
            const y = checkRows[index]
            const color = badgeColor[index]
            return [
                VectorSegment({ x1: 604, y1: y + 33, x2: 1136, y2: y + 33, color: c.borderSubtle, strokeWidth: 1.2, showStartDot: false, showEndDot: false }),
                SvgFrame({ c, x: 1032, y: y - 4, width: 98, height: 34, rx: 17, fill: `${color}18`, stroke: color, strokeWidth: 1.3 }),
            ]
        }),
        SvgFrame({ c, x: 1008, y: 472, width: 122, height: 34, rx: 17, fill: `${failColor}18`, stroke: failColor, strokeWidth: 1.4 }),
    )

    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapes }),
            label(c, 'Teach a smaller model.', 54, 38, 760, 54, 46, c.textPrimary, 850),
            label(c, 'Test every release gate.', 54, 91, 760, 54, 46, c.textPrimary, 850),
            label(c, 'Teacher probabilities preserve alternatives; one failed policy check blocks release.', 56, 151, 1040, 32, 24, c.textSecondary, 600),
            label(c, 'LEETLLM', 1038, 70, 112, 34, 26, getReadableToneColor('purple', c), 850, 'right'),

            label(c, 'Constructed teacher target · T=1', 68, 224, 460, 34, 27, c.textPrimary, 800),
            label(c, 'Logits [4.0, 2.0, 1.0, 0.7] → softmax', 68, 263, 460, 27, 21, c.textSecondary, 600),
            label(c, 'P(answer)', 68, 290, 92, 22, 17, c.textSecondary, 650),
            label(c, '0', trackStart - 10, 290, 30, 22, 18, c.textMuted, 600, 'center', true),
            label(c, '0.5', trackStart + trackWidth / 2 - 20, 290, 40, 22, 18, c.textMuted, 600, 'center', true),
            label(c, '1.0', trackStart + trackWidth - 20, 290, 40, 22, 18, c.textMuted, 600, 'center', true),
            ...teacher.flatMap((row, index) => [
                label(c, row.answer, 70, trackRows[index] - 15, 92, 28, 24, c.textPrimary, 700),
                label(c, row.shown, 428, trackRows[index] - 15, 108, 28, 23, teacherColor, 750, 'right', true),
            ]),

            label(c, 'Assigned release exercise', 608, 224, 520, 34, 27, c.textPrimary, 800),
            label(c, 'Each condition must pass.', 608, 263, 520, 27, 21, c.textSecondary, 600),
            ...checks.flatMap((row, index) => {
                const color = badgeColor[index]
                const y = checkRows[index]
                return [
                    label(c, row.name, 608, y, 164, 28, 23, c.textPrimary, 700),
                    label(c, row.value, 778, y, 104, 28, 24, color, 800, 'right', true),
                    label(c, row.threshold, 892, y, 125, 28, 21, c.textSecondary, 650, 'center', true),
                    label(c, row.pass ? 'PASS' : 'FAIL', 1038, y + 1, 86, 26, 20, color, 850, 'center'),
                ]
            }),
            label(c, '3 of 4 checks pass', 608, 474, 370, 30, 25, c.textPrimary, 750),
            label(c, 'HOLD', 1016, 477, 106, 25, 20, failColor, 850, 'center'),
            label(c, 'Policy error 0.04 exceeds its 0.02 limit.', 608, 507, 520, 22, 18, c.textSecondary, 600),
            label(c, 'Constructed probabilities and assigned exercise values · not measured deployment data', 54, 566, 1092, 25, 20, c.textMuted, 550),
        ],
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner dimensions changed')
    return result
}

export default create('dark')
