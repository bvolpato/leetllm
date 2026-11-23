import React from 'react'
import {
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 680
export const alt =
    'Exact per-MoE-layer expert pools: Mixtral 8x7B stores 8 routed experts and selects 2 per token (~46.7B total, ~12.9B active). DeepSeek-V2 stores 160 finer routed experts, selects 6, and always executes 2 shared experts (236B total, 21B active). Cell counts are exact while tile areas are schematic.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Mixtral 8x7B: 2 of 8 routed (~46.7B / ~12.9B active)',
                    titleFontSize: 20,
                    width: 572,
                    padding: 14,
                    children: TiledMatrix({
                        c: cd,
                        rows: 2,
                        cols: 4,
                        cellSize: 32,
                        gap: 6,
                        tone: 'neutral',
                        muted: true,
                        title: '8 routed SwiGLU experts (2 active per token)',
                        regions: [{ rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 2, tone: 'blue' }],
                    }),
                }),
                Panel({
                    c: cd,
                    title: 'DeepSeek-V2: 6 of 160 routed + 2 shared (236B / 21B)',
                    titleFontSize: 20,
                    width: 572,
                    padding: 14,
                    gap: 8,
                    children: [
                        Row({
                            gap: 20,
                            align: 'center',
                            children: [
                                TiledMatrix({
                                    c: cd,
                                    rows: 10,
                                    cols: 16,
                                    cellSize: 16,
                                    gap: 2,
                                    tone: 'neutral',
                                    muted: true,
                                    title: '160 fine routed (6 active)',
                                    regions: [
                                        {
                                            rowStart: 0,
                                            rowEnd: 1,
                                            colStart: 0,
                                            colEnd: 6,
                                            tone: 'blue',
                                        },
                                    ],
                                }),
                                TiledMatrix({
                                    c: cd,
                                    rows: 2,
                                    cols: 1,
                                    cellSize: 32,
                                    gap: 6,
                                    tone: 'purple',
                                    title: '2 shared',
                                    subtitle: 'always on',
                                    regions: [
                                        {
                                            rowStart: 0,
                                            rowEnd: 2,
                                            colStart: 0,
                                            colEnd: 1,
                                            tone: 'purple',
                                        },
                                    ],
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'First DeepSeek-V2 FFN is dense. Cell counts are exact; areas are schematic.',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
