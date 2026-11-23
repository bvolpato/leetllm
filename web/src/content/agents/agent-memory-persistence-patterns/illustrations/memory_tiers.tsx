import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 640
export const height = 660
export const alt =
    'External episodic logs, semantic facts, and procedural skills pass through access and TTL filtering into the prompt window, while the inference KV cache reuses matching prompt prefixes and host policy checks execution separately.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'External Storage, Prompt Window, and KV Cache',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Panel({
                c,
                title: '1. External Retained Storage (Persistent)',
                tone: 'neutral',
                width: 608,
                padding: 12,
                titleFontSize: 21,
                children: Row({
                    gap: 10,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Episodic Log',
                            tone: 'cyan',
                            width: 188,
                            padding: 10,
                            titleFontSize: 20,
                            children: Column({
                                gap: 6,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'run-41 trace',
                                        fontSize: 19,
                                        mono: true,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'fp16 NaN (seq 4k)',
                                        fontSize: 19,
                                        color: c.textMuted,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Semantic Facts',
                            tone: 'blue',
                            width: 188,
                            padding: 10,
                            titleFontSize: 20,
                            children: Column({
                                gap: 6,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'pytest -q attn.py',
                                        fontSize: 19,
                                        mono: true,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'owner: ml-kernels',
                                        fontSize: 19,
                                        color: c.textMuted,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Procedural Skill',
                            tone: 'purple',
                            width: 188,
                            padding: 10,
                            titleFontSize: 20,
                            children: Column({
                                gap: 6,
                                children: [
                                    TextLabel({ c, text: 'Repro & patch loop', fontSize: 19 }),
                                    TextLabel({
                                        c,
                                        text: 'Run kernel CI tests',
                                        fontSize: 19,
                                        color: c.textMuted,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            }),
            Row({
                gap: 12,
                justify: 'center',
                align: 'center',
                children: [
                    FlowArrow({ c, direction: 'down', length: 24, tone: 'blue' }),
                    BadgePill({
                        c,
                        text: 'Filter by repo ACL, version, and TTL',
                        tone: 'blue',
                        fontSize: 19,
                    }),
                ],
            }),
            Panel({
                c,
                title: '2. Next Model Call & Execution Split',
                tone: 'blue',
                width: 608,
                padding: 12,
                titleFontSize: 21,
                children: Column({
                    gap: 10,
                    children: [
                        Row({
                            gap: 12,
                            align: 'stretch',
                            children: [
                                Panel({
                                    c,
                                    title: 'Assembled Prompt',
                                    tone: 'blue',
                                    width: 312,
                                    padding: 10,
                                    titleFontSize: 20,
                                    children: Column({
                                        gap: 6,
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'Pinned repo + branch + goal',
                                                fontSize: 19,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'Filtered recall + recent turns',
                                                fontSize: 19,
                                                color: c.textMuted,
                                            }),
                                        ],
                                    }),
                                }),
                                Panel({
                                    c,
                                    title: 'KV Prefix Cache',
                                    tone: 'neutral',
                                    width: 260,
                                    padding: 10,
                                    titleFontSize: 20,
                                    children: Column({
                                        gap: 6,
                                        children: [
                                            TextLabel({
                                                c,
                                                text: 'Reuses prefix tensor K/V',
                                                fontSize: 19,
                                            }),
                                            TextLabel({
                                                c,
                                                text: 'Not searchable storage',
                                                fontSize: 19,
                                                color: c.textMuted,
                                            }),
                                        ],
                                    }),
                                }),
                            ],
                        }),
                        Row({
                            gap: 10,
                            justify: 'center',
                            align: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: 'Host Policy API',
                                    tone: 'warm',
                                    fontSize: 19,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Checks live branch and merge rules',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                    ],
                }),
            }),
        ],
    })
}

export default create('dark')
