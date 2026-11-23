import {
    Column,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    getToneColor,
} from 'vizmatic'
import type { ThemeMode as Theme, ToneName } from 'vizmatic'

export const width = 660
export const height = 780
export const alt =
    'For one token, each projected Q, K, and V vector has width 8. Matching color pairs split each stream into four parallel width-2 heads; their four width-2 outputs concatenate to width 8, then W_O maps that result to model width 8.'

const heads: { tone: ToneName }[] = [
    { tone: 'blue' },
    { tone: 'purple' },
    { tone: 'green' },
    { tone: 'warm' },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const dimensionCell = (dimension: number, headIndex: number) => ({
        label: `d_${dimension}`,
        tone: heads[headIndex].tone,
        color: c.textPrimary,
    })
    const spacer = () => TextLabel({ c, text: '', width: 44, fontSize: 1 })
    const headGroupLabels = Row({
        gap: 4,
        align: 'center',
        justify: 'center',
        children: [
            spacer(),
            ...heads.map((head, index) =>
                TextLabel({
                    c,
                    text: `h_${index + 1}`,
                    width: 92,
                    math: true,
                    fontSize: 22,
                    fontWeight: 800,
                    color: getToneColor(head.tone, c),
                    align: 'center',
                }),
            ),
        ],
    })
    const qkv = Grid({
        c,
        rows: ['Q', 'K', 'V'].map((label) => [
            { label, tone: 'neutral' as const, color: c.textPrimary },
            ...Array.from({ length: 8 }, (_, dimension) =>
                dimensionCell(dimension, Math.floor(dimension / 2)),
            ),
        ]),
        cellWidth: 44,
        cellHeight: 36,
        gap: 4,
        radius: 5,
        fontSize: 22,
        math: true,
        headerCols: 1,
    })
    const headLanes = Row({
        gap: 4,
        align: 'center',
        justify: 'center',
        children: [
            spacer(),
            ...heads.map((head, index) =>
                Column({
                    width: 92,
                    gap: 5,
                    align: 'center',
                    children: [
                        FlowArrow({ direction: 'down', c, tone: head.tone, length: 18 }),
                        TextLabel({
                            c,
                            text: `h_${index + 1} ∈ R^2`,
                            math: true,
                            fontSize: 22,
                            fontWeight: 800,
                            color: getToneColor(head.tone, c),
                            align: 'center',
                        }),
                        Grid({
                            c,
                            rows: [
                                [
                                    { label: 'z_1', tone: head.tone, color: c.textPrimary },
                                    { label: 'z_2', tone: head.tone, color: c.textPrimary },
                                ],
                            ],
                            cellWidth: 36,
                            cellHeight: 36,
                            gap: 3,
                            radius: 4,
                            fontSize: 22,
                            math: true,
                        }),
                    ],
                }),
            ),
        ],
    })
    const concatenated = Grid({
        c,
        rows: [
            Array.from({ length: 8 }, (_, dimension) =>
                dimensionCell(dimension, Math.floor(dimension / 2)),
            ),
        ],
        cellWidth: 36,
        cellHeight: 34,
        gap: 4,
        radius: 4,
        fontSize: 22,
        math: true,
    })
    const attentionOutput = Grid({
        c,
        rows: [
            Array.from({ length: 8 }, (_, dimension) => ({
                label: `d_${dimension}`,
                tone: 'neutral' as const,
                color: c.textPrimary,
            })),
        ],
        cellWidth: 36,
        cellHeight: 34,
        gap: 4,
        radius: 4,
        fontSize: 22,
        math: true,
    })

    return Scene({
        c,
        contentWidth: 640,
        padding: 8,
        gap: 6,
        children: [
            Column({
                gap: 6,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'One token · projected Q, K, V · width 8',
                        fontSize: 25,
                        fontWeight: 800,
                        align: 'center',
                    }),
                    headGroupLabels,
                    qkv,
                ],
            }),
            TextLabel({
                c,
                text: 'Four heads attend in parallel; each output has width 2',
                fontSize: 22,
                color: c.textMuted,
                align: 'center',
            }),
            headLanes,
            Column({
                gap: 6,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Concatenate h_1, h_2, h_3, h_4: 2 + 2 + 2 + 2 = 8',
                        math: true,
                        fontSize: 23,
                        fontWeight: 800,
                        align: 'center',
                    }),
                    concatenated,
                ],
            }),
            FlowArrow({ direction: 'down', c, tone: 'neutral', length: 12 }),
            TextLabel({
                c,
                text: 'W^O: 8×8 map',
                math: true,
                fontSize: 24,
                fontWeight: 800,
                align: 'center',
            }),
            FlowArrow({ direction: 'down', c, tone: 'neutral', length: 12 }),
            Column({
                gap: 6,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Attention output · model width 8',
                        fontSize: 22,
                        color: c.textMuted,
                        align: 'center',
                    }),
                    attentionOutput,
                ],
            }),
        ],
    })
}

export default create('dark')
