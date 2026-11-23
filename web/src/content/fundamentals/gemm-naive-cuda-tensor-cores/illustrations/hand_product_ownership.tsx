import {
    BadgePill,
    Column,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 1160
export const height = 650
export const alt =
    'A 2 by 3 matrix A highlights row 1, negative 1, 3, 2. A 3 by 2 matrix B highlights column 0, 2, 1, 3. The three aligned products sum to 7, shown in a solid green C row 1 column 0 cell.'

const illustration = defineIllustration((colors) => {
    const c = { ...colors, preset: 'engineering' as const, shadow: 'transparent' }
    const pillColors = { ...c, textPrimary: '#101012' }
    const positiveText = getReadableToneColor('green', c)
    const matrix = (
        name: string,
        shape: string,
        data: number[][],
        rowLabels: string[],
        colLabels: string[],
        highlight: { row?: number; col?: number; cell?: { row: number; col: number } },
    ) => {
        const cell = (value: number, row: number, col: number) => {
            if (highlight.cell?.row === row && highlight.cell.col === col) {
                return Grid({
                    c,
                    rows: [
                        [
                            {
                                label: String(value),
                                backgroundColor: '#86efac',
                                borderColor: '#15803d',
                                color: '#052e16',
                            },
                        ],
                    ],
                    cellWidth: 70,
                    cellHeight: 62,
                    gap: 0,
                    radius: 6,
                    fontSize: 42,
                })
            }
            const selected = highlight.row === row || highlight.col === col
            return BadgePill({
                c: pillColors,
                text: value === -1 ? '−1' : String(value),
                tone: selected ? 'cyan' : 'neutral',
                width: 72,
                height: 64,
                padding: 0,
                radius: 6,
                fontSize: 42,
            })
        }
        const grid = Column({
            gap: 4,
            align: 'center',
            children: [
                Row({
                    gap: 4,
                    align: 'center',
                    children: [
                        TextLabel({ c, text: '', fontSize: 42, width: 30 }),
                        ...colLabels.map((label) =>
                            TextLabel({
                                c,
                                text: label,
                                fontSize: 42,
                                width: 72,
                                align: 'center',
                                color: c.textSecondary,
                            }),
                        ),
                    ],
                }),
                ...data.map((row, rowIndex) =>
                    Row({
                        gap: 4,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: rowLabels[rowIndex],
                                fontSize: 42,
                                width: 30,
                                align: 'right',
                                color: c.textSecondary,
                            }),
                            ...row.map((value, colIndex) => cell(value, rowIndex, colIndex)),
                        ],
                    }),
                ),
            ],
        })
        return Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: `${name} · ${shape}`,
                    fontSize: 44,
                    width: 322,
                    align: 'center',
                }),
                Row({
                    gap: 8,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: '[',
                            fontSize: 82,
                            width: 24,
                            color: c.textSecondary,
                        }),
                        grid,
                        TextLabel({
                            c,
                            text: ']',
                            fontSize: 82,
                            width: 24,
                            color: c.textSecondary,
                        }),
                    ],
                }),
            ],
        })
    }

    const term = (k: string, product: string) =>
        Column({
            gap: 5,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: `k = ${k}`,
                    fontSize: 42,
                    width: 230,
                    align: 'center',
                    color: c.textSecondary,
                }),
                TextLabel({
                    c,
                    text: product,
                    fontSize: 44,
                    width: 230,
                    align: 'center',
                    color: c.textPrimary,
                }),
            ],
        })

    return Scene({
        c,
        padding: 28,
        gap: 18,
        align: 'center',
        children: Column({
            gap: 18,
            align: 'center',
            children: [
                Row({
                    gap: 10,
                    align: 'center',
                    justify: 'center',
                    children: [
                        matrix(
                            'A',
                            '2 × 3',
                            [
                                [1, 2, 0],
                                [-1, 3, 2],
                            ],
                            ['0', '1'],
                            ['0', '1', '2'],
                            { row: 1 },
                        ),
                        TextLabel({
                            c,
                            text: '×',
                            fontSize: 54,
                            width: 42,
                            align: 'center',
                            color: c.textSecondary,
                        }),
                        matrix(
                            'B',
                            '3 × 2',
                            [
                                [2, -1],
                                [1, 4],
                                [3, 0],
                            ],
                            ['0', '1', '2'],
                            ['0', '1'],
                            { col: 0 },
                        ),
                        TextLabel({
                            c,
                            text: '→',
                            fontSize: 54,
                            width: 48,
                            align: 'center',
                            color: c.textSecondary,
                        }),
                        matrix(
                            'C',
                            '2 × 2',
                            [
                                [4, 7],
                                [7, 13],
                            ],
                            ['0', '1'],
                            ['0', '1'],
                            { cell: { row: 1, col: 0 } },
                        ),
                    ],
                }),
                Row({
                    gap: 26,
                    align: 'center',
                    justify: 'center',
                    children: [
                        term('0', '−1 × 2'),
                        TextLabel({
                            c,
                            text: '+',
                            fontSize: 44,
                            width: 24,
                            align: 'center',
                            color: c.textSecondary,
                        }),
                        term('1', '3 × 1'),
                        TextLabel({
                            c,
                            text: '+',
                            fontSize: 44,
                            width: 24,
                            align: 'center',
                            color: c.textSecondary,
                        }),
                        term('2', '2 × 3'),
                    ],
                }),
                FlowArrow({ c, direction: 'down', tone: 'cyan', length: 30 }),
                TextLabel({
                    c,
                    text: '−2 + 3 + 6 = C₁,₀ = 7',
                    fontSize: 48,
                    width: 800,
                    align: 'center',
                    color: positiveText,
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
