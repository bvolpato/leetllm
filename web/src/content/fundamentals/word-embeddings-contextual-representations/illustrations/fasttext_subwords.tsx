import {
    AxisPlot,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'FastText character trigrams and vector composition for play and unseen played. Both spellings share <pl, pla, and lay. Play also uses ay> and its whole-word row; unseen played sums the three shared stem vectors with aye, yed, and ed> so its direction aligns closely with play rather than orthogonal terms like river.'

export const width = 660
export const height = 560

const illustration = defineIllustration((c) =>
    Scene({
        c,
        background: 'transparent',
        padding: 16,
        gap: 14,
        contentWidth: 628,
        align: 'center',
        children: Column({
            gap: 14,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Character trigrams compose unseen spellings',
                    fontSize: 28,
                    fontWeight: 750,
                    align: 'center',
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'play (known word)',
                            titleFontSize: 23,
                            tone: 'blue',
                            width: 306,
                            padding: 12,
                            gap: 8,
                            align: 'center',
                            children: Column({
                                gap: 6,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'shared: <pl · pla · lay',
                                        fontSize: 22,
                                        color: getReadableToneColor('green', c),
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'unique: ay> + word row',
                                        fontSize: 21,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'played (unseen OOV)',
                            titleFontSize: 23,
                            tone: 'warm',
                            width: 306,
                            padding: 12,
                            gap: 8,
                            align: 'center',
                            children: Column({
                                gap: 6,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'shared: <pl · pla · lay',
                                        fontSize: 22,
                                        color: getReadableToneColor('green', c),
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'unique: aye · yed · ed>',
                                        fontSize: 21,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
                Row({
                    gap: 16,
                    align: 'center',
                    justify: 'center',
                    children: [
                        AxisPlot({
                            c,
                            width: 290,
                            height: 225,
                            padding: 18,
                            xMin: -0.05,
                            xMax: 1.15,
                            yMin: -0.05,
                            yMax: 1.1,
                            showAxes: true,
                            showGrid: true,
                            gridCount: 4,
                            vectors: [
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 0.72,
                                    y2: 0.14,
                                    tone: 'green',
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 0.96,
                                    y2: 0.22,
                                    tone: 'blue',
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 0.88,
                                    y2: 0.44,
                                    tone: 'warm',
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 0.08,
                                    y2: 0.92,
                                    tone: 'purple',
                                    strokeWidth: 4,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                            ],
                            points: [
                                { x: 0.72, y: 0.14, tone: 'green', r: 6 },
                                { x: 0.96, y: 0.22, tone: 'blue', r: 7 },
                                { x: 0.88, y: 0.44, tone: 'warm', r: 7 },
                                { x: 0.08, y: 0.92, tone: 'purple', r: 6 },
                            ],
                            ariaLabel:
                                'Vector alignment of play and unseen played from shared n-grams',
                        }),
                        Column({
                            gap: 10,
                            align: 'start',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Green: shared stem sum',
                                    fontSize: 21,
                                    color: getReadableToneColor('green', c),
                                    fontWeight: 700,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Blue: play (known)',
                                    fontSize: 21,
                                    color: getReadableToneColor('blue', c),
                                    fontWeight: 700,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Warm: played (composed)',
                                    fontSize: 21,
                                    color: getReadableToneColor('warm', c),
                                    fontWeight: 700,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Purple: river (unrelated)',
                                    fontSize: 21,
                                    color: getReadableToneColor('purple', c),
                                    fontWeight: 700,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
