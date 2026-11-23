import {
    Arrow,
    Column,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'Side-by-side attention visibility comparison for bank near water. An encoder allows bidirectional flow so row bank [1, 1, 1] reads both near and water. A causal decoder restricts flow to the left so row bank [1, 0, 0] sees only itself while row water [1, 1, 1] sees the entire prefix.'

export const width = 684
export const height = 560

const illustration = defineIllustration((c) => {
    const allowed = (label: string, tone: 'green' | 'purple' | 'cyan') => ({
        label,
        tone,
        color: c.textPrimary,
    })
    const tok = (t: string, tone: 'green' | 'cyan') =>
        TextLabel({
            c,
            text: t,
            fontSize: 22,
            fontWeight: 700,
            color: getReadableToneColor(tone, c),
            width: 70,
            align: 'center',
        })

    return Scene({
        c,
        background: 'transparent',
        padding: 14,
        gap: 14,
        contentWidth: 656,
        align: 'center',
        children: Column({
            gap: 14,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Training objective determines context visibility',
                    fontSize: 27,
                    fontWeight: 750,
                    align: 'center',
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'Encoder · bidirectional',
                            titleFontSize: 23,
                            tone: 'purple',
                            width: 318,
                            padding: 10,
                            gap: 10,
                            align: 'center',
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    Row({
                                        gap: 4,
                                        align: 'center',
                                        justify: 'center',
                                        children: [
                                            tok('bank', 'green'),
                                            Arrow({
                                                c,
                                                direction: 'right',
                                                length: 18,
                                                color: c.primary,
                                            }),
                                            tok('near', 'cyan'),
                                            Arrow({
                                                c,
                                                direction: 'left',
                                                length: 18,
                                                color: c.primary,
                                            }),
                                            tok('water', 'cyan'),
                                        ],
                                    }),
                                    Grid({
                                        c,
                                        headerRows: 1,
                                        cellWidth: 70,
                                        cellHeight: 40,
                                        gap: 4,
                                        fontSize: 21,
                                        rows: [
                                            ['', 'bank', 'near', 'water'],
                                            [
                                                allowed('bank', 'green'),
                                                allowed('1', 'purple'),
                                                allowed('1', 'purple'),
                                                allowed('1', 'purple'),
                                            ],
                                            ['near', '1', '1', '1'],
                                            ['water', '1', '1', '1'],
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'bank sees right clue "water"',
                                        fontSize: 21,
                                        color: c.textSecondary,
                                        align: 'center',
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Decoder · causal mask',
                            titleFontSize: 23,
                            tone: 'cyan',
                            width: 318,
                            padding: 10,
                            gap: 10,
                            align: 'center',
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    Row({
                                        gap: 4,
                                        align: 'center',
                                        justify: 'center',
                                        children: [
                                            tok('bank', 'green'),
                                            Arrow({
                                                c,
                                                direction: 'right',
                                                length: 18,
                                                color: c.secondary,
                                            }),
                                            tok('near', 'cyan'),
                                            Arrow({
                                                c,
                                                direction: 'right',
                                                length: 18,
                                                color: c.secondary,
                                            }),
                                            tok('water', 'cyan'),
                                        ],
                                    }),
                                    Grid({
                                        c,
                                        headerRows: 1,
                                        cellWidth: 70,
                                        cellHeight: 40,
                                        gap: 4,
                                        fontSize: 21,
                                        rows: [
                                            ['', 'bank', 'near', 'water'],
                                            [
                                                allowed('bank', 'green'),
                                                allowed('1', 'cyan'),
                                                '0',
                                                '0',
                                            ],
                                            ['near', '1', '1', '0'],
                                            ['water', '1', '1', '1'],
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'bank isolated; water sees all',
                                        fontSize: 21,
                                        color: c.textSecondary,
                                        align: 'center',
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Visibility masks enforce left-to-right causality before learned attention weights run.',
                    fontSize: 21,
                    color: c.textSecondary,
                    align: 'center',
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
