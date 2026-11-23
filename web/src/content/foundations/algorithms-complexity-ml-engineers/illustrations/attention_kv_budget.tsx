import {
    Column,
    Panel,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
} from 'vizmatic'

export const alt =
    'For one sequence, conceptual dense attention score grids grow from 128² = 16,384 cells to 2,048² = 4,194,304 cells per head. In a separate Llama 3 8B raw-cache estimate, each token uses 128 KiB; for 16 equal-length streams, contexts from 512 to 8,192 tokens use 1 to 16 GiB of KV values. Fused kernels may avoid storing the score grid, and model weights and workspace add memory beyond raw KV.'

export const width = 660
export const height = 650
export const preset = 'architecture'

const illustration = defineIllustration((c) => {
    const compactScores = [
        { tokens: '128', blocks: 2, cells: '16,384' },
        { tokens: '512', blocks: 8, cells: '262,144' },
        { tokens: '1,024', blocks: 16, cells: '1.05M' },
    ]

    const scorePanel = Panel({
        c,
        title: 'Dense score grid · cells grow as t² (each tile = 64²)',
        titleFontSize: 20,
        tone: 'purple',
        width: 628,
        padding: '12px 14px',
        gap: 8,
        shadow: false,
        children: Row({
            gap: 20,
            align: 'center',
            justify: 'center',
            children: [
                Column({
                    gap: 8,
                    align: 'stretch',
                    children: compactScores.map((item) =>
                        Row({
                            gap: 10,
                            align: 'center',
                            children: [
                                TiledMatrix({
                                    c,
                                    rows: item.blocks,
                                    cols: item.blocks,
                                    cellSize: 4,
                                    gap: 0,
                                    tone: 'purple',
                                    ariaLabel: `${item.tokens} by ${item.tokens} score grid`,
                                }),
                                TextLabel({
                                    c,
                                    text: `t=${item.tokens} → ${item.cells}`,
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: c.textPrimary,
                                }),
                            ],
                        }),
                    ),
                }),
                Row({
                    gap: 12,
                    align: 'center',
                    children: [
                        TiledMatrix({
                            c,
                            rows: 32,
                            cols: 32,
                            cellSize: 4,
                            gap: 0,
                            tone: 'purple',
                            ariaLabel: '2,048 by 2,048 score grid shown as 32 by 32 blocks',
                        }),
                        Column({
                            gap: 4,
                            children: [
                                TextLabel({
                                    c,
                                    text: 't=2,048',
                                    fontSize: 20,
                                    fontWeight: 750,
                                    color: c.textPrimary,
                                }),
                                TextLabel({
                                    c,
                                    text: 't² = 4.19M',
                                    fontSize: 20,
                                    fontWeight: 750,
                                    color: c.primaryLight,
                                }),
                                TextLabel({
                                    c,
                                    text: '2× t → 4× cells',
                                    fontSize: 20,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })

    const cachePanel = Panel({
        c,
        title: 'KV cache · B × t bytes (16 streams, Llama 3 8B)',
        titleFontSize: 20,
        tone: 'green',
        width: 628,
        padding: '12px 14px',
        gap: 8,
        shadow: false,
        children: Column({
            gap: 8,
            align: 'stretch',
            children: [
                TextLabel({
                    c,
                    text: '128 KiB/token · raw KV only (weights and workspace add extra memory)',
                    fontSize: 20,
                    color: c.textSecondary,
                }),
                ProgressList({
                    c,
                    labelWidth: 240,
                    valueWidth: 80,
                    barHeight: 14,
                    fontSize: 20,
                    gap: 6,
                    rows: [
                        {
                            label: '512 tokens / stream',
                            value: 0.0625,
                            valueLabel: '1 GiB',
                            tone: 'green',
                        },
                        {
                            label: '1,024 tokens / stream',
                            value: 0.125,
                            valueLabel: '2 GiB',
                            tone: 'green',
                        },
                        {
                            label: '2,048 tokens / stream',
                            value: 0.25,
                            valueLabel: '4 GiB',
                            tone: 'warm',
                        },
                        {
                            label: '4,096 tokens / stream',
                            value: 0.5,
                            valueLabel: '8 GiB',
                            tone: 'warm',
                        },
                        {
                            label: '8,192 tokens / stream',
                            value: 1,
                            valueLabel: '16 GiB',
                            tone: 'critical',
                        },
                    ],
                }),
            ],
        }),
    })

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: width - 32,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Context Length Grows Two Serving Budgets',
                    fontSize: 23,
                    fontWeight: 760,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Score grids grow as t²; KV cache bytes grow linearly as B × t',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                scorePanel,
                cachePanel,
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
