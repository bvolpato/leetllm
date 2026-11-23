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
export const height = 600
export const alt =
    'Eight raw dialogue turns fold into two level-0 summaries of four turns each, then combine into a level-1 summary while retaining source turn pointers for drill-down.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Progressive Summarization with Source Pointers',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Panel({
                c,
                title: 'Raw Episode Turns (8 stored chunks)',
                tone: 'neutral',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Row({
                    gap: 8,
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'T1-T2 crash',
                            tone: 'cyan',
                            fontSize: 19,
                        }),
                        BadgePill({
                            c,
                            text: 'T3-T4 mask',
                            tone: 'cyan',
                            fontSize: 19,
                        }),
                        BadgePill({
                            c,
                            text: 'T5-T6 fp32',
                            tone: 'blue',
                            fontSize: 19,
                        }),
                        BadgePill({
                            c,
                            text: 'T7-T8 bench',
                            tone: 'blue',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
            FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
            Row({
                gap: 12,
                align: 'stretch',
                children: [
                    Panel({
                        c,
                        title: 'Level-0 Summary A',
                        tone: 'cyan',
                        width: 298,
                        padding: 12,
                        titleFontSize: 20,
                        children: Column({
                            gap: 6,
                            children: [
                                TextLabel({
                                    c,
                                    text: 'fp16 overflow at seq > 4k',
                                    fontSize: 19,
                                }),
                                TextLabel({
                                    c,
                                    text: 'src: [t1, t2, t3, t4]',
                                    fontSize: 19,
                                    mono: true,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Level-0 Summary B',
                        tone: 'blue',
                        width: 298,
                        padding: 12,
                        titleFontSize: 20,
                        children: Column({
                            gap: 6,
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Upcast softmax, 14/14 pass',
                                    fontSize: 19,
                                }),
                                TextLabel({
                                    c,
                                    text: 'src: [t5, t6, t7, t8]',
                                    fontSize: 19,
                                    mono: true,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                ],
            }),
            FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
            Panel({
                c,
                title: 'Level-1 Session Summary',
                tone: 'purple',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 6,
                    children: [
                        TextLabel({
                            c,
                            text: 'Attention kernel overflow fixed via fp32 accumulation',
                            fontSize: 19,
                        }),
                        TextLabel({
                            c,
                            text: 'Follow source IDs when exact diff lines or scores matter',
                            fontSize: 19,
                            color: c.textMuted,
                        }),
                    ],
                }),
            }),
        ],
    })
}

export default create('dark')
