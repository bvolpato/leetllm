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
export const height = 550
export const alt =
    'Token prefix matching between teacher demonstrations and student generations. Two reference teacher prefixes and three student rollouts share common initial tokens while branching at later positions. Distinct token paths expand teacher evaluation coverage across four unique candidate prefixes.'

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

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const fixed = getReadableToneColor('cyan', c)
    const shared = getReadableToneColor('green', c)
    const newScore = getReadableToneColor('warm', c)
    const fixedX = [230, 365]
    const studentX = [230, 365, 500]
    const chipWidth = 128
    const chipHeight = 54
    const fixedY = 160
    const studentY = 250
    const uniqueY = 425
    const uniqueX = [26, 184, 342, 500]
    const uniqueLabels = ['…7', '…7 days', '…30', '…30 days']
    const uniqueColors = [shared, fixed, newScore, newScore]
    const frame = (x: number, y: number, stroke: string, fill = c.bgCard) =>
        SvgFrame({
            c,
            x,
            y,
            width: chipWidth,
            height: chipHeight,
            rx: 9,
            fill,
            stroke,
            strokeWidth: 1.6,
        })
    const shapes = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        frame(fixedX[0], fixedY, fixed),
        frame(fixedX[1], fixedY, fixed),
        frame(studentX[0], studentY, shared),
        frame(studentX[1], studentY, newScore, `${newScore}12`),
        frame(studentX[2], studentY, newScore, `${newScore}12`),
        VectorSegment({
            x1: fixedX[0] + chipWidth / 2,
            y1: fixedY + chipHeight,
            x2: studentX[0] + chipWidth / 2,
            y2: studentY,
            color: shared,
            strokeWidth: 2.4,
            showStartDot: false,
            showEndDot: false,
        }),
        ...uniqueX.map((x, index) =>
            SvgFrame({
                c,
                x,
                y: uniqueY,
                width: 145,
                height: 52,
                rx: 8,
                fill: `${uniqueColors[index]}12`,
                stroke: uniqueColors[index],
                strokeWidth: 1.4,
            }),
        ),
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
                'On-policy prefixes extend scoring coverage',
                18,
                11,
                636,
                35,
                29,
                c.textPrimary,
                800,
            ),
            label(
                c,
                'Prefix tree branching and union coverage analysis',
                18,
                48,
                636,
                25,
                22,
                c.textSecondary,
                600,
            ),
            label(
                c,
                'Prompt: How long is this disabled key restorable? Answer:',
                18,
                82,
                636,
                30,
                22,
                c.textPrimary,
                650,
            ),
            label(c, 'Fixed teacher · 2', 20, 173, 196, 27, 24, c.textPrimary, 700),
            label(c, 'Student set · 3', 20, 263, 196, 27, 24, c.textPrimary, 700),
            label(
                c,
                '…7',
                fixedX[0] + 4,
                fixedY + 13,
                chipWidth - 8,
                27,
                24,
                fixed,
                750,
                'center',
                true,
            ),
            label(
                c,
                '…7 days',
                fixedX[1] + 4,
                fixedY + 13,
                chipWidth - 8,
                27,
                24,
                fixed,
                750,
                'center',
                true,
            ),
            label(
                c,
                '…7',
                studentX[0] + 4,
                studentY + 13,
                chipWidth - 8,
                27,
                24,
                shared,
                750,
                'center',
                true,
            ),
            label(
                c,
                '…30',
                studentX[1] + 4,
                studentY + 13,
                chipWidth - 8,
                27,
                24,
                newScore,
                750,
                'center',
                true,
            ),
            label(
                c,
                '…30 days',
                studentX[2] + 4,
                studentY + 13,
                chipWidth - 8,
                27,
                24,
                newScore,
                750,
                'center',
                true,
            ),
            label(c, 'same', 298, 220, 62, 24, 22, shared, 700, 'center'),
            label(
                c,
                'Green = overlap · amber = two new teacher-score requests',
                18,
                319,
                636,
                26,
                22,
                c.textSecondary,
                600,
                'center',
            ),
            label(
                c,
                '2 fixed  +  2 new  =  4 unique',
                18,
                357,
                636,
                32,
                28,
                c.textPrimary,
                800,
                'center',
                true,
            ),
            label(
                c,
                'Union of distinct prefixes',
                18,
                393,
                636,
                26,
                22,
                c.textSecondary,
                650,
                'center',
            ),
            ...uniqueLabels.flatMap((text, index) => [
                label(
                    c,
                    text,
                    uniqueX[index] + 4,
                    uniqueY + 12,
                    137,
                    27,
                    24,
                    uniqueColors[index],
                    700,
                    'center',
                    true,
                ),
            ]),
            label(
                c,
                'The suffixes above follow the shared prompt exactly.',
                18,
                491,
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
