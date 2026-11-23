import {
    Column,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const alt =
    'Left: snippet 0 of x has three token rows and four features, whose token mean [4, 5, 6, 7] subtracts from each row to give [-4, -4, -4, -4], [0, 0, 0, 0], and [4, 4, 4, 4]. Right: right-aligning against (2, 3, 4) puts the unkept mean shape (2, 4) as (1, 2, 4) with 2 colliding against T=3, whereas keepdims=True returns (2, 1, 4) with a size-1 token slot.'
export const width = 760
export const height = 560
export const preset = 'engineering'

type ShapeCell = string | { label: string; tone: 'critical' | 'cyan' }

const meanCell = (label: string) => ({ label, tone: 'cyan' as const })
const mismatch = { label: '2', tone: 'critical' as const }
const slot = { label: '1', tone: 'cyan' as const }
const negative = (label: string) => ({ label, tone: 'blue' as const })
const zero = { label: '0', tone: 'neutral' as const }
const positive = (label: string) => ({ label, tone: 'green' as const })

function shapeLane(
    c: ThemeColors,
    label: string,
    values: ShapeCell[],
    color: string = c.textSecondary,
) {
    return Row({
        gap: 8,
        align: 'center',
        justify: 'center',
        children: [
            TextLabel({
                c,
                text: label,
                width: 124,
                fontSize: 23,
                fontWeight: 650,
                color,
                align: 'right',
            }),
            Grid({ c, cellWidth: 64, cellHeight: 38, gap: 5, fontSize: 23, rows: [values] }),
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const critical = getReadableToneColor('critical', c)
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        padding: 18,
        gap: 10,
        contentWidth: 724,
        children: Row({
            width: 724,
            gap: 20,
            align: 'center',
            justify: 'center',
            children: [
                Column({
                    width: 348,
                    gap: 8,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'x[0] (b=0) · T × D',
                            fontSize: 24,
                            fontWeight: 700,
                            color: c.textPrimary,
                            mono: true,
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
                                ['t0', '0', '1', '2', '3'],
                                ['t1', '4', '5', '6', '7'],
                                ['t2', '8', '9', '10', '11'],
                            ],
                        }),
                        Row({
                            gap: 5,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'μ₀',
                                    width: 58,
                                    fontSize: 23,
                                    fontWeight: 700,
                                    mono: true,
                                    color: getReadableToneColor('cyan', c),
                                    align: 'center',
                                }),
                                Grid({
                                    c,
                                    cellWidth: 58,
                                    cellHeight: 36,
                                    gap: 5,
                                    fontSize: 23,
                                    rows: [
                                        [
                                            meanCell('4'),
                                            meanCell('5'),
                                            meanCell('6'),
                                            meanCell('7'),
                                        ],
                                    ],
                                }),
                            ],
                        }),
                        Row({
                            gap: 8,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'subtract μ₀',
                                    fontSize: 23,
                                    fontWeight: 650,
                                    color: c.textSecondary,
                                }),
                                FlowArrow({ c, direction: 'down', length: 22, tone: 'cyan' }),
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
                                [
                                    't0',
                                    negative('-4'),
                                    negative('-4'),
                                    negative('-4'),
                                    negative('-4'),
                                ],
                                ['t1', zero, zero, zero, zero],
                                ['t2', positive('4'), positive('4'), positive('4'), positive('4')],
                            ],
                        }),
                    ],
                }),
                Column({
                    width: 356,
                    gap: 11,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Align mean into x (2, 3, 4)',
                            fontSize: 24,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        shapeLane(c, 'axis', ['B', 'T', 'D']),
                        shapeLane(c, 'x', ['2', '3', '4'], c.textPrimary),
                        shapeLane(c, 'mean flat', ['1', mismatch, '4'], critical),
                        shapeLane(c, 'keepdims', ['2', slot, '4'], green),
                        TextLabel({
                            c,
                            text: 'Flat mean puts 2 on T: 2 ≠ 3.',
                            fontSize: 23,
                            fontWeight: 650,
                            color: critical,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: 'keepdims keeps T=1 across tokens.',
                            fontSize: 23,
                            fontWeight: 650,
                            color: green,
                            align: 'center',
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create()
