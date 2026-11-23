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
    'LangGraph interrupt() pauses execution before the review response arrives, saving checkpoint state. Resuming with Command(resume=...) restarts the interrupted node from its first line before routing to apply_pr or cancel.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Interrupt & Resume Restarts the Paused Node',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Panel({
                c,
                title: '1. First Invocation Enters review_gate (Entry #1)',
                tone: 'blue',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 6,
                    children: [
                        TextLabel({
                            c,
                            text: 'Calls interrupt({"digest": patch_digest})',
                            fontSize: 19,
                            mono: true,
                        }),
                        BadgePill({
                            c,
                            text: 'Keep side effects out before interrupt()',
                            tone: 'warm',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
            FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
            Panel({
                c,
                title: '2. Resume Enters review_gate From Top (Entry #2)',
                tone: 'purple',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 6,
                    children: [
                        TextLabel({
                            c,
                            text: 'Host calls graph.invoke(Command(resume=payload), cfg)',
                            fontSize: 19,
                        }),
                        TextLabel({
                            c,
                            text: 'interrupt() now returns payload synchronously',
                            fontSize: 19,
                            color: c.textMuted,
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
                        title: 'ok=True & Matching Digest',
                        tone: 'green',
                        width: 298,
                        padding: 12,
                        titleFontSize: 19,
                        children: BadgePill({
                            c,
                            text: 'Route to open_pr_writer',
                            tone: 'green',
                            fontSize: 19,
                        }),
                    }),
                    Panel({
                        c,
                        title: 'False or Digest Mismatch',
                        tone: 'red',
                        width: 298,
                        padding: 12,
                        titleFontSize: 19,
                        children: BadgePill({
                            c,
                            text: 'Cancel without write',
                            tone: 'red',
                            fontSize: 19,
                        }),
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
