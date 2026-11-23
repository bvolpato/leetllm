import React from 'react'
import {
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const alt =
    'Four stages of BPE merging on rain (3), rainy (2), and rail (2). Weighted positions fall from 30 to 23 after merging r+a (count 7), to 16 after ra+i (count 7), and to 11 after rai+n (count 5).'

export const width = 640
export const height = 740
export const autoSize = false

interface Stage {
    label: string
    positions: number
    tone: ToneName
    words: string[]
    mergeNote?: string
}

const STAGES: Stage[] = [
    {
        label: 'Start · 30 positions',
        positions: 30,
        tone: 'purple',
        words: ['r a i n ×3', 'r a i n y ×2', 'r a i l ×2'],
    },
    {
        label: 'Merge 1 · 23 positions',
        positions: 23,
        tone: 'blue',
        mergeNote: 'r + a -> ra (count 7, first-seen tie)',
        words: ['ra i n ×3', 'ra i n y ×2', 'ra i l ×2'],
    },
    {
        label: 'Merge 2 · 16 positions',
        positions: 16,
        tone: 'cyan',
        mergeNote: 'ra + i -> rai (count 7)',
        words: ['rai n ×3', 'rai n y ×2', 'rai l ×2'],
    },
    {
        label: 'Merge 3 · 11 positions',
        positions: 11,
        tone: 'green',
        mergeNote: 'rai + n -> rain (count 5)',
        words: ['rain ×3', 'rain y ×2', 'rai l ×2'],
    },
]

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        contentWidth: 592,
        padding: 24,
        gap: 12,
        children: Column({
            width: 592,
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'BPE merges on rain ×3, rainy ×2, rail ×2',
                    width: 592,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Recount adjacent pairs after each merge; weighted positions fall 30 -> 11',
                    width: 592,
                    fontSize: 19,
                    align: 'center',
                    color: c.textSecondary,
                }),
                ...STAGES.flatMap((stage, index) => {
                    const color = getReadableToneColor(stage.tone, c)
                    const blocks: React.ReactElement[] = []
                    if (index > 0 && stage.mergeNote) {
                        blocks.push(
                            Row({
                                width: 592,
                                gap: 10,
                                justify: 'center',
                                align: 'center',
                                children: [
                                    FlowArrow({
                                        c,
                                        direction: 'down',
                                        length: 20,
                                        tone: stage.tone,
                                    }),
                                    TextLabel({
                                        c,
                                        text: stage.mergeNote,
                                        fontSize: 19,
                                        fontWeight: 700,
                                        color,
                                    }),
                                ],
                            }),
                        )
                    }
                    blocks.push(
                        Panel({
                            c,
                            title: stage.label,
                            titleFontSize: 19,
                            width: 592,
                            padding: 12,
                            radius: 8,
                            tone: stage.tone,
                            children: Row({
                                width: 568,
                                gap: 10,
                                justify: 'start',
                                children: stage.words.map((word) =>
                                    React.createElement(
                                        'div',
                                        {
                                            key: word,
                                            style: {
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                border: `1.5px solid ${color}`,
                                                backgroundColor: getToneFill(stage.tone, c),
                                                color: c.textPrimary,
                                                fontFamily: c.fontMono,
                                                fontSize: 19,
                                                fontWeight: 650,
                                            },
                                        },
                                        word,
                                    ),
                                ),
                            }),
                        }),
                    )
                    return blocks
                }),
            ],
        }),
    })
}

export default create('dark')
