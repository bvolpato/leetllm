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

export const width = 680
export const height = 650
export const alt =
    'Parallel diff, test, and security branches emit typed check records into an append reducer. The fan-in merge node rejects scalar overwrites, duplicate worker keys, and stale commit hashes before constructing one patch candidate.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Typed Shared State & Validated Fan-In',
        padding: 16,
        gap: 12,
        contentWidth: 648,
        children: [
            Row({
                gap: 10,
                align: 'stretch',
                children: [
                    Panel({
                        c,
                        title: 'Diff Agent',
                        tone: 'blue',
                        width: 209,
                        padding: 10,
                        titleFontSize: 20,
                        children: Column({
                            gap: 4,
                            children: [
                                TextLabel({ c, text: 'sha: 8f1a3b', fontSize: 20, mono: true }),
                                TextLabel({
                                    c,
                                    text: '3 AST hunks',
                                    fontSize: 20,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Test Agent',
                        tone: 'purple',
                        width: 209,
                        padding: 10,
                        titleFontSize: 20,
                        children: Column({
                            gap: 4,
                            children: [
                                TextLabel({ c, text: 'sha: 8f1a3b', fontSize: 20, mono: true }),
                                TextLabel({
                                    c,
                                    text: '14/14 green',
                                    fontSize: 20,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Scan Agent',
                        tone: 'cyan',
                        width: 210,
                        padding: 10,
                        titleFontSize: 20,
                        children: Column({
                            gap: 4,
                            children: [
                                TextLabel({ c, text: 'sha: 8f1a3b', fontSize: 20, mono: true }),
                                TextLabel({
                                    c,
                                    text: '0 issues',
                                    fontSize: 20,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                    }),
                ],
            }),
            Column({
                gap: 8,
                align: 'center',
                children: [
                    FlowArrow({ c, direction: 'down', length: 24, tone: 'blue' }),
                    BadgePill({
                        c,
                        text: 'Annotated[list[CheckResult], add]',
                        tone: 'blue',
                        fontSize: 20,
                    }),
                ],
            }),
            Panel({
                c,
                title: 'Merge Node Validation Checks',
                tone: 'green',
                width: 648,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        TextLabel({
                            c,
                            text: '1. Require one unique entry per worker (diff, test, scan)',
                            fontSize: 20,
                        }),
                        TextLabel({
                            c,
                            text: '2. Confirm all source digests match live HEAD sha 8f1a3b',
                            fontSize: 20,
                        }),
                        BadgePill({
                            c,
                            text: 'Missing reducer: scalar overwrite rejected',
                            tone: 'red',
                            fontSize: 20,
                        }),
                    ],
                }),
            }),
        ],
    })
}

export default create('dark')
