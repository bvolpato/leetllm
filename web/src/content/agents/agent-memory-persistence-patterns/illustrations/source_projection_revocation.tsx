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
    'Tombstoning a source record or revoking a repository grant blocks recall and stale refresh writes immediately, while an already dispatched prompt must still be guarded by short retention and tool checks.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Revocation: Tombstones, ACL Removal, and In-Flight Prompts',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Panel({
                c,
                title: '1. Source Tombstoned (t = 103)',
                tone: 'red',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        Row({
                            gap: 12,
                            justify: 'center',
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Source v3: deleted',
                                    fontSize: 19,
                                    mono: true,
                                }),
                                FlowArrow({ c, direction: 'right', length: 22, tone: 'red' }),
                                TextLabel({
                                    c,
                                    text: 'Index still holds v2',
                                    fontSize: 19,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                        BadgePill({
                            c,
                            text: 'Recall returns empty; delayed sync denied',
                            tone: 'red',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: '2. Repository Grant Removed',
                tone: 'red',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        Row({
                            gap: 12,
                            justify: 'center',
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'ACL: dev revoked',
                                    fontSize: 19,
                                    mono: true,
                                }),
                                FlowArrow({ c, direction: 'right', length: 22, tone: 'red' }),
                                TextLabel({
                                    c,
                                    text: 'Index matches v4',
                                    fontSize: 19,
                                    color: c.textMuted,
                                }),
                            ],
                        }),
                        BadgePill({
                            c,
                            text: 'Live ACL lookup denies recall and writes',
                            tone: 'red',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: '3. In-Flight Prompt Snapshot',
                tone: 'warm',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        TextLabel({
                            c,
                            text: 'Already assembled model input still holds v2 text',
                            fontSize: 19,
                        }),
                        BadgePill({
                            c,
                            text: 'Re-verify permissions at every tool call',
                            tone: 'warm',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
        ],
    })
}

export default create('dark')
