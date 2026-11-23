import { Arrow, Column, Grid, Row, Scene, TextLabel, defineIllustration } from 'vizmatic'
import type { ThemeColors, ToneName } from 'vizmatic'

export const alt =
    'A 4 by 4 grayscale crop and a 3 by 3 horizontal detector. The first window uses row sums 0.19, 1.92, and 1.91, producing a response of 0.852. The same kernel scans all four valid positions to make a 2 by 2 feature map with responses 0.852, 0.789, 0.817, and 0.874.'

export const width = 660
export const height = 620

type Cell = { label: string; tone: ToneName }

const crop: Cell[][] = [
    [
        { label: '0.05', tone: 'cyan' },
        { label: '0.08', tone: 'cyan' },
        { label: '0.06', tone: 'cyan' },
        { label: '0.07', tone: 'neutral' },
    ],
    [
        { label: '0.12', tone: 'cyan' },
        { label: '0.92', tone: 'cyan' },
        { label: '0.88', tone: 'cyan' },
        { label: '0.09', tone: 'neutral' },
    ],
    [
        { label: '0.08', tone: 'cyan' },
        { label: '0.90', tone: 'cyan' },
        { label: '0.93', tone: 'cyan' },
        { label: '0.11', tone: 'neutral' },
    ],
    [
        { label: '0.06', tone: 'neutral' },
        { label: '0.07', tone: 'neutral' },
        { label: '0.09', tone: 'neutral' },
        { label: '0.05', tone: 'neutral' },
    ],
]

const kernel: Cell[][] = [
    [
        { label: '−0.6', tone: 'purple' },
        { label: '−0.6', tone: 'purple' },
        { label: '−0.6', tone: 'purple' },
    ],
    [
        { label: '+1.1', tone: 'green' },
        { label: '+1.1', tone: 'green' },
        { label: '+1.1', tone: 'green' },
    ],
    [
        { label: '−0.6', tone: 'purple' },
        { label: '−0.6', tone: 'purple' },
        { label: '−0.6', tone: 'purple' },
    ],
]

const responseMap: Cell[][] = [
    [
        { label: '0.852', tone: 'cyan' },
        { label: '0.789', tone: 'blue' },
    ],
    [
        { label: '0.817', tone: 'blue' },
        { label: '0.874', tone: 'green' },
    ],
]

function heading(c: ThemeColors, text: string, color = c.textPrimary) {
    return TextLabel({ c, text, fontSize: 22, fontWeight: 750, color, align: 'center' })
}

function values(c: ThemeColors, rows: Cell[][], size: number, fontSize: number) {
    const readableRows = rows.map((row) => row.map((cell) => ({ ...cell, color: c.textPrimary })))
    return Grid({
        c,
        rows: readableRows,
        cellWidth: size,
        cellHeight: size,
        gap: 4,
        fontSize,
        radius: 9,
    })
}

const illustration = defineIllustration((c) =>
    Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 636,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Slide one detector across the crop',
                    fontSize: 28,
                    fontWeight: 800,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Row({
                    gap: 8,
                    align: 'center',
                    justify: 'center',
                    children: [
                        Column({
                            gap: 6,
                            align: 'center',
                            children: [heading(c, 'Input x (4×4)'), values(c, crop, 54, 20)],
                        }),
                        Arrow({ c, direction: 'right', length: 14 }),
                        Column({
                            gap: 6,
                            align: 'center',
                            children: [heading(c, 'Kernel k (3×3)'), values(c, kernel, 54, 20)],
                        }),
                        Arrow({ c, direction: 'right', length: 14, color: c.secondary }),
                        Column({
                            gap: 6,
                            align: 'center',
                            children: [heading(c, 'Map y (2×2)'), values(c, responseMap, 72, 22)],
                        }),
                    ],
                }),
                Column({
                    gap: 4,
                    align: 'center',
                    children: [
                        heading(c, 'Window (0,0) response from three row sums'),
                        TextLabel({
                            c,
                            text: '−0.6 × 0.19 = −0.114',
                            fontSize: 21,
                            mono: true,
                            color: c.textPrimary,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: '+1.1 × 1.92 = +2.112',
                            fontSize: 21,
                            mono: true,
                            color: c.textPrimary,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: '−0.6 × 1.91 = −1.146',
                            fontSize: 21,
                            mono: true,
                            color: c.textPrimary,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: '−0.114 + 2.112 − 1.146 = 0.852',
                            fontSize: 22,
                            mono: true,
                            fontWeight: 750,
                            color: c.positive,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: 'Peak response 0.874 lands at bottom-right offset (1,1).',
                            fontSize: 21,
                            color: c.textSecondary,
                            align: 'center',
                        }),
                    ],
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
