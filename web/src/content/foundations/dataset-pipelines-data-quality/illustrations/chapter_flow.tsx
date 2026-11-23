import {
    BadgePill,
    Column,
    FlowArrow,
    GraphDiagram,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 600
export const height = 690
export const alt =
    'Tickets 101 and 102 from conversation c-51 differ in case and outer spaces, but NFKC normalization, case folding, whitespace collapse, and SHA-256 give them the same fingerprint prefix c53011fb9834. A row split can place the normalized copies in train and test; grouping by conversation keeps both in one partition.'

export function create(theme: ThemeMode = 'dark') {
    const c = {
        ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        shadow: 'transparent',
    }
    const nodes = [
        {
            id: 'row-101',
            label: 'Ticket 101 · c-51',
            detail: TextLabel({
                c,
                text: 'Build is still failing',
                fontSize: 21,
                color: c.textPrimary,
                width: 220,
                align: 'center',
            }),
            tone: 'blue' as const,
            x: 0.22,
            y: 0.24,
            width: 230,
            height: 96,
        },
        {
            id: 'row-102',
            label: 'Ticket 102 · c-51',
            detail: TextLabel({
                c,
                text: '··BUILD is still failing··',
                fontSize: 21,
                color: c.textPrimary,
                width: 220,
                align: 'center',
            }),
            tone: 'cyan' as const,
            x: 0.22,
            y: 0.76,
            width: 230,
            height: 96,
        },
        {
            id: 'fingerprint',
            label: 'Shared fingerprint',
            detail: TextLabel({
                c,
                text: 'build is still failing · c53011fb9834…',
                fontSize: 20,
                color: c.textPrimary,
                width: 230,
                align: 'center',
            }),
            tone: 'purple' as const,
            x: 0.78,
            y: 0.5,
            width: 250,
            height: 112,
        },
    ]
    const edges = [
        {
            from: 'row-101',
            to: 'fingerprint',
            tone: 'blue' as const,
            arrow: 'forward' as const,
            fromSide: 'right' as const,
            toSide: 'left' as const,
        },
        {
            from: 'row-102',
            to: 'fingerprint',
            tone: 'cyan' as const,
            arrow: 'forward' as const,
            fromSide: 'right' as const,
            toSide: 'left' as const,
        },
    ]

    return Scene({
        c,
        background: c.bg,
        padding: 10,
        gap: 10,
        contentWidth: 580,
        children: Column({
            gap: 10,
            align: 'stretch',
            children: [
                Column({
                    gap: 4,
                    align: 'stretch',
                    children: [
                        TextLabel({
                            c,
                            text: 'One conversation can cross train and test.',
                            fontSize: 28,
                            fontWeight: 760,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'Two rows share one normalized identity. · marks a space.',
                            fontSize: 20,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'NFKC · casefold · collapse whitespace · SHA-256',
                    fontSize: 21,
                    fontWeight: 650,
                    align: 'center',
                    color: c.textMuted,
                }),
                GraphDiagram({
                    c,
                    nodes,
                    edges,
                    width: 580,
                    height: 210,
                    labelFontSize: 21,
                    detailFontSize: 21,
                    padding: 8,
                    layout: 'manual',
                    routing: 'orthogonal',
                    ariaLabel:
                        'Ticket 101 and ticket 102 from c-51 converge on the same normalized fingerprint',
                }),
                Row({
                    gap: 10,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Random row split',
                            titleFontSize: 21,
                            tone: 'warm',
                            width: 285,
                            height: 220,
                            padding: 10,
                            gap: 16,
                            shadow: false,
                            children: Column({
                                gap: 16,
                                align: 'stretch',
                                children: [
                                    Row({
                                        gap: 8,
                                        align: 'center',
                                        children: [
                                            BadgePill({
                                                c,
                                                text: 'TRAIN',
                                                tone: 'blue',
                                                fontSize: 21,
                                                height: 30,
                                                padding: '3px 10px',
                                            }),
                                            TextLabel({
                                                c,
                                                text: '101',
                                                fontSize: 21,
                                                fontWeight: 750,
                                            }),
                                            BadgePill({
                                                c,
                                                text: 'c-51',
                                                tone: 'purple',
                                                fontSize: 20,
                                                height: 30,
                                                padding: '3px 10px',
                                            }),
                                        ],
                                    }),
                                    Row({
                                        gap: 8,
                                        align: 'center',
                                        children: [
                                            BadgePill({
                                                c,
                                                text: 'TEST',
                                                tone: 'critical',
                                                fontSize: 21,
                                                height: 30,
                                                padding: '3px 10px',
                                            }),
                                            TextLabel({
                                                c,
                                                text: '102',
                                                fontSize: 21,
                                                fontWeight: 750,
                                            }),
                                            BadgePill({
                                                c,
                                                text: 'c-51',
                                                tone: 'purple',
                                                fontSize: 20,
                                                height: 30,
                                                padding: '3px 10px',
                                            }),
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'The same conversation lands on both sides.',
                                        fontSize: 21,
                                        color: c.textPrimary,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Conversation group',
                            titleFontSize: 21,
                            tone: 'green',
                            width: 285,
                            height: 220,
                            padding: 10,
                            gap: 10,
                            shadow: false,
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    BadgePill({
                                        c,
                                        text: 'c-51 group',
                                        tone: 'purple',
                                        fontSize: 21,
                                        height: 30,
                                        padding: '3px 10px',
                                    }),
                                    Grid({
                                        c,
                                        rows: [
                                            [
                                                { label: 'Ticket 101', tone: 'blue' },
                                                { label: 'Ticket 102', tone: 'cyan' },
                                            ],
                                        ],
                                        cellWidth: 112,
                                        cellHeight: 44,
                                        gap: 6,
                                        fontSize: 21,
                                    }),
                                    FlowArrow({ c, direction: 'down', length: 18, tone: 'green' }),
                                    TextLabel({
                                        c,
                                        text: 'ONE PARTITION',
                                        fontSize: 21,
                                        fontWeight: 760,
                                        color: c.textPrimary,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
