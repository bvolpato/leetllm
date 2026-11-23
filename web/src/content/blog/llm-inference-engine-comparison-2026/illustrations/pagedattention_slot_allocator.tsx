import React from 'react'
import {
    BadgePill,
    Column,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 860
export const height = 470
export const alt =
    'Two 18-block memory pools. Fixed six-block reservations for A, B and C leave nine used and nine trapped. On-demand allocation holds A3, B4, C2, D3 and E2, with four blocks free.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 'compact')
    const contentWidth = width - 64
    const panelWidth = Math.floor((contentWidth - 40) / 2)

    return Scene({
        c,
        padding: 32,
        gap: 16,
        contentWidth,
        children: [
            TextLabel({
                c,
                text: 'Same 18-block KV pool, two allocation strategies',
                width: contentWidth,
                fontSize: 22,
                fontWeight: 700,
                color: c.textPrimary,
                align: 'center',
            }),
            Row({
                gap: 40,
                align: 'start',
                children: [
                    Column({
                        gap: 10,
                        align: 'center',
                        width: panelWidth,
                        children: [
                            TiledMatrix({
                                c,
                                rows: 3,
                                cols: 6,
                                cellSize: 52,
                                tone: 'neutral',
                                muted: true,
                                title: 'Fixed: 6 blocks per request',
                                subtitle: '9 live · 9 trapped · D and E wait',
                                ariaLabel:
                                    'Fixed reservations: A uses 3, B uses 4, C uses 2 of 6 reserved blocks each',
                                regions: [
                                    {
                                        rowStart: 0,
                                        rowEnd: 1,
                                        colStart: 0,
                                        colEnd: 3,
                                        tone: 'blue',
                                    },
                                    {
                                        rowStart: 1,
                                        rowEnd: 2,
                                        colStart: 0,
                                        colEnd: 4,
                                        tone: 'purple',
                                    },
                                    {
                                        rowStart: 2,
                                        rowEnd: 3,
                                        colStart: 0,
                                        colEnd: 2,
                                        tone: 'cyan',
                                    },
                                ],
                            }),
                        ],
                    }),
                    Column({
                        gap: 10,
                        align: 'center',
                        width: panelWidth,
                        children: [
                            TiledMatrix({
                                c,
                                rows: 3,
                                cols: 6,
                                cellSize: 52,
                                tone: 'neutral',
                                muted: true,
                                title: 'On demand: blocks as tokens arrive',
                                subtitle: '14 live · 4 free · D and E fit',
                                ariaLabel:
                                    'On-demand blocks: A3, B4, C2, D3, E2 and four free blocks',
                                regions: [
                                    {
                                        rowStart: 0,
                                        rowEnd: 1,
                                        colStart: 0,
                                        colEnd: 3,
                                        tone: 'blue',
                                    },
                                    {
                                        rowStart: 0,
                                        rowEnd: 1,
                                        colStart: 3,
                                        colEnd: 6,
                                        tone: 'purple',
                                    },
                                    {
                                        rowStart: 1,
                                        rowEnd: 2,
                                        colStart: 0,
                                        colEnd: 1,
                                        tone: 'purple',
                                    },
                                    {
                                        rowStart: 1,
                                        rowEnd: 2,
                                        colStart: 1,
                                        colEnd: 3,
                                        tone: 'cyan',
                                    },
                                    {
                                        rowStart: 1,
                                        rowEnd: 2,
                                        colStart: 3,
                                        colEnd: 6,
                                        tone: 'green',
                                    },
                                    {
                                        rowStart: 2,
                                        rowEnd: 3,
                                        colStart: 0,
                                        colEnd: 2,
                                        tone: 'warm',
                                    },
                                ],
                            }),
                        ],
                    }),
                ],
            }),
            Row({
                gap: 10,
                justify: 'center',
                children: [
                    BadgePill({ c, text: 'A', tone: 'blue', width: 64, height: 36, filled: true }),
                    BadgePill({
                        c,
                        text: 'B',
                        tone: 'purple',
                        width: 64,
                        height: 36,
                        filled: true,
                    }),
                    BadgePill({ c, text: 'C', tone: 'cyan', width: 64, height: 36, filled: true }),
                    BadgePill({ c, text: 'D', tone: 'green', width: 64, height: 36, filled: true }),
                    BadgePill({ c, text: 'E', tone: 'warm', width: 64, height: 36, filled: true }),
                    BadgePill({
                        c,
                        text: 'Gray = unused or free',
                        tone: 'neutral',
                        width: 200,
                        height: 36,
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
