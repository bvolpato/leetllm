import {
    Column,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 620
export const height = 770
export const alt =
    'FlashAttention streams key and value tiles from HBM into on-chip SRAM while the query row and its running state persist. The highlighted second tile contains scores 1001 and 999 with values 1 and 4. Its new maximum rescales the prior state by exp(-1), leaving m=1001, l≈1.50321, u≈2.27710, and output 1.51482 without writing the full score matrix to HBM.'

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    const state = (label: string, values: string[]) =>
        Column({
            gap: 6,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: label,
                    fontSize: 20,
                    color: c.textMuted,
                    align: 'center',
                }),
                Grid({
                    c,
                    cellWidth: 82,
                    cellHeight: 40,
                    gap: 4,
                    fontSize: 22,
                    headerRows: 1,
                    rows: [
                        [{ label: 'm' }, { label: 'ℓ' }, { label: 'u' }],
                        values.map((value) => ({
                            label: value,
                            tone: 'green' as const,
                            color: c.textPrimary,
                        })),
                    ],
                }),
            ],
        })

    const streamedTile = Grid({
        c,
        cellWidth: 76,
        cellHeight: 40,
        gap: 4,
        fontSize: 22,
        headerRows: 1,
        headerCols: 1,
        rows: [
            [{ label: 'Kⱼ,Vⱼ' }, { label: 'k₁' }, { label: 'k₂' }],
            [
                { label: 'score' },
                { label: '1001', tone: 'purple', color: c.textPrimary },
                { label: '999', tone: 'purple', color: c.textPrimary },
            ],
            [
                { label: 'value' },
                { label: '1', tone: 'purple', color: c.textPrimary },
                { label: '4', tone: 'purple', color: c.textPrimary },
            ],
        ],
    })

    return Scene({
        c,
        title: 'Stream K/V tiles; keep the query row on chip',
        contentWidth: 600,
        padding: 10,
        gap: 16,
        children: [
            Row({
                gap: 16,
                align: 'center',
                justify: 'center',
                children: [
                    Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'HBM blocks',
                                fontSize: 22,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            TiledMatrix({
                                c,
                                rows: 5,
                                cols: 7,
                                cellSize: 21,
                                gap: 4,
                                muted: true,
                                tone: 'neutral',
                                ariaLabel:
                                    'HBM block grid with the selected key/value tile highlighted',
                                regions: [
                                    {
                                        rowStart: 1,
                                        rowEnd: 3,
                                        colStart: 2,
                                        colEnd: 5,
                                        tone: 'purple',
                                    },
                                ],
                            }),
                            TextLabel({
                                c,
                                text: 'Kⱼ,Vⱼ · tile 2',
                                fontSize: 19,
                                color: c.textMuted,
                                align: 'center',
                            }),
                        ],
                    }),
                    Column({
                        gap: 4,
                        align: 'center',
                        children: [
                            FlowArrow({ direction: 'right', c, tone: 'purple', length: 22 }),
                            TextLabel({
                                c,
                                text: 'stream',
                                fontSize: 19,
                                color: c.textMuted,
                                align: 'center',
                            }),
                        ],
                    }),
                    Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'on-chip SRAM',
                                fontSize: 22,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            streamedTile,
                            TextLabel({
                                c,
                                text: 'same tile, active now',
                                fontSize: 19,
                                color: c.textMuted,
                                align: 'center',
                            }),
                        ],
                    }),
                ],
            }),
            Column({
                gap: 10,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Query row and running state stay on chip',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                    Row({
                        gap: 6,
                        align: 'center',
                        justify: 'center',
                        children: [
                            state('before tile 2', ['1000', '1', '2']),
                            Column({
                                gap: 5,
                                align: 'center',
                                children: [
                                    FlowArrow({
                                        direction: 'right',
                                        c,
                                        tone: 'warm',
                                        length: 24,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'α=e⁻¹',
                                        fontSize: 19,
                                        mono: true,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                        align: 'center',
                                    }),
                                ],
                            }),
                            state('after tile 2', ['1001', '1.5032', '2.2771']),
                        ],
                    }),
                    FlowArrow({ direction: 'down', c, tone: 'green', length: 18 }),
                    TextLabel({
                        c,
                        text: 'Oᵢ = u / ℓ = 1.51482',
                        fontSize: 23,
                        mono: true,
                        fontWeight: 800,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
