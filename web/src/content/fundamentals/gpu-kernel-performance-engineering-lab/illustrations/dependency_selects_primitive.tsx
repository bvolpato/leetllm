import {
    BadgePill,
    Column,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 920
export const height = 700
export const alt =
    'For mismatch flags [0, 1, 0, 1, 1, 0] at indices [0, 1, 2, 3, 4, 5], a reduction sums flags to scalar count 3. An exclusive scan computes prefix offsets [0, 0, 1, 1, 2, 3] and writes failing indices 1, 3, and 4 into compacted slots [1, 3, 4]. A transpose preserves all six values (a through f) while swapping a 2x3 layout to 3x2.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.75)

    const flagRow = [0, 1, 0, 1, 1, 0].map((v) => ({
        label: String(v),
        tone: (v === 1 ? 'warm' : 'neutral') as ToneName,
    }))
    const prefixRow = [0, 0, 1, 1, 2, 3].map((v, i) => ({
        label: String(v),
        tone: ([1, 3, 4].includes(i) ? 'purple' : 'blue') as ToneName,
    }))

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: 888,
        children: Column({
            gap: 12,
            children: [
                Panel({
                    c,
                    title: 'Input Flags and Indices Select the Parallel Primitive',
                    tone: 'blue',
                    width: 888,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 31,
                    children: Grid({
                        c,
                        headerCols: 1,
                        cellWidth: 96,
                        cellHeight: 40,
                        gap: 6,
                        fontSize: 28,
                        rows: [
                            ['Index', '0', '1', '2', '3', '4', '5'],
                            ['Flag', ...flagRow],
                        ],
                    }),
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: '1. Reduction',
                            subtitle: 'collapse to scalar',
                            tone: 'warm',
                            width: 288,
                            padding: 12,
                            gap: 10,
                            titleFontSize: 30,
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    BadgePill({
                                        c,
                                        text: 'sum(flags)',
                                        tone: 'neutral',
                                        fontSize: 28,
                                        height: 42,
                                        padding: '4px 14px',
                                        mono: true,
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 34, tone: 'warm' }),
                                    BadgePill({
                                        c,
                                        text: 'count = 3',
                                        tone: 'warm',
                                        fontSize: 29,
                                        height: 46,
                                        padding: '4px 16px',
                                        mono: true,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Single summary count',
                                        fontSize: 28,
                                        color: getReadableToneColor('warm', c),
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: '2. Prefix Scan',
                            subtitle: 'offsets per active slot',
                            tone: 'purple',
                            width: 288,
                            padding: 12,
                            gap: 10,
                            titleFontSize: 30,
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    Grid({
                                        c,
                                        rows: [prefixRow],
                                        cellWidth: 39,
                                        cellHeight: 38,
                                        gap: 4,
                                        fontSize: 28,
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 28, tone: 'purple' }),
                                    Grid({
                                        c,
                                        rows: [
                                            [
                                                { label: '1', tone: 'green' },
                                                { label: '3', tone: 'green' },
                                                { label: '4', tone: 'green' },
                                            ],
                                        ],
                                        cellWidth: 64,
                                        cellHeight: 40,
                                        gap: 6,
                                        fontSize: 28,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Compacted indices',
                                        fontSize: 28,
                                        color: getReadableToneColor('green', c),
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: '3. Transpose',
                            subtitle: 'swap 2D axes',
                            tone: 'cyan',
                            width: 288,
                            padding: 12,
                            gap: 10,
                            titleFontSize: 30,
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    Row({
                                        gap: 8,
                                        align: 'center',
                                        justify: 'center',
                                        children: [
                                            Grid({
                                                c,
                                                rows: [
                                                    ['a', 'b', 'c'],
                                                    ['d', 'e', 'f'],
                                                ],
                                                cellWidth: 36,
                                                cellHeight: 34,
                                                gap: 3,
                                                fontSize: 28,
                                            }),
                                            FlowArrow({
                                                c,
                                                direction: 'right',
                                                length: 26,
                                                tone: 'cyan',
                                            }),
                                            Grid({
                                                c,
                                                rows: [
                                                    ['a', 'd'],
                                                    ['b', 'e'],
                                                    ['c', 'f'],
                                                ],
                                                cellWidth: 36,
                                                cellHeight: 28,
                                                gap: 3,
                                                fontSize: 28,
                                            }),
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'All 6 values preserved',
                                        fontSize: 28,
                                        color: getReadableToneColor('cyan', c),
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create()
