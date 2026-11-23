import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 740
export const alt =
    'Four policy states share one log-probability-ratio axis. The chosen response moves from 0 to 0.30, −0.15, and −0.60; the rejected response moves from 0 to −0.40, −1.20, and −2.10. Their pairwise margin grows from 0 to 0.70, 1.05, and 1.50 even as the chosen response falls below its reference likelihood.'

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 600,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: '100%', fontSize, color, align, fontWeight: weight }),
    })
}

const chosen = [0, 0.3, -0.15, -0.6]
const rejected = [0, -0.4, -1.2, -2.1]
const margins = chosen.map((value, index) => value - rejected[index])

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)
    const gray = c.textSecondary
    const plot = { x: 20, y: 100, width: 520, height: 358, padding: 50 }
    const innerWidth = plot.width - plot.padding * 2
    const innerHeight = plot.height - plot.padding * 2
    const xAt = (state: number) => plot.x + plot.padding + (state / 3) * innerWidth
    const yAt = (value: number) => plot.y + plot.padding + ((0.5 - value) / 2.8) * innerHeight
    const bars = { x: 55, y: 562, base: 672, width: 72, maxHeight: 70 }
    const geom = createElement(
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
            x: plot.x,
            y: plot.y,
            width: plot.width,
            height: plot.height,
            rx: 10,
            fill: c.bgSubtle,
            stroke: c.border,
            strokeWidth: 1.5,
        }),
        VectorSegment({
            x1: bars.x,
            y1: bars.base,
            x2: width - bars.x,
            y2: bars.base,
            color: c.borderLight,
            strokeWidth: 1.5,
            showStartDot: false,
            showEndDot: false,
        }),
        ...margins.map((margin, index) => {
            const x = bars.x + 20 + index * 128
            const h = (bars.maxHeight * margin) / 1.5
            return SvgFrame({
                c,
                x,
                y: bars.base - h,
                width: bars.width,
                height: Math.max(2, h),
                rx: 5,
                fill: getReadableToneColor('purple', c),
                stroke: getReadableToneColor('purple', c),
                strokeWidth: 1,
                opacity: 0.78,
            })
        }),
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
            children: [
                CanvasItem({ x: 0, y: 0, width, height, children: geom }),
                label(
                    c,
                    'Chosen likelihood falls as the pair margin grows',
                    10,
                    14,
                    540,
                    34,
                    22,
                    c.textPrimary,
                    'center',
                    800,
                ),
                label(
                    c,
                    'Four policy states · response log-ratio to reference',
                    20,
                    56,
                    520,
                    26,
                    18,
                    c.textSecondary,
                    'center',
                    600,
                ),
                CanvasItem({
                    x: plot.x,
                    y: plot.y,
                    width: plot.width,
                    height: plot.height,
                    children: AxisPlot({
                        c,
                        width: plot.width,
                        height: plot.height,
                        xMin: 0,
                        xMax: 3,
                        yMin: -2.3,
                        yMax: 0.5,
                        padding: plot.padding,
                        showFrame: false,
                        showAxes: false,
                        showGrid: true,
                        gridCount: 4,
                        paths: [
                            {
                                points: [
                                    { x: 0, y: 0 },
                                    { x: 3, y: 0 },
                                ],
                                color: gray,
                                strokeWidth: 1.5,
                                dashed: true,
                            },
                            {
                                points: chosen.map((value, x) => ({ x, y: value })),
                                color: green,
                                strokeWidth: 4,
                            },
                            {
                                points: rejected.map((value, x) => ({ x, y: value })),
                                color: red,
                                strokeWidth: 4,
                            },
                        ],
                        points: [
                            ...chosen.map((y, x) => ({
                                x,
                                y,
                                fill: green,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                                r: 7,
                            })),
                            ...rejected.slice(1).map((y, offset) => ({
                                x: offset + 1,
                                y,
                                fill: red,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                                r: 7,
                            })),
                        ],
                    }),
                }),
                ...chosen.map((value, index) =>
                    label(
                        c,
                        value > 0
                            ? `+${value.toFixed(2)}`
                            : value < 0
                              ? `−${Math.abs(value).toFixed(2)}`
                              : '0',
                        xAt(index) - 35,
                        value < 0 ? yAt(value) + 12 : yAt(value) - 31,
                        70,
                        24,
                        18,
                        green,
                        'center',
                        750,
                    ),
                ),
                ...rejected
                    .slice(1)
                    .map((value, offset) =>
                        label(
                            c,
                            `−${Math.abs(value).toFixed(2)}`,
                            xAt(offset + 1) - 38,
                            yAt(value) + 12,
                            76,
                            24,
                            18,
                            red,
                            'center',
                            750,
                        ),
                    ),
                ...[0, 1, 2, 3].map((index) =>
                    label(
                        c,
                        `state ${index}`,
                        xAt(index) - 46,
                        463,
                        92,
                        24,
                        19,
                        c.textSecondary,
                        'center',
                        600,
                    ),
                ),
                label(c, 'Chosen response', 34, 501, 180, 25, 18, green, 'left', 700),
                label(c, 'Rejected response', 226, 501, 190, 25, 18, red, 'left', 700),
                label(c, 'Reference = 0', 396, 501, 140, 25, 18, gray, 'right', 600),
                label(
                    c,
                    'Pair margin · chosen − rejected',
                    30,
                    538,
                    500,
                    26,
                    19,
                    c.textSecondary,
                    'center',
                    700,
                ),
                ...margins.map((margin, index) =>
                    label(
                        c,
                        margin.toFixed(2),
                        bars.x + 20 + index * 128 - 2,
                        bars.base - (bars.maxHeight * margin) / 1.5 - 29,
                        bars.width + 4,
                        24,
                        18,
                        getReadableToneColor('purple', c),
                        'center',
                        750,
                    ),
                ),
                ...[0, 1, 2, 3].map((index) =>
                    label(
                        c,
                        `state ${index}`,
                        bars.x + 20 + index * 128 - 13,
                        678,
                        bars.width + 26,
                        22,
                        19,
                        c.textSecondary,
                        'center',
                        600,
                    ),
                ),
                label(
                    c,
                    'Margin rises even while chosen drops below reference.',
                    18,
                    712,
                    524,
                    24,
                    19,
                    c.textSecondary,
                    'center',
                    600,
                ),
            ],
        }),
    })
}

export default create('dark')
