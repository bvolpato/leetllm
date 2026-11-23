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
    'A recalled memory note provides context only. Recovery reads the durable workflow checkpoint, inspects live CI and merge state with the idempotency key, and either advances or retries safely.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Crash Recovery: Memory Note vs. Workflow Checkpoint',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Row({
                gap: 12,
                align: 'stretch',
                children: [
                    Panel({
                        c,
                        title: 'Recalled Note',
                        tone: 'warm',
                        width: 298,
                        padding: 12,
                        titleFontSize: 20,
                        children: Column({
                            gap: 6,
                            children: [
                                TextLabel({
                                    c,
                                    text: '"Merge approved earlier"',
                                    fontSize: 19,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Context only, stale risk',
                                    fontSize: 19,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Workflow Checkpoint',
                        tone: 'blue',
                        width: 298,
                        padding: 12,
                        titleFontSize: 20,
                        children: Column({
                            gap: 6,
                            children: [
                                TextLabel({
                                    c,
                                    text: 'node: open_pr (pending)',
                                    fontSize: 19,
                                    mono: true,
                                }),
                                TextLabel({
                                    c,
                                    text: 'key: merge-run-42',
                                    fontSize: 19,
                                    mono: true,
                                }),
                            ],
                        }),
                    }),
                ],
            }),
            FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
            Panel({
                c,
                title: 'Reconcile Against Live Systems',
                tone: 'purple',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: TextLabel({
                    c,
                    text: 'Check current CI status, branch rule, and key merge-run-42',
                    fontSize: 19,
                }),
            }),
            FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
            Row({
                gap: 12,
                align: 'stretch',
                children: [
                    Panel({
                        c,
                        title: 'Key Found Upstream',
                        tone: 'green',
                        width: 298,
                        padding: 12,
                        titleFontSize: 20,
                        children: BadgePill({
                            c,
                            text: 'Skip dup, mark committed',
                            tone: 'green',
                            fontSize: 19,
                        }),
                    }),
                    Panel({
                        c,
                        title: 'No Upstream Effect',
                        tone: 'cyan',
                        width: 298,
                        padding: 12,
                        titleFontSize: 20,
                        children: BadgePill({
                            c,
                            text: 'Retry once if checks pass',
                            tone: 'cyan',
                            fontSize: 19,
                        }),
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
