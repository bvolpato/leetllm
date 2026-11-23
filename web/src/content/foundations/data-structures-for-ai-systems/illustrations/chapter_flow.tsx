import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 760
export const height = 520
export const preset = 'engineering'
export const alt =
    'Query-time comparison for red fox. A linear list scan sequentially checks every document in memory, reading doc 1 for zero matches. An inverted index jumps from query terms directly to posting sets {doc 0, doc 2} and {doc 2}, bypassing doc 1 completely.'

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)

    return Scene({
        c,
        padding: 16,
        contentWidth: 728,
        gap: 10,
        children: Column({
            gap: 10,
            width: 728,
            children: [
                TextLabel({
                    c,
                    text: 'Query "red fox": linear scan vs inverted index',
                    fontSize: 25,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: '1. Linear scan · O(N·L)',
                            titleFontSize: 23,
                            width: 357,
                            padding: 14,
                            gap: 12,
                            shadow: false,
                            children: Column({
                                gap: 12,
                                children: [
                                    Row({
                                        gap: 8,
                                        align: 'center',
                                        justify: 'space-between',
                                        width: 325,
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'doc 0: red bird',
                                                fontSize: 23,
                                                color: c.textPrimary,
                                            }),
                                            BadgePill({
                                                c,
                                                text: '1 hit',
                                                tone: 'green',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                        ],
                                    }),
                                    Row({
                                        gap: 8,
                                        align: 'center',
                                        justify: 'space-between',
                                        width: 325,
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'doc 1: blue whale',
                                                fontSize: 23,
                                                color: warm,
                                            }),
                                            BadgePill({
                                                c,
                                                text: '0 miss',
                                                tone: 'warm',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                        ],
                                    }),
                                    Row({
                                        gap: 8,
                                        align: 'center',
                                        justify: 'space-between',
                                        width: 325,
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'doc 2: red fox',
                                                fontSize: 23,
                                                color: c.textPrimary,
                                            }),
                                            BadgePill({
                                                c,
                                                text: '2 hits',
                                                tone: 'green',
                                                fontSize: 23,
                                                height: 34,
                                                filled: true,
                                            }),
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Reads all docs (wasted work on doc 1)',
                                        fontSize: 23,
                                        fontWeight: 650,
                                        color: warm,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: '2. Inverted index · O(postings)',
                            titleFontSize: 23,
                            width: 357,
                            padding: 14,
                            gap: 10,
                            shadow: false,
                            children: Column({
                                gap: 8,
                                children: [
                                    Row({
                                        gap: 8,
                                        align: 'center',
                                        justify: 'space-between',
                                        width: 325,
                                        children: [
                                            BadgePill({
                                                c,
                                                text: '"red"',
                                                tone: 'blue',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            TextLabel({
                                                c,
                                                text: '→ {doc 0, doc 2}',
                                                fontSize: 23,
                                                fontWeight: 650,
                                                color: blue,
                                            }),
                                        ],
                                    }),
                                    Row({
                                        gap: 8,
                                        align: 'center',
                                        justify: 'space-between',
                                        width: 325,
                                        children: [
                                            BadgePill({
                                                c,
                                                text: '"fox"',
                                                tone: 'blue',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            TextLabel({
                                                c,
                                                text: '→ {doc 2}',
                                                fontSize: 23,
                                                fontWeight: 650,
                                                color: blue,
                                            }),
                                        ],
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 16, color: green }),
                                    TextLabel({
                                        c,
                                        text: 'Score hits → [doc 2 (2), doc 0 (1)]',
                                        fontSize: 23,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Doc 1 skipped completely',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: green,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
