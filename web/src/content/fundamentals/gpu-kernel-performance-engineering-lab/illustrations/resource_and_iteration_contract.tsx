import {
    BadgePill,
    Column,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 920
export const height = 680
export const alt =
    'Comparison of the fixed baseline against three single-variable optimization branches. The baseline pairs a 32x8 block (256 threads, 8 warps), a 32x32 shared tile (4,096 B), and loop offsets 0, 8, 16, and 24. Branch A pads the tile to 32x33 (4,224 B, +128 B). Branch B applies #pragma unroll across the four offsets. Branch C doubles the block to 32x16 (512 threads, 16 warps).'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.75)

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: 888,
        children: Column({
            gap: 12,
            children: [
                Panel({
                    c,
                    title: 'Baseline: Change One Mechanism per Trial',
                    tone: 'blue',
                    width: 888,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 31,
                    children: Row({
                        gap: 18,
                        align: 'center',
                        justify: 'space-between',
                        children: [
                            Column({
                                gap: 6,
                                align: 'center',
                                width: 300,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Block 32 x 8',
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }),
                                    TiledMatrix({
                                        c,
                                        rows: 8,
                                        cols: 32,
                                        cellSize: 6,
                                        gap: 1,
                                        regions: [
                                            {
                                                rowStart: 0,
                                                rowEnd: 8,
                                                colStart: 0,
                                                colEnd: 32,
                                                tone: 'cyan',
                                            },
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: '256 threads · 8 warps',
                                        fontSize: 28,
                                        color: getReadableToneColor('cyan', c),
                                    }),
                                ],
                            }),
                            Column({
                                gap: 6,
                                align: 'center',
                                width: 220,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Shared 32 x 32',
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }),
                                    TiledMatrix({
                                        c,
                                        rows: 8,
                                        cols: 8,
                                        cellSize: 10,
                                        gap: 2,
                                        regions: [
                                            {
                                                rowStart: 0,
                                                rowEnd: 8,
                                                colStart: 0,
                                                colEnd: 8,
                                                tone: 'blue',
                                            },
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: '4,096 B / block',
                                        fontSize: 28,
                                        color: getReadableToneColor('blue', c),
                                    }),
                                ],
                            }),
                            Column({
                                gap: 6,
                                align: 'center',
                                width: 260,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Loop Offsets',
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }),
                                    Grid({
                                        c,
                                        rows: [['0', '8', '16', '24']],
                                        cellWidth: 54,
                                        cellHeight: 40,
                                        gap: 4,
                                        fontSize: 28,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'kTile=32 · step 8',
                                        fontSize: 28,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'A. Pad (+1 col)',
                            tone: 'green',
                            width: 288,
                            padding: 12,
                            gap: 10,
                            titleFontSize: 29,
                            children: [
                                TiledMatrix({
                                    c,
                                    rows: 1,
                                    cols: 33,
                                    cellSize: 6,
                                    gap: 1,
                                    regions: [
                                        {
                                            rowStart: 0,
                                            rowEnd: 1,
                                            colStart: 0,
                                            colEnd: 32,
                                            tone: 'green',
                                        },
                                        {
                                            rowStart: 0,
                                            rowEnd: 1,
                                            colStart: 32,
                                            colEnd: 33,
                                            tone: 'warm',
                                        },
                                    ],
                                }),
                                BadgePill({
                                    c,
                                    text: 'tile[32][33]',
                                    tone: 'green',
                                    fontSize: 28,
                                    height: 40,
                                    padding: '2px 10px',
                                }),
                                TextLabel({
                                    c,
                                    text: '4,224 B (+128 B)',
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: getReadableToneColor('green', c),
                                }),
                                TextLabel({
                                    c,
                                    text: '256 threads fixed',
                                    fontSize: 28,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                        Panel({
                            c,
                            title: 'B. Loop Unroll',
                            tone: 'purple',
                            width: 288,
                            padding: 12,
                            gap: 10,
                            titleFontSize: 29,
                            children: [
                                Grid({
                                    c,
                                    rows: [
                                        ['+0', '+8'],
                                        ['+16', '+24'],
                                    ],
                                    cellWidth: 96,
                                    cellHeight: 38,
                                    gap: 5,
                                    fontSize: 28,
                                }),
                                BadgePill({
                                    c,
                                    text: '#pragma unroll',
                                    tone: 'purple',
                                    fontSize: 28,
                                    height: 40,
                                    padding: '2px 10px',
                                }),
                                TextLabel({
                                    c,
                                    text: '4 unrolled steps',
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: getReadableToneColor('purple', c),
                                }),
                                TextLabel({
                                    c,
                                    text: 'Check SASS & spills',
                                    fontSize: 28,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                        Panel({
                            c,
                            title: 'C. Block 32 x 16',
                            tone: 'warm',
                            width: 288,
                            padding: 12,
                            gap: 10,
                            titleFontSize: 29,
                            children: [
                                TiledMatrix({
                                    c,
                                    rows: 16,
                                    cols: 32,
                                    cellSize: 5,
                                    gap: 1,
                                    regions: [
                                        {
                                            rowStart: 0,
                                            rowEnd: 8,
                                            colStart: 0,
                                            colEnd: 32,
                                            tone: 'cyan',
                                        },
                                        {
                                            rowStart: 8,
                                            rowEnd: 16,
                                            colStart: 0,
                                            colEnd: 32,
                                            tone: 'warm',
                                        },
                                    ],
                                }),
                                BadgePill({
                                    c,
                                    text: '512 threads',
                                    tone: 'warm',
                                    fontSize: 28,
                                    height: 40,
                                    padding: '2px 10px',
                                }),
                                TextLabel({
                                    c,
                                    text: '16 warps (doubled)',
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: getReadableToneColor('warm', c),
                                }),
                                TextLabel({
                                    c,
                                    text: 'Tile stays 32 x 32',
                                    fontSize: 28,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create()
