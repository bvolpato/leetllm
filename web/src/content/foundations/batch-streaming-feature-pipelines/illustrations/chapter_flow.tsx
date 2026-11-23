import {
    AxisPlot,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'Dual-clock timeline plotting event time (top lane) and broker arrival time (bottom lane) against decision cutoffs at 09:00, 12:00, and 16:00 UTC. Event E1 (01:00 to 01:02) satisfies both clocks by 09:00 (age 8.0h); E2 (08:30 to 11:00) crosses the 09:00 cutoff and appears at 12:00 (age 3.5h); E3 (12:00 to 12:01) appears at 16:00 (age 4.0h).'

export const width = 660
export const height = 610
export const preset = 'engineering'

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)

    const plot = AxisPlot({
        c,
        width: 604,
        height: 190,
        xMin: 0,
        xMax: 17,
        yMin: 0,
        yMax: 3,
        padding: 12,
        showFrame: true,
        showAxes: false,
        showGrid: true,
        gridCount: 4,
        vectors: [
            {
                x1: 0,
                y1: 2.15,
                x2: 17,
                y2: 2.15,
                color: c.borderLight,
                strokeWidth: 2,
                showStartDot: false,
                showEndDot: false,
            },
            {
                x1: 0,
                y1: 0.85,
                x2: 17,
                y2: 0.85,
                color: c.borderLight,
                strokeWidth: 2,
                showStartDot: false,
                showEndDot: false,
            },
            {
                x1: 9.0,
                y1: 0.15,
                x2: 9.0,
                y2: 2.85,
                color: warm,
                strokeWidth: 3,
                showStartDot: false,
                showEndDot: false,
            },
            {
                x1: 12.0,
                y1: 0.15,
                x2: 12.0,
                y2: 2.85,
                color: blue,
                strokeWidth: 2.5,
                showStartDot: false,
                showEndDot: false,
            },
            {
                x1: 16.0,
                y1: 0.15,
                x2: 16.0,
                y2: 2.85,
                color: purple,
                strokeWidth: 2.5,
                showStartDot: false,
                showEndDot: false,
            },
            {
                x1: 1.0,
                y1: 2.15,
                x2: 1.04,
                y2: 0.85,
                color: green,
                strokeWidth: 3.5,
                arrow: true,
                arrowSize: 6,
                dotRadius: 5,
            },
            {
                x1: 8.5,
                y1: 2.15,
                x2: 11.0,
                y2: 0.85,
                color: warm,
                strokeWidth: 3.5,
                arrow: true,
                arrowSize: 6,
                dotRadius: 5,
            },
            {
                x1: 12.0,
                y1: 2.15,
                x2: 12.03,
                y2: 0.85,
                color: blue,
                strokeWidth: 3.5,
                arrow: true,
                arrowSize: 6,
                dotRadius: 5,
            },
        ],
        points: [
            { x: 1.0, y: 2.15, fill: green, r: 5 },
            { x: 8.5, y: 2.15, fill: warm, r: 5 },
            { x: 12.0, y: 2.15, fill: blue, r: 5 },
        ],
    })

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: width - 32,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Dual-Clock Visibility Across Decision Cutoffs',
                    fontSize: 25,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Top lane: event_time   |   Bottom lane: ingested_at   |   Vertical bars: cutoffs',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                Panel({
                    c,
                    title: 'Account A-409 Timeline (00:00 to 17:00 UTC)',
                    titleFontSize: 20,
                    tone: 'neutral',
                    width: 628,
                    padding: '10px 10px',
                    gap: 6,
                    children: Column({
                        gap: 6,
                        align: 'center',
                        children: [
                            plot,
                            Row({
                                width: 604,
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: '00:00',
                                        fontSize: 20,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '09:00 cutoff',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: warm,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '12:00 cutoff',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: blue,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '16:00',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: purple,
                                    }),
                                ],
                            }),
                            Row({
                                width: 604,
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'E1: 01:00 -> 01:02',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: green,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'E2: 08:30 -> 11:00',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: warm,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'E3: 12:00 -> 12:01',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: blue,
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
                Row({
                    gap: 208,
                    justify: 'center',
                    children: [
                        FlowArrow({ c, direction: 'down', length: 20, tone: 'green' }),
                        FlowArrow({ c, direction: 'down', length: 20, tone: 'warm' }),
                        FlowArrow({ c, direction: 'down', length: 20, tone: 'purple' }),
                    ],
                }),
                Row({
                    gap: 10,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'Score at 09:00',
                            titleFontSize: 20,
                            tone: 'green',
                            width: 202,
                            padding: '10px 12px',
                            gap: 4,
                            children: Column({
                                gap: 4,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Eligible: E1 only',
                                        fontSize: 20,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Age = 8.0h',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: green,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Score at 12:00',
                            titleFontSize: 20,
                            tone: 'warm',
                            width: 202,
                            padding: '10px 12px',
                            gap: 4,
                            children: Column({
                                gap: 4,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Eligible: E1, E2',
                                        fontSize: 20,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Age = 3.5h',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: warm,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Score at 16:00',
                            titleFontSize: 20,
                            tone: 'purple',
                            width: 202,
                            padding: '10px 12px',
                            gap: 4,
                            children: Column({
                                gap: 4,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Eligible: E1..E3',
                                        fontSize: 20,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Age = 4.0h',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: purple,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
