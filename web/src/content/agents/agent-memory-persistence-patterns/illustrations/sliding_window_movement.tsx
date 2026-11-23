import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 640
export const height = 600
export const alt =
    'A sliding window with k equals 3 holds turns 3 through 5 verbatim while turns 1 and 2 are compressed into a rolling summary block carrying pinned facts forward.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Sliding Window (k = 3) with Rolling Summary',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Panel({
                c,
                title: 'Turn 3: Raw Buffer Fits Budget (3 of 3 slots)',
                tone: 'neutral',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Row({
                    gap: 10,
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'T1: fp16 NaN',
                            tone: 'purple',
                            fontSize: 19,
                        }),
                        BadgePill({
                            c,
                            text: 'T2: attn.py:84',
                            tone: 'blue',
                            fontSize: 19,
                        }),
                        BadgePill({
                            c,
                            text: 'T3: check scale',
                            tone: 'blue',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
            Row({
                gap: 10,
                justify: 'center',
                align: 'center',
                children: [
                    FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
                    TextLabel({
                        c,
                        text: 'Turns T4 and T5 arrive; T1 and T2 evict',
                        fontSize: 19,
                        color: c.textMuted,
                    }),
                ],
            }),
            Panel({
                c,
                title: 'Turn 5: Evicted Turns Folded Into Summary',
                tone: 'blue',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Row({
                    gap: 12,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Rolling Summary',
                            tone: 'purple',
                            width: 276,
                            padding: 10,
                            titleFontSize: 20,
                            children: Column({
                                gap: 6,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Targets: attention.py:84',
                                        fontSize: 19,
                                        mono: true,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Repro: seq > 4096 in fp16',
                                        fontSize: 19,
                                        color: c.textMuted,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Live Window (k = 3)',
                            tone: 'blue',
                            width: 296,
                            padding: 10,
                            titleFontSize: 20,
                            children: Column({
                                gap: 6,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'T3: check softmax scale',
                                        fontSize: 19,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'T4: cast logits to fp32',
                                        fontSize: 19,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'T5: pytest 14/14 passing',
                                        fontSize: 19,
                                        color: getReadableToneColor('green', c),
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            }),
            Row({
                gap: 10,
                justify: 'center',
                align: 'center',
                children: [
                    BadgePill({
                        c,
                        text: 'Tradeoff',
                        tone: 'warm',
                        fontSize: 19,
                    }),
                    TextLabel({
                        c,
                        text: 'Keep source pointers when compacting history',
                        fontSize: 19,
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
