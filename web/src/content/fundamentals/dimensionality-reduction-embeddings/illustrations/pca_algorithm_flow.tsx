import { AxisPlot, Column, Row, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Three centered rows lie on the 45-degree direction e1 = [1, 1]/√2 in an equal-scale coordinate plot. The orthogonal direction e2 has zero variance. Projection maps the rows to −√2, 0, and √2 on one number line.'
export const width = 640
export const height = 760

const projected = Math.SQRT2

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({
        c,
        title: 'PCA turns repeated coordinates into one measured direction',
        subtitle:
            'Center at [2, 2] · the diagonal carries all variation · the perpendicular coordinate stays zero',
        padding: 12,
        gap: 8,
        contentWidth: 616,
        align: 'center',
        children: Column({
            gap: 6,
            align: 'center',
            children: [
                TextLabel({ c, text: '1 · Three centered rows', fontSize: 23, align: 'center' }),
                TextLabel({
                    c,
                    text: '(−1, −1)     (0, 0)     (1, 1)',
                    fontSize: 21,
                    align: 'center',
                    math: true,
                }),
                AxisPlot({
                    c,
                    width: 420,
                    height: 330,
                    padding: 28,
                    xMin: -((1.1 * (420 - 56)) / (330 - 56)),
                    xMax: (1.1 * (420 - 56)) / (330 - 56),
                    yMin: -1.1,
                    yMax: 1.1,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: [
                        {
                            points: [
                                { x: -1, y: -1 },
                                { x: 1, y: 1 },
                            ],
                            tone: 'purple',
                            strokeWidth: 5,
                        },
                        {
                            points: [
                                { x: -1, y: 1 },
                                { x: 1, y: -1 },
                            ],
                            tone: 'neutral',
                            strokeWidth: 3,
                            dashed: true,
                            opacity: 0.7,
                        },
                    ],
                    vectors: [
                        {
                            x1: 0,
                            y1: 0,
                            x2: 0.82,
                            y2: 0.82,
                            tone: 'purple',
                            strokeWidth: 5,
                            arrow: true,
                            arrowSize: 8,
                        },
                    ],
                    points: [-1, 0, 1].map((value) => ({
                        x: value,
                        y: value,
                        tone: 'purple',
                        r: 12,
                        stroke: c.bgCard,
                        strokeWidth: 3,
                    })),
                }),
                TextLabel({
                    c,
                    text: 'e₁ = [1, 1]/√2 carries the variation',
                    fontSize: 22,
                    align: 'center',
                    math: true,
                }),
                TextLabel({
                    c,
                    text: '2 · Project each row onto e₁',
                    fontSize: 25,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 600,
                    height: 100,
                    padding: 42,
                    xMin: -2,
                    xMax: 2,
                    yMin: -1,
                    yMax: 1,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: [
                        {
                            points: [
                                { x: -1.9, y: 0 },
                                { x: 1.9, y: 0 },
                            ],
                            tone: 'neutral',
                            strokeWidth: 3,
                        },
                    ],
                    points: [-projected, 0, projected].map((value, index) => ({
                        x: value,
                        y: 0,
                        tone: (['blue', 'purple', 'green'] as const)[index],
                        r: 11,
                        stroke: c.bgCard,
                        strokeWidth: 3,
                    })),
                }),
                Row({
                    gap: 0,
                    align: 'center',
                    children: [
                        Column({
                            gap: 2,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: '−√2',
                                    width: 200,
                                    fontSize: 23,
                                    align: 'center',
                                    math: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 'row 1',
                                    width: 200,
                                    fontSize: 19,
                                    align: 'center',
                                }),
                            ],
                        }),
                        Column({
                            gap: 2,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: '0',
                                    width: 200,
                                    fontSize: 23,
                                    align: 'center',
                                    math: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 'row 2',
                                    width: 200,
                                    fontSize: 19,
                                    align: 'center',
                                }),
                            ],
                        }),
                        Column({
                            gap: 2,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: '√2',
                                    width: 200,
                                    fontSize: 23,
                                    align: 'center',
                                    math: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 'row 3',
                                    width: 200,
                                    fontSize: 19,
                                    align: 'center',
                                }),
                            ],
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'The perpendicular coordinate e₂ has zero variance.',
                    fontSize: 20,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
