import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 600
export const height = 810
export const alt =
    'The LSH candidate curve uses the FineWeb 2024 configuration of 14 bands with 8 hash rows each. Under ideal independence, candidate probability is 1 − (1 − s⁸)¹⁴: 5.3% at Jaccard similarity 0.50, 56.5% at 0.70, 77.2% at 0.75, and 98.8% at 0.85. At 0.75, the remaining 22.8% are missed by candidate generation.'

export function create(theme: ThemeMode = 'dark') {
    const c = {
        ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        shadow: 'transparent',
    }
    const warmText = getReadableToneColor('warm', c)
    const plotWidth = 530
    const plotHeight = 330
    const plotX = 42
    const plotY = 62
    const padding = 42
    const innerWidth = plotWidth - padding * 2
    const innerHeight = plotHeight - padding * 2
    const xAt = (similarity: number) => plotX + padding + similarity * innerWidth
    const yAt = (probability: number) => plotY + padding + (1 - probability) * innerHeight
    const similarity = [0.5, 0.7, 0.75, 0.85]
    const points = similarity.map((s) => ({
        x: s,
        y: 1 - (1 - s ** 8) ** 14,
        tone: s === 0.75 ? ('warm' as const) : ('blue' as const),
        r: s === 0.75 ? 7 : 5,
    }))
    const curve = Array.from({ length: 101 }, (_, index) => {
        const s = index / 100
        return { x: s, y: 1 - (1 - s ** 8) ** 14 }
    })
    const yTicks = [0, 0.5, 1]
    const xTicks = [0, 0.5, 0.75, 1]
    const plot = AxisPlot({
        c,
        width: plotWidth,
        height: plotHeight,
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        padding,
        showFrame: false,
        showAxes: false,
        showGrid: true,
        gridCount: 4,
        paths: [
            {
                points: [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                ],
                color: c.borderLight,
                strokeWidth: 1.5,
            },
            {
                points: [
                    { x: 0, y: 0 },
                    { x: 0, y: 1 },
                ],
                color: c.borderLight,
                strokeWidth: 1.5,
            },
            { points: curve, tone: 'blue', strokeWidth: 5 },
            {
                points: [
                    { x: 0.75, y: 0 },
                    { x: 0.75, y: 1 },
                ],
                tone: 'warm',
                strokeWidth: 2,
                opacity: 0.7,
                dashed: true,
            },
        ],
        points,
    })

    return Scene({
        c,
        background: c.bg,
        padding: 10,
        gap: 8,
        contentWidth: 580,
        children: Column({
            gap: 8,
            align: 'stretch',
            children: [
                TextLabel({
                    c,
                    text: 'Similarity becomes candidate probability.',
                    fontSize: 27,
                    fontWeight: 760,
                }),
                TextLabel({
                    c,
                    text: 'P(candidate | s) = 1 − (1 − s⁸)¹⁴',
                    fontSize: 25,
                    fontWeight: 700,
                    align: 'center',
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: '112 hashes · 14 bands × 8 rows',
                    fontSize: 20,
                    align: 'center',
                    color: c.textSecondary,
                }),
                Board({
                    c,
                    width: 580,
                    height: 462,
                    background: 'transparent',
                    children: [
                        CanvasItem({
                            x: 0,
                            y: plotY - 30,
                            width: 260,
                            height: 28,
                            children: TextLabel({
                                c,
                                text: 'Candidate probability',
                                fontSize: 21,
                                color: c.textSecondary,
                            }),
                        }),
                        CanvasItem({
                            x: plotX,
                            y: plotY,
                            width: plotWidth,
                            height: plotHeight,
                            children: plot,
                        }),
                        ...yTicks.map((tick) =>
                            CanvasItem({
                                x: 0,
                                y: yAt(tick) - 14,
                                width: plotX - 7,
                                height: 28,
                                children: TextLabel({
                                    c,
                                    text: tick.toFixed(1),
                                    fontSize: 21,
                                    align: 'right',
                                    color: c.textMuted,
                                    mono: true,
                                }),
                            }),
                        ),
                        ...xTicks.map((tick) =>
                            CanvasItem({
                                x: xAt(tick) - 22,
                                y: plotY + plotHeight + 2,
                                width: 44,
                                height: 28,
                                children: TextLabel({
                                    c,
                                    text:
                                        tick === 0 || tick === 1
                                            ? String(tick)
                                            : `.${String(tick).split('.')[1]}`,
                                    fontSize: 21,
                                    align: 'center',
                                    color: c.textMuted,
                                    mono: true,
                                }),
                            }),
                        ),
                        CanvasItem({
                            x: plotX + 10,
                            y: plotY + 24,
                            width: 170,
                            height: 25,
                            children: TextLabel({
                                c,
                                text: 'J = .75 · 77.2%',
                                fontSize: 21,
                                fontWeight: 750,
                                color: warmText,
                            }),
                        }),
                        CanvasItem({
                            x: 90,
                            y: plotY + plotHeight + 32,
                            width: 430,
                            height: 28,
                            children: TextLabel({
                                c,
                                text: 'Jaccard similarity s',
                                fontSize: 21,
                                color: c.textSecondary,
                                align: 'center',
                            }),
                        }),
                    ],
                }),
                Column({
                    gap: 4,
                    align: 'stretch',
                    children: [
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'space-between',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'J=.50 → 5.3%',
                                    fontSize: 21,
                                    fontWeight: 650,
                                    color: c.textSecondary,
                                    align: 'center',
                                    width: 275,
                                }),
                                TextLabel({
                                    c,
                                    text: 'J=.70 → 56.5%',
                                    fontSize: 21,
                                    fontWeight: 650,
                                    color: c.textSecondary,
                                    align: 'center',
                                    width: 275,
                                }),
                            ],
                        }),
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'space-between',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'J=.75 → 77.2%',
                                    fontSize: 21,
                                    fontWeight: 750,
                                    color: warmText,
                                    align: 'center',
                                    width: 275,
                                }),
                                TextLabel({
                                    c,
                                    text: 'J=.85 → 98.8%',
                                    fontSize: 21,
                                    fontWeight: 650,
                                    color: c.textSecondary,
                                    align: 'center',
                                    width: 275,
                                }),
                            ],
                        }),
                    ],
                }),
                StackedBar({
                    c,
                    width: 560,
                    height: 48,
                    showLegend: false,
                    segments: [
                        { label: 'Candidate', value: 77.2, color: 'green', valueLabel: '' },
                        { label: 'Missed', value: 22.8, color: 'warning', valueLabel: '' },
                    ],
                }),
                Row({
                    gap: 12,
                    align: 'center',
                    justify: 'space-between',
                    children: [
                        TextLabel({
                            c,
                            text: '77.2% candidates',
                            fontSize: 21,
                            fontWeight: 750,
                            color: c.positive,
                        }),
                        TextLabel({
                            c,
                            text: '22.8% missed',
                            fontSize: 21,
                            fontWeight: 750,
                            color: warmText,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
