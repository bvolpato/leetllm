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
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 650
export const alt =
    'Workspace persistence attack diagram showing how an unmasked repository allows an agent worker to plant an executable .git/hooks/post-checkout script that survives exit and runs under the host account on later checkout, whereas read-only Git metadata blocks the write and preserves trusted hooks.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.85)
    const stepBox = (title: string, detail: string, tone: 'red' | 'warm' | 'green') =>
        Panel({
            c,
            title,
            tone,
            width: 184,
            padding: 8,
            titleFontSize: 20,
            children: TextLabel({ c, text: detail, fontSize: 20, mono: true }),
        })

    return Scene({
        c,
        title: 'Repository Persistence via .git/hooks vs. Read-Only Guard',
        padding: 16,
        gap: 12,
        contentWidth: 648,
        children: [
            Panel({
                c,
                title: 'Attack Track · Writable .git/ Directory',
                tone: 'red',
                width: 648,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        Row({
                            gap: 6,
                            align: 'stretch',
                            children: [
                                stepBox('1. Plant Hook', 'post-checkout +x', 'red'),
                                FlowArrow({ c, direction: 'right', tone: 'warm', length: 18 }),
                                stepBox('2. Diff Blind', 'hidden in .git/', 'warm'),
                                FlowArrow({ c, direction: 'right', tone: 'red', length: 18 }),
                                stepBox('3. Host Runs', 'shell exploit', 'red'),
                            ],
                        }),
                        BadgePill({
                            c,
                            text: 'Host git checkout executes worker payload outside sandbox',
                            tone: 'red',
                            fontSize: 20,
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: 'Defense Track · Read-Only .git/ & Dotfiles Mount',
                tone: 'green',
                width: 648,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        Row({
                            gap: 6,
                            align: 'stretch',
                            children: [
                                stepBox('1. Hook Write', '.git/hooks/**', 'warm'),
                                FlowArrow({ c, direction: 'right', tone: 'green', length: 18 }),
                                stepBox('2. Kernel Deny', 'EROFS / EPERM', 'green'),
                                FlowArrow({ c, direction: 'right', tone: 'green', length: 18 }),
                                stepBox('3. Host Safe', 'src/ diff only', 'green'),
                            ],
                        }),
                        BadgePill({
                            c,
                            text: 'Hooks untouched; inspect existing .git/ before host checkout',
                            tone: 'green',
                            fontSize: 20,
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
