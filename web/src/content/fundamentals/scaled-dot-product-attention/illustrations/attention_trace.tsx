import { createElement } from 'react'
import { FlowArrow, Grid, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 640
export const height = 620
export const alt =
    'Two-token attention trace in four steps: raw scores [[0.90, 0.75], [0.60, 1.05]], scaled logits [[0.636, 0.530], [0.424, 0.742]], row-softmax weights [[0.527, 0.473], [0.421, 0.579]], then the highlighted sing row produces output [1.421, 1.579].'

type Tone = 'blue' | 'purple' | 'green'

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const columns = ['Birds', 'sing']
    const rowNames = ['Birds', 'sing']
    const padded = (label: string) =>
        createElement('span', { style: { display: 'inline-block', paddingInline: 6 } }, label)

    const matrix = (values: number[][], tone: Tone, rowLabels = rowNames, colLabels = columns) => {
        const rows = [
            [{ label: padded('q / k') }, ...colLabels.map((label) => ({ label: padded(label) }))],
            ...values.map((row, rowIndex) => [
                { label: padded(rowLabels[rowIndex]) },
                ...row.map((value) => ({
                    label: padded(Number.isInteger(value) ? value.toFixed(0) : value.toFixed(3)),
                    tone: rowIndex === 1 ? ('green' as const) : tone,
                    color: c.textPrimary,
                })),
            ]),
        ]
        return Grid({
            c,
            cellWidth: 92,
            cellHeight: 54,
            gap: 6,
            fontSize: 23,
            headerRows: 1,
            headerCols: 1,
            rows,
        })
    }

    const output = Grid({
        c,
        cellWidth: 92,
        cellHeight: 54,
        gap: 6,
        fontSize: 23,
        headerRows: 1,
        headerCols: 1,
        rows: [
            [{ label: padded('q / d') }, { label: padded('0') }, { label: padded('1') }],
            [
                { label: padded('sing') },
                { label: padded('1.421'), tone: 'green', color: c.textPrimary },
                { label: padded('1.579'), tone: 'green', color: c.textPrimary },
            ],
        ],
    })

    const stage = (
        step: number,
        heading: string,
        data: ReturnType<typeof matrix> | ReturnType<typeof Grid>,
    ) =>
        createElement(
            'div',
            {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                },
            },
            TextLabel({
                c,
                text: `${step} · ${heading}`,
                fontSize: 21,
                mono: true,
                fontWeight: 700,
                align: 'center',
            }),
            data,
        )

    return Scene({
        c,
        title: 'Follow one attention pass from scores to values',
        contentWidth: 620,
        padding: 10,
        gap: 10,
        children: [
            createElement(
                'div',
                {
                    style: {
                        display: 'grid',
                        gridTemplateColumns: '1fr 30px 1fr',
                        gridTemplateRows: 'auto 28px auto',
                        alignItems: 'center',
                        justifyItems: 'center',
                        columnGap: 4,
                        rowGap: 4,
                        width: '100%',
                    },
                },
                createElement(
                    'div',
                    { style: { gridColumn: 1, gridRow: 1 } },
                    stage(
                        1,
                        'S = QKᵀ',
                        matrix(
                            [
                                [0.9, 0.75],
                                [0.6, 1.05],
                            ],
                            'blue',
                        ),
                    ),
                ),
                createElement(
                    'div',
                    { style: { gridColumn: 2, gridRow: 1 } },
                    FlowArrow({ direction: 'right', c, tone: 'purple', length: 24 }),
                ),
                createElement(
                    'div',
                    { style: { gridColumn: 3, gridRow: 1 } },
                    stage(
                        2,
                        'L = S / √2',
                        matrix(
                            [
                                [0.636, 0.53],
                                [0.424, 0.742],
                            ],
                            'purple',
                        ),
                    ),
                ),
                createElement(
                    'div',
                    { style: { gridColumn: 3, gridRow: 2 } },
                    FlowArrow({ direction: 'down', c, tone: 'purple', length: 20 }),
                ),
                createElement(
                    'div',
                    { style: { gridColumn: 1, gridRow: 3 } },
                    stage(4, 'O = AV', output),
                ),
                createElement(
                    'div',
                    { style: { gridColumn: 2, gridRow: 3 } },
                    FlowArrow({ direction: 'left', c, tone: 'green', length: 24 }),
                ),
                createElement(
                    'div',
                    { style: { gridColumn: 3, gridRow: 3 } },
                    stage(
                        3,
                        'A = softmax(L)',
                        matrix(
                            [
                                [0.527, 0.473],
                                [0.421, 0.579],
                            ],
                            'green',
                        ),
                    ),
                ),
            ),
        ],
    })
}

export default create('dark')
