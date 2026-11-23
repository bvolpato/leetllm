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
    'Side-by-side comparison of SQL transaction guarantees. Left, atomicity rolls back pending document d20 when inserting chunk c20 fails its foreign key to not-d20. Right, PostgreSQL Repeatable Read isolation pins snapshot S1 containing c7a, c7b, and c9a so count and row queries still agree even after a concurrent writer commits snapshot S2.'

export const width = 660
export const height = 560
export const preset = 'engineering'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const red = getReadableToneColor('critical', c)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: width - 32,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Transaction Atomicity vs. Snapshot Isolation',
                    fontSize: 24,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'All-or-nothing writes protect single tasks; snapshots align multi-query reads',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'Atomicity (Rollback)',
                            titleFontSize: 20,
                            tone: 'warm',
                            width: 306,
                            padding: '10px 12px',
                            gap: 8,
                            children: Column({
                                gap: 6,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: '1. BEGIN + INSERT doc d20',
                                        fontSize: 20,
                                        color: blue,
                                        fontWeight: 700,
                                        align: 'center',
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 22, tone: 'blue' }),
                                    TextLabel({
                                        c,
                                        text: '2. INSERT c20 -> not-d20',
                                        fontSize: 20,
                                        color: red,
                                        fontWeight: 700,
                                        align: 'center',
                                    }),
                                    FlowArrow({
                                        c,
                                        direction: 'down',
                                        length: 22,
                                        tone: 'critical',
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Foreign-key error escapes',
                                        fontSize: 20,
                                        color: c.textSecondary,
                                        align: 'center',
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 22, tone: 'green' }),
                                    TextLabel({
                                        c,
                                        text: '3. ROLLBACK -> d20 absent',
                                        fontSize: 20,
                                        color: green,
                                        fontWeight: 700,
                                        align: 'center',
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Isolation (Repeatable Read)',
                            titleFontSize: 20,
                            tone: 'purple',
                            width: 306,
                            padding: '10px 12px',
                            gap: 8,
                            children: Column({
                                gap: 6,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: '1. Pin S1: c7a, c7b, c9a',
                                        fontSize: 20,
                                        color: purple,
                                        fontWeight: 700,
                                        align: 'center',
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 22, tone: 'purple' }),
                                    TextLabel({
                                        c,
                                        text: '2. SELECT count(*) -> 3 (S1)',
                                        fontSize: 20,
                                        color: c.textPrimary,
                                        align: 'center',
                                    }),
                                    FlowArrow({
                                        c,
                                        direction: 'down',
                                        length: 22,
                                        tone: 'neutral',
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Concurrent COMMIT -> S2',
                                        fontSize: 20,
                                        color: c.textSecondary,
                                        align: 'center',
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 22, tone: 'purple' }),
                                    TextLabel({
                                        c,
                                        text: '3. SELECT rows -> 3 (S1)',
                                        fontSize: 20,
                                        color: purple,
                                        fontWeight: 700,
                                        align: 'center',
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
