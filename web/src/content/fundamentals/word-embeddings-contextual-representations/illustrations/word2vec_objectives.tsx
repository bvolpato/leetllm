import {
    Arrow,
    BadgePill,
    Column,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const alt =
    'A radius-2 window around center token read in children read stories each night. Children, stories, and each sit inside the window while night is three steps away. CBOW combines the three neighbors to predict read; Skip-gram forms three training pairs starting at read.'

export const width = 680
export const height = 560

const illustration = defineIllustration((c) => {
    const cell = (label: string, tone: 'purple' | 'cyan' | 'warm') => ({
        label,
        tone,
        color: c.textPrimary,
    })

    return Scene({
        c,
        background: 'transparent',
        padding: 14,
        gap: 12,
        contentWidth: 652,
        align: 'center',
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Context window size 2 around "read"',
                    fontSize: 28,
                    fontWeight: 750,
                    align: 'center',
                }),
                Panel({
                    c,
                    title: 'Sliding window offsets',
                    titleFontSize: 22,
                    tone: 'blue',
                    width: 644,
                    padding: 10,
                    gap: 6,
                    align: 'center',
                    children: Grid({
                        c,
                        cellWidth: 118,
                        cellHeight: 42,
                        gap: 6,
                        fontSize: 21,
                        rows: [
                            [
                                cell('children', 'cyan'),
                                cell('read', 'purple'),
                                cell('stories', 'cyan'),
                                cell('each', 'cyan'),
                                cell('night', 'warm'),
                            ],
                            [
                                cell('-1 (in)', 'cyan'),
                                cell('0 (mid)', 'purple'),
                                cell('+1 (in)', 'cyan'),
                                cell('+2 (in)', 'cyan'),
                                cell('+3 (out)', 'warm'),
                            ],
                        ],
                    }),
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'CBOW',
                            titleFontSize: 24,
                            tone: 'purple',
                            width: 315,
                            padding: 12,
                            gap: 10,
                            align: 'center',
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'neighbors -> center',
                                        fontSize: 22,
                                        align: 'center',
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'children · stories · each',
                                        fontSize: 21,
                                        fontWeight: 700,
                                        align: 'center',
                                    }),
                                    Arrow({ c, direction: 'down', length: 30, color: c.primary }),
                                    BadgePill({
                                        c,
                                        text: 'predict read',
                                        tone: 'purple',
                                        width: 240,
                                        height: 42,
                                        fontSize: 22,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Skip-gram',
                            titleFontSize: 24,
                            tone: 'cyan',
                            width: 315,
                            padding: 12,
                            gap: 8,
                            align: 'center',
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'center -> neighbor pairs',
                                        fontSize: 22,
                                        align: 'center',
                                    }),
                                    Grid({
                                        c,
                                        headerRows: 1,
                                        cellWidth: 136,
                                        cellHeight: 38,
                                        gap: 4,
                                        fontSize: 21,
                                        rows: [
                                            ['center', 'neighbor'],
                                            [cell('read', 'purple'), cell('children', 'cyan')],
                                            [cell('read', 'purple'), cell('stories', 'cyan')],
                                            [cell('read', 'purple'), cell('each', 'cyan')],
                                        ],
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
