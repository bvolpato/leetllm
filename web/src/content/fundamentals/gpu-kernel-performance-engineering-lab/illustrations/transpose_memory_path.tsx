import {
    BadgePill,
    Column,
    FlowArrow,
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
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 920
export const height = 740
export const alt =
    'Comparison of global memory access at N=4096 for one aligned 32-lane warp. Reading row 0 of A loads 32 adjacent floats across four 32-byte sectors (100% coverage). A naive write to column 0 scatters lanes across 4,096-word (16 KiB) strides touching 32 sectors (12.5% coverage), while a shared-tile transpose swaps tile[ty][tx] to tile[tx][ty] so output writes touch four sectors again.'

const laneTones: ToneName[] = ['blue', 'cyan', 'purple', 'green']

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.75)

    const sectorGrid = Grid({
        c,
        rows: Array.from({ length: 4 }, (_, s) =>
            Array.from({ length: 8 }, (_, w) => ({ label: String(s * 8 + w), tone: laneTones[s] })),
        ),
        cellWidth: 40,
        cellHeight: 34,
        gap: 3,
        radius: 6,
        fontSize: 28,
    })

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
                    title: '1. Input Read: Row 0 (N = 4,096 · Adjacent Lanes)',
                    tone: 'blue',
                    width: 888,
                    padding: 14,
                    gap: 10,
                    titleFontSize: 31,
                    children: Row({
                        gap: 12,
                        align: 'center',
                        justify: 'center',
                        children: [
                            Column({
                                gap: 4,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Input A',
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }),
                                    TiledMatrix({
                                        c,
                                        rows: 4,
                                        cols: 4,
                                        cellSize: 24,
                                        gap: 3,
                                        regions: [
                                            {
                                                rowStart: 0,
                                                rowEnd: 1,
                                                colStart: 0,
                                                colEnd: 4,
                                                tone: 'blue',
                                            },
                                        ],
                                    }),
                                ],
                            }),
                            FlowArrow({ c, direction: 'right', length: 34, tone: 'blue' }),
                            sectorGrid,
                            Column({
                                gap: 8,
                                align: 'start',
                                children: [
                                    BadgePill({
                                        c,
                                        text: '4 sectors (128 B)',
                                        tone: 'blue',
                                        fontSize: 28,
                                        height: 42,
                                        padding: '4px 10px',
                                    }),
                                    TextLabel({
                                        c,
                                        text: '8 words / sector',
                                        fontSize: 28,
                                        fontWeight: 600,
                                        color: getReadableToneColor('green', c),
                                        align: 'left',
                                    }),
                                    TextLabel({
                                        c,
                                        text: '100% useful',
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: getReadableToneColor('green', c),
                                        align: 'left',
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: '2a. Naive Store',
                            subtitle: 'B[4,096 * i] · 16 KiB stride',
                            tone: 'critical',
                            width: 437,
                            padding: 14,
                            gap: 10,
                            titleFontSize: 30,
                            children: [
                                Row({
                                    gap: 12,
                                    align: 'center',
                                    justify: 'center',
                                    children: [
                                        TiledMatrix({
                                            c,
                                            rows: 4,
                                            cols: 4,
                                            cellSize: 24,
                                            gap: 3,
                                            regions: [
                                                {
                                                    rowStart: 0,
                                                    rowEnd: 4,
                                                    colStart: 0,
                                                    colEnd: 1,
                                                    tone: 'critical',
                                                },
                                            ],
                                        }),
                                        Column({
                                            gap: 6,
                                            align: 'start',
                                            children: [
                                                TextLabel({
                                                    c,
                                                    text: 'Output col 0',
                                                    fontSize: 28,
                                                    fontWeight: 700,
                                                    color: c.textPrimary,
                                                    align: 'left',
                                                }),
                                                TextLabel({
                                                    c,
                                                    text: 'S0, S512, ..., S15872',
                                                    fontSize: 28,
                                                    color: getReadableToneColor('critical', c),
                                                    align: 'left',
                                                }),
                                                TextLabel({
                                                    c,
                                                    text: '32 sectors (1,024 B)',
                                                    fontSize: 28,
                                                    fontWeight: 600,
                                                    color: getReadableToneColor('critical', c),
                                                    align: 'left',
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                BadgePill({
                                    c,
                                    text: '128 B / 1,024 B = 12.5%',
                                    tone: 'critical',
                                    fontSize: 28,
                                    height: 42,
                                    padding: '4px 12px',
                                }),
                            ],
                        }),
                        Panel({
                            c,
                            title: '2b. Shared-Tile Store',
                            subtitle: 'Swap axes in shared memory',
                            tone: 'green',
                            width: 437,
                            padding: 14,
                            gap: 10,
                            titleFontSize: 30,
                            children: [
                                Row({
                                    gap: 10,
                                    align: 'center',
                                    justify: 'center',
                                    children: [
                                        BadgePill({
                                            c,
                                            text: 'tile[ty][tx]',
                                            tone: 'blue',
                                            fontSize: 28,
                                            height: 40,
                                            padding: '2px 10px',
                                        }),
                                        FlowArrow({
                                            c,
                                            direction: 'right',
                                            length: 28,
                                            tone: 'green',
                                        }),
                                        BadgePill({
                                            c,
                                            text: 'tile[tx][ty]',
                                            tone: 'green',
                                            fontSize: 28,
                                            height: 40,
                                            padding: '2px 10px',
                                        }),
                                    ],
                                }),
                                Row({
                                    gap: 14,
                                    align: 'center',
                                    justify: 'center',
                                    children: [
                                        TiledMatrix({
                                            c,
                                            rows: 4,
                                            cols: 4,
                                            cellSize: 24,
                                            gap: 3,
                                            regions: [
                                                {
                                                    rowStart: 0,
                                                    rowEnd: 1,
                                                    colStart: 0,
                                                    colEnd: 4,
                                                    tone: 'green',
                                                },
                                            ],
                                        }),
                                        Column({
                                            gap: 4,
                                            align: 'start',
                                            children: [
                                                TextLabel({
                                                    c,
                                                    text: 'Output row 0',
                                                    fontSize: 28,
                                                    fontWeight: 700,
                                                    color: c.textPrimary,
                                                    align: 'left',
                                                }),
                                                TextLabel({
                                                    c,
                                                    text: '4 sectors (128 B)',
                                                    fontSize: 28,
                                                    fontWeight: 600,
                                                    color: getReadableToneColor('green', c),
                                                    align: 'left',
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                BadgePill({
                                    c,
                                    text: '128 B / 128 B = 100%',
                                    tone: 'green',
                                    fontSize: 28,
                                    height: 42,
                                    padding: '4px 12px',
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
