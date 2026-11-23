import React from 'react'
import {
    Column,
    FlowArrow,
    Icon,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { IconName, ThemeColors, ToneName } from 'vizmatic'

export const width = 760
export const height = 520
export const preset = 'engineering'
export const alt =
    'Committed eval data, scorer, and setup scripts travel unchanged from the original checkout into a fresh git clone. Each side keeps its own local virtual environment and installed hook while secrets stay uncloned, and running repro.sh prints 0.667 (2/3) on the shared host.'

type FileEntry = { title: string; detail: string; icon: IconName; tone: ToneName }

const committedFiles: FileEntry[] = [
    { title: 'eval_cases.jsonl', detail: '3 labeled prompts', icon: 'file', tone: 'purple' },
    { title: 'score_eval.py', detail: 'Compare labels', icon: 'code', tone: 'blue' },
    { title: 'Setup + scripts', detail: 'env + hook source', icon: 'terminal', tone: 'cyan' },
]

function fileRow(c: ThemeColors, entry: FileEntry) {
    const color = getReadableToneColor(entry.tone, c, c.bgCard)
    return Row({
        gap: 10,
        align: 'center',
        height: 52,
        children: [
            Icon({ c, name: entry.icon, color, size: 26, strokeWidth: 1.8 }),
            Column({
                gap: 2,
                width: 242,
                align: 'start',
                children: [
                    TextLabel({
                        c,
                        text: entry.title,
                        fontSize: 23,
                        fontWeight: 700,
                        color,
                        align: 'left',
                    }),
                    TextLabel({
                        c,
                        text: entry.detail,
                        fontSize: 23,
                        color: c.textSecondary,
                        align: 'left',
                    }),
                ],
            }),
        ],
    })
}

function repoCard(c: ThemeColors, heading: string, title: string, tone: ToneName) {
    return Column({
        gap: 6,
        width: 304,
        children: [
            TextLabel({ c, text: heading, fontSize: 23, fontWeight: 700, color: c.textPrimary }),
            Panel({
                c,
                title,
                titleFontSize: 23,
                width: 304,
                height: 242,
                padding: 12,
                gap: 10,
                radius: 12,
                shadow: false,
                tone,
                accentWidth: 3,
                children: Column({
                    gap: 8,
                    children: committedFiles.map((entry) => fileRow(c, entry)),
                }),
            }),
        ],
    })
}

function localBadge(c: ThemeColors, label: string, icon: IconName, color: string) {
    return Column({
        gap: 4,
        width: 88,
        align: 'center',
        children: [
            Icon({ c, name: icon, color, size: 26, strokeWidth: 1.8 }),
            TextLabel({ c, text: label, fontSize: 23, color, align: 'center', mono: true }),
        ],
    })
}

function localBox(c: ThemeColors, rebuilt: boolean) {
    const color = rebuilt ? getReadableToneColor('green', c) : c.textSecondary
    const caption = rebuilt ? 'Rebuilt via setup scripts' : 'Stays on original'
    return Column({
        gap: 6,
        width: 304,
        children: [
            TextLabel({ c, text: caption, fontSize: 23, fontWeight: 600, color }),
            Row({
                gap: 4,
                align: 'center',
                justify: 'space-around',
                width: 304,
                height: 72,
                style: {
                    border: `1.5px dashed ${rebuilt ? color : c.borderLight}`,
                    borderRadius: 12,
                },
                children: [
                    localBadge(c, '.venv/', 'container', color),
                    localBadge(c, 'hook', 'tool', color),
                    ...(!rebuilt ? [localBadge(c, '.env', 'lock', color)] : []),
                ],
            }),
        ],
    })
}

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)
    return Scene({
        c,
        padding: 16,
        contentWidth: 728,
        gap: 8,
        children: Column({
            gap: 8,
            width: 728,
            children: [
                Row({
                    gap: 8,
                    align: 'center',
                    children: [
                        repoCard(c, 'Original checkout', 'Committed to Git', 'purple'),
                        Column({
                            gap: 6,
                            width: 104,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'git clone',
                                    fontSize: 23,
                                    fontWeight: 700,
                                    color: blue,
                                    align: 'center',
                                }),
                                FlowArrow({ c, direction: 'right', color: blue, length: 88 }),
                            ],
                        }),
                        repoCard(c, 'Fresh clone', 'Received via clone', 'cyan'),
                    ],
                }),
                Row({
                    gap: 8,
                    align: 'center',
                    children: [
                        Row({ width: 304, height: 24, children: [] }),
                        Row({ width: 104, height: 24, children: [] }),
                        Row({
                            width: 304,
                            height: 24,
                            justify: 'center',
                            align: 'center',
                            children: FlowArrow({ c, direction: 'down', color: cyan, length: 22 }),
                        }),
                    ],
                }),
                Row({
                    gap: 8,
                    align: 'start',
                    children: [
                        localBox(c, false),
                        Row({ width: 104, height: 1, children: [] }),
                        localBox(c, true),
                    ],
                }),
                Row({
                    gap: 12,
                    align: 'center',
                    justify: 'space-between',
                    width: 728,
                    style: { borderTop: `1px solid ${c.border}`, paddingTop: 10 },
                    children: [
                        TextLabel({
                            c,
                            text: './repro.sh',
                            fontSize: 23,
                            fontWeight: 700,
                            color: c.textPrimary,
                            mono: true,
                        }),
                        Row({
                            gap: 8,
                            align: 'center',
                            children: [
                                Icon({
                                    c,
                                    name: 'check',
                                    color: green,
                                    size: 24,
                                    strokeWidth: 2.3,
                                }),
                                Icon({
                                    c,
                                    name: 'warning',
                                    color: red,
                                    size: 24,
                                    strokeWidth: 2.0,
                                }),
                                Icon({
                                    c,
                                    name: 'check',
                                    color: green,
                                    size: 24,
                                    strokeWidth: 2.3,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: '0.667',
                            fontSize: 32,
                            fontWeight: 700,
                            color: green,
                        }),
                        TextLabel({
                            c,
                            text: '2/3 match · exit 0',
                            fontSize: 23,
                            color: c.textSecondary,
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
