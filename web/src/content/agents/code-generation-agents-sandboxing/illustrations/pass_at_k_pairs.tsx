import { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'
export const width = 560
export const height = 734
export const alt =
    'Ten unordered index pairs are arranged in an upper-triangular grid for five fixed candidates. Candidates 1 and 2 pass; candidates 3, 4 and 5 fail. Each pair contains two colored candidate dots. Seven green-outlined pairs contain at least one pass, and three red-outlined pairs contain only failures. Counting the ten equally likely pairs gives pass@2 = 7/10 = 70% for selection without replacement. This is finite-pool arithmetic, with no agent benchmark execution.'
export const numericFixture = {
    n: 5,
    c: 2,
    k: 2,
    passingIndices: [1, 2],
    pairs: [
        {
            i: 1,
            j: 2,
            containsPass: true,
        },
        {
            i: 1,
            j: 3,
            containsPass: true,
        },
        {
            i: 1,
            j: 4,
            containsPass: true,
        },
        {
            i: 1,
            j: 5,
            containsPass: true,
        },
        {
            i: 2,
            j: 3,
            containsPass: true,
        },
        {
            i: 2,
            j: 4,
            containsPass: true,
        },
        {
            i: 2,
            j: 5,
            containsPass: true,
        },
        {
            i: 3,
            j: 4,
            containsPass: false,
        },
        {
            i: 3,
            j: 5,
            containsPass: false,
        },
        {
            i: 4,
            j: 5,
            containsPass: false,
        },
    ],
    totalPairs: 10,
    successfulPairs: 7,
    value: 0.7,
    replacement: false,
    benchmark: false,
}
function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size = 22,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const pass = getReadableToneColor('green', c),
        deny = getReadableToneColor('critical', c)
    const edges: ReactNode[] = [],
        frames: ReactNode[] = [],
        labels: ReactNode[] = []
    const line = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color = c.textSecondary,
        strokeWidth = 1.8,
    ) =>
        edges.push(
            VectorSegment({
                x1,
                y1,
                x2,
                y2,
                color,
                strokeWidth,
                showStartDot: false,
                showEndDot: false,
            }),
        )
    const frame = (
        x: number,
        y: number,
        w: number,
        h: number,
        color = c.textSecondary,
        fill = 'transparent',
    ) =>
        frames.push(
            SvgFrame({
                c,
                x,
                y,
                width: w,
                height: h,
                rx: 8,
                fill,
                stroke: color,
                strokeWidth: 1.7,
            }),
        )
    const text = (
        s: string,
        x: number,
        y: number,
        w: number,
        h = 30,
        size = 22,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
    ) => labels.push(label(c, s, x, y, w, h, size, color, align))

    text('Count successful pairs without replacement', 16, 12, 528, 34, 24, c.textPrimary, 'center')
    text(
        'Five fixed candidates · passing indices 1 and 2',
        18,
        52,
        524,
        28,
        20,
        c.textSecondary,
        'center',
    )
    text('Second index', 128, 96, 392, 30, 22, c.textSecondary, 'center')
    text('First', 14, 144, 94, 30, 22, c.textSecondary, 'center')
    for (let j = 2; j <= 5; j++)
        text(String(j), 128 + (j - 2) * 98, 132, 86, 30, 24, j <= 2 ? pass : deny, 'center')
    for (let i = 1; i <= 4; i++)
        text(String(i), 14, 198 + (i - 1) * 98, 94, 30, 24, i <= 2 ? pass : deny, 'center')
    for (const pair of numericFixture.pairs) {
        const x = 128 + (pair.j - 2) * 98,
            y = 178 + (pair.i - 1) * 98,
            color = pair.containsPass ? pass : deny
        frame(x, y, 86, 86, color)
        text(pair.i + ',' + pair.j, x + 4, y + 8, 78, 28, 20, color, 'center')
        line(x + 22, y + 60, x + 64, y + 60, c.textSecondary, 2)
        frames.push(
            SvgPoint({
                cx: x + 22,
                cy: y + 60,
                r: 8,
                fill: pair.i <= 2 ? pass : deny,
            }),
            SvgPoint({
                cx: x + 64,
                cy: y + 60,
                r: 8,
                fill: pair.j <= 2 ? pass : deny,
            }),
        )
    }
    text('7 pairs contain a pass', 18, 600, 524, 32, 24, pass, 'center')
    text('3 pairs contain only failures', 18, 642, 524, 30, 22, deny, 'center')
    text('7 / 10 = 70%', 18, 688, 524, 34, 28, pass, 'center')

    const svg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: '0 0 ' + width + ' ' + height,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...edges,
        ...frames,
    )
    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [CanvasItem({ x: 0, y: 0, width, height, children: svg }), ...labels],
        }),
    })
}
export default create('dark')
