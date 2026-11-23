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
export const height = 650
export const alt =
    'Graph workflows schedule static fan-out/fan-in edges, supervisor models invoke specialists as tools while keeping control, and handoffs transfer turn ownership while the runtime rebuilds tool permissions.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Control Topologies and Wire Protocols',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Row({
                gap: 10,
                align: 'stretch',
                children: [
                    Panel({
                        c,
                        title: 'StateGraph DAG',
                        tone: 'blue',
                        width: 196,
                        padding: 10,
                        titleFontSize: 20,
                        children: Column({
                            gap: 6,
                            children: [
                                TextLabel({ c, text: 'Runtime owns edges', fontSize: 19 }),
                                FlowArrow({ c, direction: 'down', length: 18, tone: 'blue' }),
                                TextLabel({
                                    c,
                                    text: 'Fixed fan-out / join',
                                    fontSize: 19,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Supervisor',
                        tone: 'purple',
                        width: 196,
                        padding: 10,
                        titleFontSize: 20,
                        children: Column({
                            gap: 6,
                            children: [
                                TextLabel({ c, text: 'Manager owns loop', fontSize: 19 }),
                                FlowArrow({ c, direction: 'down', length: 18, tone: 'purple' }),
                                TextLabel({
                                    c,
                                    text: 'Specialists as tools',
                                    fontSize: 19,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Peer Handoff',
                        tone: 'cyan',
                        width: 196,
                        padding: 10,
                        titleFontSize: 20,
                        children: Column({
                            gap: 6,
                            children: [
                                TextLabel({ c, text: 'Transfers active turn', fontSize: 19 }),
                                FlowArrow({ c, direction: 'down', length: 18, tone: 'cyan' }),
                                TextLabel({
                                    c,
                                    text: 'Runtime sets tool ACL',
                                    fontSize: 19,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                ],
            }),
            Panel({
                c,
                title: 'Protocol Split: Tool Capabilities vs. Remote Agents',
                tone: 'neutral',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        Row({
                            gap: 10,
                            justify: 'center',
                            align: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: 'MCP',
                                    tone: 'blue',
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', length: 18, tone: 'blue' }),
                                TextLabel({
                                    c,
                                    text: 'Host connects to tool & task servers',
                                    fontSize: 19,
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
                                    text: 'A2A',
                                    tone: 'green',
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', length: 18, tone: 'green' }),
                                TextLabel({
                                    c,
                                    text: 'Agent delegates tracked remote agent tasks',
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
