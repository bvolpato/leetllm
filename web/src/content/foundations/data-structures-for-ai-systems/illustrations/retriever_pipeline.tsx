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
    'A top-two min-heap retriever pipeline. Candidate doc 3 arrives with score 2, key (2, -3) and outscores root doc 0 key (1, 0). Doc 0 is evicted, doc 3 enters the heap at the root because (-3) is smaller than doc 2 (-2), and the retriever yields descending top-2 results: doc 2 first, then doc 3.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

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
                    text: 'Top-2 min-heap: evict weakest root, tie-break by ID',
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
                            title: '1. Root check on doc 3',
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
                                                text: 'Root',
                                                tone: 'warm',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'doc 0 · (1, 0)',
                                                fontSize: 23,
                                                color: warm,
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
                                                text: 'Leaf',
                                                tone: 'blue',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'doc 2 · (2, −2)',
                                                fontSize: 23,
                                                color: blue,
                                            }),
                                        ],
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 16, color: green }),
                                    TextLabel({
                                        c,
                                        text: 'In: doc 3 · key (2, −3)',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: green,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '(2, −3) > (1, 0) → evict doc 0',
                                        fontSize: 23,
                                        color: green,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: '2. Updated heap & output',
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
                                                text: 'New root',
                                                tone: 'green',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'doc 3 · (2, −3)',
                                                fontSize: 23,
                                                color: green,
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
                                                text: 'Leaf',
                                                tone: 'blue',
                                                fontSize: 23,
                                                height: 34,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'doc 2 · (2, −2)',
                                                fontSize: 23,
                                                color: blue,
                                            }),
                                        ],
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 16, color: blue }),
                                    TextLabel({
                                        c,
                                        text: 'Sort descending:',
                                        fontSize: 23,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Top 2 → [doc 2, doc 3]',
                                        fontSize: 23,
                                        fontWeight: 700,
                                        color: blue,
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
