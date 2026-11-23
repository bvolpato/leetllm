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
export const height = 640
export const alt =
    'A single-writer node pins patch digest, expected head version, and idempotency key. Replays with matching key return the saved pull request without duplicating work, while head version drift aborts the write.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Single-Writer Idempotency & Optimistic Head Check',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Panel({
                c,
                title: 'Approved Patch Proposal (Read-Only Bundle)',
                tone: 'blue',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 6,
                    children: [
                        TextLabel({
                            c,
                            text: 'patch_digest: sha256:4a9c.. | expected_v: 3',
                            fontSize: 19,
                            mono: true,
                        }),
                        TextLabel({
                            c,
                            text: 'idempotency_key: pr-fix-104',
                            fontSize: 19,
                            mono: true,
                        }),
                    ],
                }),
            }),
            FlowArrow({ c, direction: 'down', length: 24, tone: 'purple' }),
            Panel({
                c,
                title: 'Guarded PR Writer Checks Upstream State',
                tone: 'purple',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: TextLabel({
                    c,
                    text: 'Compare idempotency_key history, live branch HEAD, and CI pass',
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
                        title: 'Retry Same Key',
                        tone: 'green',
                        width: 298,
                        padding: 12,
                        titleFontSize: 20,
                        children: BadgePill({
                            c,
                            text: 'Return saved PR #104',
                            tone: 'green',
                            fontSize: 19,
                        }),
                    }),
                    Panel({
                        c,
                        title: 'HEAD Moved (v3 -> v4)',
                        tone: 'red',
                        width: 298,
                        padding: 12,
                        titleFontSize: 20,
                        children: BadgePill({
                            c,
                            text: 'Abort write, re-run checks',
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
