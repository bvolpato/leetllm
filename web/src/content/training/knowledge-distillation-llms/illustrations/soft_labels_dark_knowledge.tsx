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
    'Three aligned probability tracks compare a trusted one-hot target with the teacher at T=1 and T=4 for 7d, 3d, 30d, and never. The top two answers stay in the same order while the 7d-minus-3d gap narrows from 1.000 to approximately 0.708 to approximately 0.156. Probability labels show four decimal places. The logits are a constructed restore-window example; T²=16 at T=4 is an approximate high-temperature gradient compensation.'

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

const stages = [
    {
        id: 'hard',
        title: 'Hard target',
        color: 'neutral' as const,
        values: [1, 0, 0, 0],
        shown: ['1.0000', '0.0000', '0.0000', '0.0000'],
    },
    {
        id: 't1',
        title: 'Teacher · T=1',
        color: 'cyan' as const,
        values: [0.818, 0.111, 0.041, 0.03],
        shown: ['0.8183', '0.1107', '0.0407', '0.0302'],
    },
    {
        id: 't4',
        title: 'Teacher · T=4',
        color: 'warm' as const,
        values: [0.397, 0.241, 0.188, 0.174],
        shown: ['0.3973', '0.2410', '0.1877', '0.1741'],
    },
]
const answers = ['7d', '3d', '30d', 'never']

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const colors = {
        neutral: c.textSecondary,
        cyan: getReadableToneColor('cyan', c),
        warm: getReadableToneColor('warm', c),
    }
    const panelX = [12, 233, 454]
    const panelWidth = 206
    const plotInset = 15
    const plotWidth = panelWidth - plotInset * 2
    const axisY = 199
    const rowY = [225, 291, 357, 423]
    const shapes = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...stages
            .map((stage, index) => {
                const x = panelX[index]
                const color = colors[stage.color]
                return [
                    SvgFrame({
                        c,
                        x,
                        y: 139,
                        width: panelWidth,
                        height: 352,
                        rx: 10,
                        fill: c.bgCard,
                        stroke: c.border,
                        strokeWidth: 1.2,
                    }),
                    VectorSegment({
                        x1: x + plotInset,
                        y1: axisY,
                        x2: x + plotInset + plotWidth,
                        y2: axisY,
                        color: c.borderLight,
                        strokeWidth: 2,
                        showStartDot: false,
                        showEndDot: false,
                    }),
                    ...[0, 0.5, 1].map((value) =>
                        VectorSegment({
                            x1: x + plotInset + plotWidth * value,
                            y1: axisY - 7,
                            x2: x + plotInset + plotWidth * value,
                            y2: axisY + 7,
                            color: c.textMuted,
                            strokeWidth: 1.5,
                            showStartDot: false,
                            showEndDot: false,
                        }),
                    ),
                    ...stage.values
                        .map((value, row) => {
                            const y = rowY[row] + 37
                            return [
                                VectorSegment({
                                    x1: x + plotInset,
                                    y1: y,
                                    x2: x + plotInset + plotWidth,
                                    y2: y,
                                    color: c.borderSubtle,
                                    strokeWidth: 4,
                                    showStartDot: false,
                                    showEndDot: false,
                                }),
                                VectorSegment({
                                    x1: x + plotInset,
                                    y1: y,
                                    x2: x + plotInset + plotWidth * value,
                                    y2: y,
                                    color,
                                    strokeWidth: 7,
                                    showStartDot: false,
                                    showEndDot: true,
                                    dotRadius: 5.5,
                                }),
                            ]
                        })
                        .flat(),
                ]
            })
            .flat(),
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
                "Softening reveals the teacher's ranking",
                18,
                12,
                636,
                36,
                29,
                c.textPrimary,
                800,
            ),
            label(
                c,
                'Constructed four-answer example · logits [4.0, 2.0, 1.0, 0.7]',
                18,
                53,
                636,
                28,
                22,
                c.textSecondary,
                600,
            ),
            label(
                c,
                'logits ÷ T  →  softmax  →  probabilities (4 d.p.)',
                18,
                87,
                636,
                28,
                24,
                c.textPrimary,
                700,
                'center',
            ),
            ...stages.flatMap((stage, index) => {
                const x = panelX[index]
                const color = colors[stage.color]
                return [
                    label(
                        c,
                        stage.title,
                        x + 6,
                        145,
                        panelWidth - 12,
                        27,
                        24,
                        color,
                        800,
                        'center',
                    ),
                    label(c, '0', x + 8, 174, 34, 21, 24, c.textMuted, 600, 'center', true),
                    label(c, '0.5', x + 82, 174, 42, 21, 24, c.textMuted, 600, 'center', true),
                    label(c, '1.0', x + 161, 174, 36, 21, 24, c.textMuted, 600, 'center', true),
                    ...answers.flatMap((answer, row) => [
                        label(c, answer, x + 14, rowY[row], 72, 27, 24, c.textPrimary, 700),
                        label(
                            c,
                            stage.shown[row],
                            x + 87,
                            rowY[row],
                            103,
                            27,
                            24,
                            color,
                            750,
                            'right',
                            true,
                        ),
                    ]),
                ]
            }),
            label(
                c,
                'Top gap (7d − 3d): 1.000  →  ≈0.708  →  ≈0.156',
                18,
                504,
                636,
                30,
                24,
                c.textPrimary,
                750,
                'center',
            ),
            label(
                c,
                'T²=16 is approximate high-temperature compensation.',
                18,
                541,
                636,
                28,
                22,
                c.textSecondary,
                600,
                'center',
            ),
        ],
    })
}

export default create('dark')
