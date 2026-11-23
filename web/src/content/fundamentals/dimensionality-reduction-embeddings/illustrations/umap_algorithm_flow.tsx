import {
    AxisPlot,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'UMAP combines directed memberships A-to-B 0.80 and B-to-A 0.60 into one fuzzy-union edge of 0.92. A second plot shows the theoretical q-dependent terms: strong-edge attraction falls as map similarity q rises, while weak-edge repulsion increases. Negative sampling changes the effective repulsion weighting during optimization.'
export const width = 640
export const height = 790

const qValues = Array.from({ length: 25 }, (_, index) => 0.05 + (index * 0.9) / 24)
const strongLoss = qValues.map((q) => -0.92 * Math.log(q))
const weakLoss = qValues.map((q) => -0.92 * Math.log(1 - q))

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    return Scene({
        c,
        title: 'UMAP turns neighbor weights into a map objective',
        subtitle:
            'Directed strengths form fuzzy edges · strong edges attract · missing edges repel',
        padding: 14,
        gap: 10,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 7,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: '1 · One neighbor, two directed memberships',
                    fontSize: 23,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 600,
                    height: 170,
                    padding: 28,
                    xMin: 0,
                    xMax: 1,
                    yMin: 0,
                    yMax: 1,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: [
                        {
                            points: [
                                { x: 0.18, y: 0.5 },
                                { x: 0.24, y: 0.74 },
                                { x: 0.76, y: 0.74 },
                                { x: 0.82, y: 0.5 },
                            ],
                            tone: 'purple',
                            strokeWidth: 3,
                            opacity: 0.75,
                        },
                        {
                            points: [
                                { x: 0.82, y: 0.5 },
                                { x: 0.76, y: 0.26 },
                                { x: 0.24, y: 0.26 },
                                { x: 0.18, y: 0.5 },
                            ],
                            tone: 'cyan',
                            strokeWidth: 3,
                            opacity: 0.75,
                        },
                    ],
                    vectors: [
                        {
                            x1: 0.27,
                            y1: 0.74,
                            x2: 0.73,
                            y2: 0.74,
                            tone: 'purple',
                            strokeWidth: 4,
                            arrow: true,
                            arrowSize: 8,
                        },
                        {
                            x1: 0.73,
                            y1: 0.26,
                            x2: 0.27,
                            y2: 0.26,
                            tone: 'cyan',
                            strokeWidth: 4,
                            arrow: true,
                            arrowSize: 8,
                        },
                    ],
                    points: [
                        {
                            x: 0.18,
                            y: 0.5,
                            tone: 'purple',
                            r: 11,
                            stroke: c.bgCard,
                            strokeWidth: 3,
                        },
                        { x: 0.82, y: 0.5, tone: 'cyan', r: 11, stroke: c.bgCard, strokeWidth: 3 },
                    ],
                }),
                Row({
                    gap: 12,
                    align: 'center',
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'A → B: 0.80',
                            fontSize: 21,
                            color: purple,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: 'B → A: 0.60',
                            fontSize: 21,
                            color: getReadableToneColor('cyan', c),
                            align: 'center',
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Fuzzy union creates one undirected edge',
                    fontSize: 21,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: '0.80 + 0.60 − (0.80 × 0.60) = 0.92',
                    fontSize: 23,
                    align: 'center',
                    math: true,
                }),
                TextLabel({
                    c,
                    text: '2 · Low-dimensional map objective',
                    fontSize: 23,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Theoretical q-dependent loss terms · lower is preferred',
                    fontSize: 20,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 600,
                    height: 245,
                    padding: 30,
                    xMin: 0.05,
                    xMax: 0.95,
                    yMin: 0,
                    yMax: 3,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: [
                        {
                            points: [
                                { x: 0.05, y: 0 },
                                { x: 0.95, y: 0 },
                            ],
                            tone: 'neutral',
                            strokeWidth: 2,
                        },
                        {
                            points: qValues.map((q, index) => ({ x: q, y: strongLoss[index] })),
                            color: purple,
                            strokeWidth: 4,
                        },
                        {
                            points: qValues.map((q, index) => ({ x: q, y: weakLoss[index] })),
                            color: green,
                            strokeWidth: 4,
                        },
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Map similarity q: low → high',
                    fontSize: 20,
                    align: 'center',
                }),
                Row({
                    gap: 10,
                    align: 'center',
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Strong: −0.92 log q',
                            fontSize: 20,
                            color: purple,
                            align: 'center',
                            math: true,
                        }),
                        TextLabel({
                            c,
                            text: 'Weak: −0.92 log(1−q)',
                            fontSize: 20,
                            color: green,
                            align: 'center',
                            math: true,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Negative sampling changes repulsion weight in training.',
                    fontSize: 20,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
