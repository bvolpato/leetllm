import {
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'Dual-store feature pipeline splitting a shared Kafka event stream into a streaming online updater (Redis key-value state) and an append-only offline archive (Parquet lakehouse). At the 09:00 cutoff both paths select event E1 from 01:00, compute 8.0 hours age, and verify parity in a paired audit joined by request ID.'

export const width = 660
export const height = 600
export const preset = 'engineering'

const illustration = defineIllustration((c) => {
    const stream = getReadableToneColor('cyan', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: width - 32,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Dual-Store Parity Across Online and Batch Replay',
                    fontSize: 24,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Panel({
                    c,
                    title: 'Shared Event Stream (Kafka): account A-409',
                    titleFontSize: 21,
                    tone: 'cyan',
                    width: 620,
                    padding: '10px 14px',
                    gap: 4,
                    children: TextLabel({
                        c,
                        text: 'E1 (event 01:00, arrived 01:02) | E2 (event 08:30, arrived 11:00)',
                        fontSize: 20,
                        color: stream,
                        fontWeight: 600,
                    }),
                }),
                Row({
                    gap: 240,
                    justify: 'center',
                    children: [
                        FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
                        FlowArrow({ c, direction: 'down', length: 24, tone: 'green' }),
                    ],
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'Online Store (Stream -> Redis)',
                            titleFontSize: 20,
                            tone: 'purple',
                            width: 304,
                            padding: '10px 12px',
                            gap: 6,
                            children: Column({
                                gap: 6,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Orders by (event_time, rev)',
                                        fontSize: 20,
                                        color: purple,
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '09:00 reads E1 -> 8.0h age',
                                        fontSize: 20,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Logs serving vector + lag',
                                        fontSize: 20,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Offline Store (Log -> Parquet)',
                            titleFontSize: 20,
                            tone: 'green',
                            width: 304,
                            padding: '10px 12px',
                            gap: 6,
                            children: Column({
                                gap: 6,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Append-only event archive',
                                        fontSize: 20,
                                        color: green,
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '09:00 PIT join -> 8.0h age',
                                        fontSize: 20,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Excludes E2 (arrived 11:00)',
                                        fontSize: 20,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
                Row({
                    gap: 240,
                    justify: 'center',
                    children: [
                        FlowArrow({ c, direction: 'down', length: 24, tone: 'blue' }),
                        FlowArrow({ c, direction: 'down', length: 24, tone: 'blue' }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Paired Reconciliation by request_id and t_p',
                    titleFontSize: 21,
                    tone: 'blue',
                    width: 620,
                    padding: '10px 14px',
                    gap: 4,
                    children: Column({
                        gap: 4,
                        children: [
                            TextLabel({
                                c,
                                text: 'Captured serving row (8.0h) == Offline PIT replay (8.0h)',
                                fontSize: 20,
                                fontWeight: 700,
                                color: blue,
                            }),
                            TextLabel({
                                c,
                                text: 'Paired row diff = 0.0h; swaps detected even when marginals match',
                                fontSize: 20,
                                color: c.textSecondary,
                            }),
                        ],
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
