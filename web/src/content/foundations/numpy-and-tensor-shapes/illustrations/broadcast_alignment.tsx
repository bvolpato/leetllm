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
    'Left: a 3-by-4 slice x[0] shows token rows the, red, and fox with feature columns d0 through d3, adding green feature bias [100, 200, 300, 400] to the red row [4, 5, 6, 7] to produce [104, 205, 306, 407]. Right: right-aligned shape lanes against (2, 3, 4) show feature bias (1, 1, 4) and token bias (1, 3, 1) succeeding, while bare (3,) becomes (1, 1, 3) and collides at D because 3 does not equal 4.'
export const width = 780
export const height = 470
export const preset = 'engineering'

const featureCell = (label: string) => ({ label, tone: 'green' as const })
const redCell = (label: string) => ({ label, tone: 'purple' as const })
const sizeOne = { label: '1', tone: 'cyan' as const }
const mismatch = { label: '3', tone: 'critical' as const }

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)

    return Scene({
        c,
        padding: 18,
        gap: 10,
        contentWidth: 744,
        children: Row({
            width: 744,
            gap: 20,
            align: 'center',
            justify: 'center',
            children: [
                Column({
                    width: 334,
                    gap: 8,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'x[0] · tokens T × D',
                            fontSize: 24,
                            fontWeight: 700,
                            color: c.textPrimary,
                            mono: true,
                        }),
                        Row({
                            gap: 5,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'bias',
                                    width: 60,
                                    fontSize: 23,
                                    fontWeight: 700,
                                    mono: true,
                                    color: green,
                                }),
                                Grid({
                                    c,
                                    cellWidth: 58,
                                    cellHeight: 36,
                                    gap: 5,
                                    fontSize: 23,
                                    rows: [
                                        [
                                            featureCell('100'),
                                            featureCell('200'),
                                            featureCell('300'),
                                            featureCell('400'),
                                        ],
                                    ],
                                }),
                            ],
                        }),
                        Grid({
                            c,
                            cellWidth: 58,
                            cellHeight: 36,
                            gap: 5,
                            fontSize: 23,
                            headerRows: 1,
                            headerCols: 1,
                            rows: [
                                ['T:D', 'd0', 'd1', 'd2', 'd3'],
                                ['the', '0', '1', '2', '3'],
                                ['red', redCell('4'), redCell('5'), redCell('6'), redCell('7')],
                                ['fox', '8', '9', '10', '11'],
                            ],
                        }),
                        Row({
                            gap: 8,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'red row + bias',
                                    fontSize: 23,
                                    fontWeight: 650,
                                    color: c.textSecondary,
                                }),
                                FlowArrow({ c, direction: 'down', length: 24, tone: 'green' }),
                            ],
                        }),
                        Grid({
                            c,
                            cellWidth: 66,
                            cellHeight: 38,
                            gap: 5,
                            fontSize: 23,
                            rows: [
                                [redCell('104'), redCell('205'), redCell('306'), redCell('407')],
                            ],
                        }),
                    ],
                }),
                Column({
                    width: 390,
                    gap: 10,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Right-align the shape slots',
                            fontSize: 24,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        Grid({
                            c,
                            cellWidth: 92,
                            cellHeight: 38,
                            gap: 5,
                            fontSize: 23,
                            headerRows: 1,
                            headerCols: 1,
                            rows: [
                                ['array', 'B', 'T', 'D'],
                                ['x', '2', '3', '4'],
                                ['result', '2', '3', '4'],
                                ['feature', sizeOne, sizeOne, '4'],
                                ['token', sizeOne, '3', sizeOne],
                                ['flat', sizeOne, sizeOne, mismatch],
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'token bias (3, 1) → (1, 3, 1) fits T',
                            fontSize: 23,
                            fontWeight: 600,
                            color: green,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: 'bare (3,) → (1, 1, 3): 3 ≠ D=4',
                            fontSize: 23,
                            fontWeight: 600,
                            color: red,
                            align: 'center',
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create()
