import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const preset = 'default'
export const width = 672
export const height = 832
export const alt =
    'Two size-6 windows overlap by two words: the first ends after “15,” and the next reuses “within 15” before completing “minutes with deploy ID.” A search hit on the first window carries the condition and number but not the complete deadline or ID. A heading-aware section keeps the rule and page=7 locator together.'

const boardWidth = 640
const boardHeight = 800
const labelScale = width / boardWidth

function label(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 23,
    color = c.textPrimary,
    weight = 600,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
    lines: 1 | 2 = 1,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * labelScale * (lines === 1 ? 1.3 : 2.5),
        children: TextLabel({
            c,
            text,
            width: w,
            fontSize: size * labelScale,
            color,
            fontWeight: weight,
            align,
            mono,
            math: false,
        }),
    })
}

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('critical', c)
    const gray = c.textMuted

    const geometry = createElement(
        'svg',
        {
            width: boardWidth,
            height: boardHeight,
            viewBox: `0 0 ${boardWidth} ${boardHeight}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        createElement('rect', {
            key: 'source',
            x: 14,
            y: 94,
            width: 612,
            height: 140,
            rx: 18,
            fill: c.bgSubtle,
            stroke: cyan,
            strokeWidth: 2,
        }),
        createElement('rect', {
            key: 'first-window',
            x: 14,
            y: 254,
            width: 612,
            height: 242,
            rx: 18,
            fill: `${red}0c`,
            stroke: red,
            strokeWidth: 2,
        }),
        createElement('rect', {
            key: 'selected-span',
            x: 26,
            y: 318,
            width: 570,
            height: 78,
            rx: 12,
            fill: `${blue}16`,
            stroke: blue,
            strokeWidth: 2,
        }),
        createElement('rect', {
            key: 'next-span',
            x: 26,
            y: 402,
            width: 570,
            height: 46,
            rx: 10,
            fill: `${warm}12`,
            stroke: warm,
            strokeWidth: 2,
            strokeDasharray: '8 6',
        }),
        createElement('line', {
            key: 'split-cut',
            x1: 81,
            x2: 81,
            y1: 189,
            y2: 218,
            stroke: red,
            strokeWidth: 5,
            strokeLinecap: 'round',
        }),
        createElement('line', {
            key: 'split-crossbar',
            x1: 72,
            x2: 90,
            y1: 196,
            y2: 210,
            stroke: red,
            strokeWidth: 3,
            strokeLinecap: 'round',
        }),
        VectorArrow({
            x1: 320,
            y1: 237,
            x2: 320,
            y2: 250,
            color: gray,
            strokeWidth: 3,
            arrowSize: 7,
        }),
        createElement('rect', {
            key: 'section',
            x: 14,
            y: 528,
            width: 612,
            height: 238,
            rx: 18,
            fill: `${green}0c`,
            stroke: green,
            strokeWidth: 2,
        }),
        createElement('rect', {
            key: 'complete-rule',
            x: 26,
            y: 592,
            width: 570,
            height: 100,
            rx: 12,
            fill: `${green}16`,
            stroke: green,
            strokeWidth: 2,
        }),
        VectorArrow({
            x1: 320,
            y1: 498,
            x2: 320,
            y2: 520,
            color: green,
            strokeWidth: 3,
            arrowSize: 7,
        }),
    )

    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardWidth,
        children: Board({
            c,
            width: boardWidth,
            height: boardHeight,
            background: 'transparent',
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width: boardWidth,
                    height: boardHeight,
                    children: geometry,
                }),
                label(
                    c,
                    28,
                    102,
                    568,
                    'SOURCE · INCIDENT-RUNBOOK-V3.PDF',
                    23,
                    cyan,
                    750,
                    'left',
                    true,
                ),
                label(
                    c,
                    28,
                    155,
                    584,
                    'Rollback failure: page on-call within',
                    23,
                    c.textPrimary,
                    650,
                ),
                label(c, 28, 184, 42, '15', 24, warm, 800, 'left', true),
                label(c, 102, 184, 340, 'minutes with deploy ID.', 23, c.textPrimary, 650),
                label(c, 494, 202, 110, 'page=7', 23, cyan, 700, 'right', true),
                label(c, 28, 263, 450, 'SIZE 6 · OVERLAP 2', 23, red, 800, 'left', true),
                label(c, 470, 263, 136, 'page=7', 23, cyan, 750, 'right', true),
                label(
                    c,
                    42,
                    326,
                    535,
                    'Rollback failure: page on-call within',
                    23,
                    c.textPrimary,
                    650,
                ),
                label(c, 42, 359, 60, '15', 24, warm, 800, 'left', true),
                label(c, 37, 407, 130, 'NEXT 6', 23, warm, 800, 'left', true),
                label(
                    c,
                    184,
                    407,
                    406,
                    'within 15 minutes with deploy ID.',
                    23,
                    c.textSecondary,
                    650,
                ),
                label(
                    c,
                    30,
                    455,
                    576,
                    'First hit: condition + 15 · unit and ID missing',
                    23,
                    red,
                    700,
                ),
                label(c, 28, 537, 194, 'SECTION-AWARE', 23, green, 800, 'left', true),
                label(c, 228, 537, 230, 'Rollback failure', 23, green, 700),
                label(c, 494, 537, 110, 'page=7', 23, cyan, 750, 'right', true),
                label(c, 42, 602, 540, 'Page on-call within 15 minutes', 24, c.textPrimary, 700),
                label(c, 42, 637, 540, 'with deploy ID.', 24, c.textPrimary, 700),
                label(
                    c,
                    42,
                    697,
                    540,
                    'condition + deadline + ID stay in one chunk',
                    23,
                    green,
                    700,
                ),
                label(
                    c,
                    42,
                    728,
                    540,
                    'Rule text and page locator stay together.',
                    23,
                    c.textSecondary,
                    550,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
