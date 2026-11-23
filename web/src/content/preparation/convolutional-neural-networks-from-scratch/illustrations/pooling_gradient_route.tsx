import { Arrow, Column, Grid, Row, Scene, TextLabel, defineIllustration } from 'vizmatic'
import type { ThemeColors, ToneName } from 'vizmatic'

export const alt =
    'A 4 by 4 feature map is split into four non-overlapping 2 by 2 windows. The maxima 0.91, 0.44, 0.21, and 0.77 form the pooled map. Incoming gradients 2.0, minus 1.0, 0.5, and 3.0 return only to the four winning cells, producing a sparse 4 by 4 input-gradient map.'

export const width = 640
export const height = 740

const featureMap = [
    [0.1, 0.42, 0.18, 0.3],
    [0.25, 0.91, 0.44, 0.12],
    [0.08, 0.21, 0.77, 0.55],
    [0.16, 0.14, 0.32, 0.49],
]
const upstreamGradient = [
    [2.0, -1.0],
    [0.5, 3.0],
]
const regionTones: ToneName[][] = [
    ['cyan', 'cyan', 'purple', 'purple'],
    ['cyan', 'cyan', 'purple', 'purple'],
    ['warm', 'warm', 'green', 'green'],
    ['warm', 'warm', 'green', 'green'],
]

function maxPoolAndRoute() {
    const pooled: number[][] = []
    const winnerLocations: Array<[number, number]> = []
    const inputGradient = featureMap.map((row) => row.map(() => 0))
    for (let row = 0; row < 2; row++) {
        const pooledRow: number[] = []
        for (let col = 0; col < 2; col++) {
            let winner: [number, number] = [row * 2, col * 2]
            for (let lr = 0; lr < 2; lr++) {
                for (let lc = 0; lc < 2; lc++) {
                    const cand: [number, number] = [row * 2 + lr, col * 2 + lc]
                    if (featureMap[cand[0]][cand[1]] > featureMap[winner[0]][winner[1]])
                        winner = cand
                }
            }
            pooledRow.push(featureMap[winner[0]][winner[1]])
            winnerLocations.push(winner)
            inputGradient[winner[0]][winner[1]] = upstreamGradient[row][col]
        }
        pooled.push(pooledRow)
    }
    return { pooled, winnerLocations, inputGradient }
}

const { pooled, winnerLocations, inputGradient } = maxPoolAndRoute()
if (Math.abs(inputGradient.flat().reduce((s, v) => s + Math.abs(v), 0) - 6.5) > 1e-9) {
    throw new Error('CNN max-pooling route diverges from article gradient values.')
}

const featureCells = featureMap.map((row, r) =>
    row.map((v, col) => ({
        label: v.toFixed(2),
        tone: regionTones[r][col],
        winner: winnerLocations.some(([wr, wc]) => wr === r && wc === col),
    })),
)
const pooledCells = pooled.map((row, r) =>
    row.map((v, col) => ({ label: v.toFixed(2), tone: regionTones[r * 2][col * 2] })),
)
const gradientCells = inputGradient.map((row, r) =>
    row.map((v, col) => ({
        label: v === 0 ? '0' : v.toFixed(1),
        tone: v === 0 ? ('neutral' as ToneName) : regionTones[r][col],
    })),
)
const incomingCells = upstreamGradient.map((row, r) =>
    row.map((v, col) => ({ label: v.toFixed(1), tone: regionTones[r * 2][col * 2] })),
)

function label(c: ThemeColors, value: string, size: number, weight = 650, color = c.textPrimary) {
    return TextLabel({ c, text: value, fontSize: size, fontWeight: weight, color, align: 'center' })
}

type GridDatum = { label: string; tone: ToneName; winner?: boolean }

function grid(c: ThemeColors, rows: GridDatum[][], size: number, fontSize: number) {
    const readableRows = rows.map((row) =>
        row.map(({ winner, ...cell }) => ({
            ...cell,
            color: c.textPrimary,
            ...(winner ? { borderColor: c.textPrimary } : {}),
        })),
    )
    return Grid({
        c,
        rows: readableRows,
        cellWidth: size,
        cellHeight: size,
        gap: 4,
        fontSize,
        radius: 8,
    })
}

const illustration = defineIllustration((c) =>
    Scene({
        c,
        padding: 10,
        gap: 8,
        contentWidth: 620,
        children: Column({
            gap: 6,
            align: 'center',
            children: [
                label(c, 'Max pooling keeps each window’s peak', 26, 800),
                label(c, '2 × 2 windows · stride 2 · parameter-free', 20, 600, c.textSecondary),
                label(c, 'Forward · the largest value in each window survives', 22, 750),
                Row({
                    gap: 12,
                    align: 'center',
                    justify: 'center',
                    children: [
                        Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                label(c, 'Input A · 4 × 4', 20),
                                grid(c, featureCells, 50, 21),
                            ],
                        }),
                        Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                label(c, '2 × 2 max', 20, 650, c.textSecondary),
                                Arrow({ c, direction: 'right', length: 22, color: c.secondary }),
                            ],
                        }),
                        Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                label(c, 'Pooled y · 2 × 2', 20),
                                grid(c, pooledCells, 58, 22),
                            ],
                        }),
                    ],
                }),
                label(c, 'Backward · each δ returns to its window’s maximum', 22, 750),
                Row({
                    gap: 12,
                    align: 'center',
                    justify: 'center',
                    children: [
                        Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                label(c, 'Input gradient ∂L/∂A', 20),
                                grid(c, gradientCells, 50, 21),
                            ],
                        }),
                        Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                label(c, 'routes left', 20, 650, c.textSecondary),
                                Arrow({ c, direction: 'left', length: 22, color: c.positive }),
                            ],
                        }),
                        Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                label(c, 'Incoming δ = ∂L/∂y', 20),
                                grid(c, incomingCells, 58, 22),
                            ],
                        }),
                    ],
                }),
                label(c, 'Zeros mark nonwinning cells.', 20, 650, c.textSecondary),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
