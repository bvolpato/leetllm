import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 590
export const alt =
    'Four authored probes are grouped by their root seed. Seed-a produces p1 direct and p2 roleplay, both in train. Seed-b produces p3 encoding and p4 translation, both in test. Keeping descendants together blocks this lineage from crossing the split; separate seeds can still share templates.'

type Colors = ReturnType<typeof getThemeColors>
type ProbeTone = 'blue' | 'cyan' | 'purple' | 'green'

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

function probeText(
    c: Colors,
    x: number,
    y: number,
    caseId: string,
    family: string,
    tone: ProbeTone,
) {
    const color = getReadableToneColor(tone, c)
    return [
        text(c, caseId, x + 8, y + 8, 136, 30, 27, color, 800, 'center'),
        text(c, family, x + 4, y + 42, 144, 30, 27, c.textPrimary, 700, 'center'),
    ]
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const train = getReadableToneColor('blue', c)
    const test = getReadableToneColor('purple', c)
    const probes = [
        { x: 38, y: 346, caseId: 'p1', family: 'direct', tone: 'blue' as const },
        { x: 204, y: 346, caseId: 'p2', family: 'roleplay', tone: 'cyan' as const },
        { x: 406, y: 346, caseId: 'p3', family: 'encoding', tone: 'purple' as const },
        { x: 572, y: 346, caseId: 'p4', family: 'translation', tone: 'green' as const },
    ]
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
            x: 22,
            y: 118,
            width: 348,
            height: 394,
            rx: 16,
            fill: getToneFill('blue', c),
            stroke: train,
            strokeWidth: 2.2,
        }),
        SvgFrame({
            c,
            x: 390,
            y: 118,
            width: 348,
            height: 394,
            rx: 16,
            fill: getToneFill('purple', c),
            stroke: test,
            strokeWidth: 2.2,
        }),
        SvgFrame({
            c,
            x: 94,
            y: 194,
            width: 204,
            height: 58,
            rx: 29,
            fill: c.bgCard,
            stroke: train,
            strokeWidth: 2.2,
        }),
        SvgFrame({
            c,
            x: 462,
            y: 194,
            width: 204,
            height: 58,
            rx: 29,
            fill: c.bgCard,
            stroke: test,
            strokeWidth: 2.2,
        }),
        ...probes.map((item) =>
            SvgFrame({
                c,
                x: item.x,
                y: item.y,
                width: 152,
                height: 82,
                rx: 12,
                fill: getToneFill(item.tone, c),
                stroke: getReadableToneColor(item.tone, c),
                strokeWidth: 2.2,
            }),
        ),
        VectorArrow({
            x1: 196,
            y1: 254,
            x2: 114,
            y2: 338,
            color: train,
            strokeWidth: 3.5,
            arrowSize: 8,
        }),
        VectorArrow({
            x1: 196,
            y1: 254,
            x2: 280,
            y2: 338,
            color: train,
            strokeWidth: 3.5,
            arrowSize: 8,
        }),
        VectorArrow({
            x1: 564,
            y1: 254,
            x2: 482,
            y2: 338,
            color: test,
            strokeWidth: 3.5,
            arrowSize: 8,
        }),
        VectorArrow({
            x1: 564,
            y1: 254,
            x2: 648,
            y2: 338,
            color: test,
            strokeWidth: 3.5,
            arrowSize: 8,
        }),
    )
    return Board({
        background: 'transparent',
        c,
        width,
        height,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: geometry }),
            text(c, 'Keep each seed lineage in one split', 28, 20, 704, 42, 34, c.textPrimary, 800),
            text(
                c,
                'Four authored probes · grouped by their root prompt',
                28,
                66,
                704,
                34,
                25,
                c.textSecondary,
                550,
            ),
            text(c, 'TRAIN', 42, 130, 308, 34, 29, train, 800, 'center'),
            text(c, 'TEST', 410, 130, 308, 34, 29, test, 800, 'center'),
            text(c, 'seed-a', 104, 207, 184, 34, 28, c.textPrimary, 800, 'center'),
            text(c, 'seed-b', 472, 207, 184, 34, 28, c.textPrimary, 800, 'center'),
            ...probes.flatMap((item) =>
                probeText(c, item.x, item.y, item.caseId, item.family, item.tone),
            ),
            text(
                c,
                'p1, p2 stay with seed-a.',
                30,
                458,
                332,
                30,
                25,
                c.textSecondary,
                600,
                'center',
            ),
            text(
                c,
                'p3, p4 stay with seed-b.',
                398,
                458,
                332,
                30,
                25,
                c.textSecondary,
                600,
                'center',
            ),
            text(
                c,
                'Check shared templates across seeds separately.',
                28,
                530,
                704,
                32,
                25,
                c.textPrimary,
                600,
            ),
        ],
    })
}

export default create('dark')
