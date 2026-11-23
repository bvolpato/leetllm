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
    'An indexed array starts with x of shape (2, 3, 4). Batch item 0 shows token rows the [0, 1, 2, 3], red [4, 5, 6, 7], and fox [8, 9, 10, 11]. Selecting token 1 keeps its four feature cells, producing x[0, 1, :] with shape (4,).'
export const preset = 'engineering'
export const width = 560
export const height = 540

const selected = (label: string) => ({ label, tone: 'purple' as const })

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const batch = getReadableToneColor('purple', c)
    const token = getReadableToneColor('blue', c)
    const feature = getReadableToneColor('cyan', c)

    return Scene({
        c,
        padding: 22,
        gap: 12,
        contentWidth: 516,
        children: Column({
            width: 516,
            gap: 10,
            align: 'center',
            children: [
                Row({
                    gap: 18,
                    align: 'center',
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'x: (B, T, D) = (2, 3, 4)',
                            fontSize: 22,
                            fontWeight: 700,
                            mono: true,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'b = 0',
                            fontSize: 20,
                            fontWeight: 700,
                            mono: true,
                            color: batch,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'x[0] · one snippet · shape (3, 4)',
                    fontSize: 20,
                    fontWeight: 650,
                    color: c.textSecondary,
                }),
                Grid({
                    c,
                    cellWidth: 60,
                    cellHeight: 36,
                    gap: 5,
                    fontSize: 20,
                    headerRows: 1,
                    headerCols: 1,
                    rows: [
                        ['T:D', '0', '1', '2', '3'],
                        ['the', '0', '1', '2', '3'],
                        ['red', selected('4'), selected('5'), selected('6'), selected('7')],
                        ['fox', '8', '9', '10', '11'],
                    ],
                }),
                Row({
                    gap: 10,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 't = 1',
                            fontSize: 20,
                            fontWeight: 700,
                            mono: true,
                            color: token,
                        }),
                        FlowArrow({ c, direction: 'down', length: 30, tone: 'blue' }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'x[0, 1, :] · shape (4,)',
                    fontSize: 20,
                    fontWeight: 650,
                    color: c.textPrimary,
                    mono: true,
                }),
                Grid({
                    c,
                    cellWidth: 74,
                    cellHeight: 36,
                    gap: 6,
                    fontSize: 20,
                    headerRows: 1,
                    rows: [
                        ['d0', 'd1', 'd2', 'd3'],
                        [selected('4'), selected('5'), selected('6'), selected('7')],
                    ],
                }),
                TextLabel({
                    c,
                    text: 'B and T are selected. D stays as the feature axis.',
                    fontSize: 20,
                    color: feature,
                }),
            ],
        }),
    })
}

export default create()
