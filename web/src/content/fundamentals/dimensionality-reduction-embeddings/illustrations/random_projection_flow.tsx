import { AxisPlot, Column, Scene, TextLabel, getReadableToneColor, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Equal-scale axes compare Euclidean distances for document pairs before and after a seeded 48-to-16 Gaussian random projection. Dashed cone lines show a plus-or-minus 15 percent band around the diagonal. Pair 0-1 rises from 9.252 to 10.551 (+14.0%), pair 0-2 drops from 8.820 to 5.771 (-34.6%), and pair 1-2 drops from 10.222 to 7.846 (-23.2%), swapping the distance ranking between 0-1 and 1-2.'
export const width = 640
export const height = 760

const pairs = [
    { label: 'Doc 0–1', full: 9.252, projected: 10.551, change: '+14.0%', tone: 'purple' as const },
    { label: 'Doc 0–2', full: 8.82, projected: 5.771, change: '−34.6%', tone: 'cyan' as const },
    { label: 'Doc 1–2', full: 10.222, projected: 7.846, change: '−23.2%', tone: 'red' as const },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const axisMax = 13
    return Scene({
        c,
        title: 'A valid distance bound can still reorder close neighbors',
        subtitle: 'Seeded 48 → 16 Gaussian projection · equal scale on both axes',
        padding: 14,
        gap: 10,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: '48d → 16d projection · x = full L2, y = projected L2',
                    fontSize: 20,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 420,
                    height: 410,
                    padding: 36,
                    xMin: 0,
                    xMax: axisMax,
                    yMin: 0,
                    yMax: axisMax,
                    showFrame: false,
                    showGrid: true,
                    gridCount: 4,
                    paths: [
                        {
                            points: [
                                { x: 0, y: 0 },
                                { x: axisMax, y: axisMax },
                            ],
                            tone: 'neutral',
                            strokeWidth: 3,
                            dashed: true,
                            opacity: 0.85,
                        },
                        {
                            points: [
                                { x: 0, y: 0 },
                                { x: axisMax / 1.15, y: axisMax },
                            ],
                            tone: 'blue',
                            strokeWidth: 2,
                            dashed: true,
                            opacity: 0.45,
                        },
                        {
                            points: [
                                { x: 0, y: 0 },
                                { x: axisMax, y: 0.85 * axisMax },
                            ],
                            tone: 'blue',
                            strokeWidth: 2,
                            dashed: true,
                            opacity: 0.45,
                        },
                    ],
                    vectors: pairs.map((pair) => ({
                        x1: pair.full,
                        y1: pair.full,
                        x2: pair.full,
                        y2: pair.projected,
                        tone: pair.tone,
                        strokeWidth: 4,
                        showStartDot: true,
                        dotRadius: 6,
                    })),
                    points: pairs.map((pair) => ({
                        x: pair.full,
                        y: pair.projected,
                        tone: pair.tone,
                        r: 11,
                        stroke: c.bgCard,
                        strokeWidth: 3,
                    })),
                }),
                TextLabel({
                    c,
                    text: 'Dashed diagonal = zero distortion; blue cone = ±15% distance band',
                    fontSize: 19,
                    align: 'center',
                }),
                ...pairs.map((pair) =>
                    TextLabel({
                        c,
                        text: `${pair.label} · ${pair.full.toFixed(3)} → ${pair.projected.toFixed(3)} · ${pair.change}`,
                        color: getReadableToneColor(pair.tone, c),
                        fontSize: 21,
                        align: 'center',
                    }),
                ),
                TextLabel({
                    c,
                    text: 'Full order: (0–2 < 0–1 < 1–2) · Projected order: (0–2 < 1–2 < 0–1)',
                    fontSize: 19,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
