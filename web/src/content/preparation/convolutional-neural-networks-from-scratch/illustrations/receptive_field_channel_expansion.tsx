import {
    Column,
    Grid,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    ToneStrip,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors, ToneName } from 'vizmatic'

export const alt =
    'Nested pixel regions show one activation’s receptive field growing from 1 by 1 at the input to 3 by 3, 5 by 5, 6 by 6 after pooling, and 10 by 10 after the next convolution. A separate channel track shows 3, 16, 32, 32, and 64 channels as spatial maps change from 224 by 224 to 222, 220, 110, and 108.'

export const width = 640
export const height = 740

const stages = [
    {
        operation: 'input',
        channels: 3,
        side: 224,
        field: 1,
        jump: 1,
        tone: 'cyan' as ToneName,
        rows: 1,
        cols: 3,
    },
    {
        operation: 'conv 3×3',
        channels: 16,
        side: 222,
        field: 3,
        jump: 1,
        tone: 'blue' as ToneName,
        rows: 4,
        cols: 4,
    },
    {
        operation: 'conv 3×3',
        channels: 32,
        side: 220,
        field: 5,
        jump: 1,
        tone: 'purple' as ToneName,
        rows: 4,
        cols: 8,
    },
    {
        operation: 'pool 2×2',
        channels: 32,
        side: 110,
        field: 6,
        jump: 2,
        tone: 'warm' as ToneName,
        rows: 4,
        cols: 8,
    },
    {
        operation: 'conv 3×3',
        channels: 64,
        side: 108,
        field: 10,
        jump: 2,
        tone: 'green' as ToneName,
        rows: 8,
        cols: 8,
    },
]

let checkedSide = stages[0].side
let checkedField = stages[0].field
let checkedJump = stages[0].jump
for (const stage of stages.slice(1)) {
    const kernel = stage.operation.startsWith('pool') ? 2 : 3
    const stride = stage.operation.startsWith('pool') ? 2 : 1
    checkedSide = Math.floor((checkedSide - kernel) / stride) + 1
    checkedField += (kernel - 1) * checkedJump
    checkedJump *= stride
    if (
        checkedSide !== stage.side ||
        checkedField !== stage.field ||
        checkedJump !== stage.jump ||
        stage.rows * stage.cols !== stage.channels
    ) {
        throw new Error('CNN receptive-field progression diverges from layer sequence.')
    }
}

function regionTone(row: number, col: number): ToneName {
    if (row === 0 && col === 0) return 'green'
    if (row < 3 && col < 3) return 'cyan'
    if (row < 5 && col < 5) return 'purple'
    if (row < 6 && col < 6) return 'warm'
    return 'blue'
}

function label(c: ThemeColors, value: string, size: number, color = c.textPrimary, weight = 650) {
    return TextLabel({ c, text: value, fontSize: size, color, fontWeight: weight, align: 'center' })
}

const illustration = defineIllustration((c) =>
    Scene({
        c,
        padding: 12,
        gap: 8,
        contentWidth: 616,
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                label(c, 'Receptive fields widen across layers', 26, c.textPrimary, 800),
                label(
                    c,
                    'One output unit’s input footprint grows at each stage.',
                    20,
                    c.textSecondary,
                ),
                Row({
                    gap: 16,
                    align: 'center',
                    justify: 'center',
                    children: [
                        Grid({
                            c,
                            rows: Array.from({ length: 10 }, (_, r) =>
                                Array.from({ length: 10 }, (_, col) => ({
                                    label: '',
                                    tone: regionTone(r, col),
                                })),
                            ),
                            cellWidth: 16,
                            cellHeight: 16,
                            gap: 2,
                            radius: 2,
                        }),
                        Column({
                            gap: 6,
                            children: stages.map((stage) =>
                                Row({
                                    gap: 8,
                                    align: 'center',
                                    children: [
                                        ToneStrip({
                                            tone: regionTone(stage.field - 1, stage.field - 1),
                                            width: 16,
                                            height: 16,
                                        }),
                                        label(
                                            c,
                                            `RF ${stage.field}×${stage.field} · ${stage.operation} · jump ${stage.jump}`,
                                            21,
                                            c.textPrimary,
                                        ),
                                    ],
                                }),
                            ),
                        }),
                    ],
                }),
                label(c, 'Each color adds the next ring of input pixels.', 20, c.textSecondary),
                label(c, 'Channels expand while spatial maps shrink', 23, c.textPrimary, 750),
                label(c, 'Tiles count channels; number below gives map side.', 20, c.textSecondary),
                Row({
                    gap: 6,
                    align: 'end',
                    justify: 'center',
                    children: stages.map((stage) =>
                        Column({
                            gap: 4,
                            align: 'center',
                            width: 108,
                            children: [
                                label(c, stage.operation, 20, c.textSecondary),
                                TiledMatrix({
                                    c,
                                    rows: stage.rows,
                                    cols: stage.cols,
                                    cellSize: 6,
                                    gap: 2,
                                    tone: stage.tone,
                                    regions: [
                                        {
                                            rowStart: 0,
                                            rowEnd: stage.rows,
                                            colStart: 0,
                                            colEnd: stage.cols,
                                            tone: stage.tone,
                                        },
                                    ],
                                }),
                                label(c, `C = ${stage.channels}`, 21, c.textPrimary, 750),
                                label(c, `${stage.side}²`, 21, c.textSecondary),
                            ],
                        }),
                    ),
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
