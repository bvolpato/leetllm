import {
    Column,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const alt =
    'Snippet 0 starts as a token-by-feature matrix with the [0, 1, 2, 3], red [4, 5, 6, 7], and fox [8, 9, 10, 11]. C-order reshape to (4, 3) places 3 beside 4. Transpose to (4, 3) swaps token and feature axes, keeping 3 at feature d3 of the token the and 4 at feature d0 of the token red. For float32, the resulting strides are (12, 4) bytes after reshape and (4, 16) bytes after transpose.'
export const width = 560
export const height = 660
export const preset = 'engineering'

const theThree = { label: '3', tone: 'purple' as const }
const redFour = { label: '4', tone: 'blue' as const }

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const reshapeTone = getReadableToneColor('warm', c)
    const transposeTone = getReadableToneColor('green', c)

    return Scene({
        c,
        padding: 22,
        gap: 11,
        contentWidth: 516,
        children: Column({
            width: 516,
            gap: 9,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'x[0] · tokens T × features D',
                    fontSize: 21,
                    fontWeight: 700,
                    color: c.textPrimary,
                    mono: true,
                }),
                Grid({
                    c,
                    cellWidth: 60,
                    cellHeight: 34,
                    gap: 5,
                    fontSize: 20,
                    headerRows: 1,
                    headerCols: 1,
                    rows: [
                        ['T:D', 'd0', 'd1', 'd2', 'd3'],
                        ['the', '0', '1', '2', theThree],
                        ['red', redFour, '5', '6', '7'],
                        ['fox', '8', '9', '10', '11'],
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Same C-order values · different index maps',
                    fontSize: 20,
                    fontWeight: 650,
                    color: c.textSecondary,
                }),
                Row({
                    width: '100%',
                    gap: 20,
                    align: 'start',
                    justify: 'center',
                    children: [
                        Column({
                            width: 248,
                            gap: 6,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'reshape (4, 3)',
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: reshapeTone,
                                    mono: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 're-chunk the stream',
                                    fontSize: 20,
                                    color: c.textSecondary,
                                }),
                                FlowArrow({ c, direction: 'down', length: 22, tone: 'warm' }),
                                Grid({
                                    c,
                                    cellWidth: 56,
                                    cellHeight: 34,
                                    gap: 4,
                                    fontSize: 20,
                                    headerRows: 1,
                                    headerCols: 1,
                                    rows: [
                                        ['row', 'c0', 'c1', 'c2'],
                                        ['r0', '0', '1', '2'],
                                        ['r1', theThree, redFour, '5'],
                                        ['r2', '6', '7', '8'],
                                        ['r3', '9', '10', '11'],
                                    ],
                                }),
                                TextLabel({
                                    c,
                                    text: 'strides (12, 4) bytes',
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: c.textPrimary,
                                    mono: true,
                                }),
                            ],
                        }),
                        Column({
                            width: 248,
                            gap: 6,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'transpose (1, 0)',
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: transposeTone,
                                    mono: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 'swap T and D axes',
                                    fontSize: 20,
                                    color: c.textSecondary,
                                }),
                                FlowArrow({ c, direction: 'down', length: 22, tone: 'green' }),
                                Grid({
                                    c,
                                    cellWidth: 58,
                                    cellHeight: 34,
                                    gap: 4,
                                    fontSize: 20,
                                    headerRows: 1,
                                    headerCols: 1,
                                    rows: [
                                        ['D:T', 'the', 'red', 'fox'],
                                        ['d0', '0', redFour, '8'],
                                        ['d1', '1', '5', '9'],
                                        ['d2', '2', '6', '10'],
                                        ['d3', theThree, '7', '11'],
                                    ],
                                }),
                                TextLabel({
                                    c,
                                    text: 'transpose view',
                                    fontSize: 20,
                                    fontWeight: 600,
                                    color: c.textPrimary,
                                }),
                                TextLabel({
                                    c,
                                    text: 'strides (4, 16) bytes',
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: c.textPrimary,
                                    mono: true,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create()
