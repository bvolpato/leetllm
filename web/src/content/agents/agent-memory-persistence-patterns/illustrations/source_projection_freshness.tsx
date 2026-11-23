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
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 640
export const height = 620
export const alt =
    'Read-time version and TTL verification: at t=101 matching version 1 returns the command; at t=102 a stale index projection at version 1 is rejected until reindexed to version 2; at exclusive TTL t=200 reads return nothing.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    const stepRow = (
        title: string,
        tone: ToneName,
        sourceText: string,
        indexText: string,
        outcome: string,
    ) =>
        Panel({
            c,
            title,
            tone,
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
                            TextLabel({ c, text: sourceText, fontSize: 19, mono: true }),
                            FlowArrow({ c, direction: 'right', length: 22, tone }),
                            TextLabel({ c, text: indexText, fontSize: 19, mono: true }),
                        ],
                    }),
                    BadgePill({
                        c,
                        text: outcome,
                        tone,
                        fontSize: 19,
                    }),
                ],
            }),
        })

    return Scene({
        c,
        title: 'Index Sync: Version Match and Exclusive Expiry',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            stepRow(
                't = 101 · Versions Match & Before TTL (200)',
                'green',
                'Source t3: v1',
                'Index: v1 (in sync)',
                'Returns: pytest -q tests/attn.py',
            ),
            stepRow(
                't = 102 · Source Updated While Index Lags',
                'warm',
                'Source t3: v2',
                'Index: v1 (stale)',
                'Stale v1 blocked until async sync reaches v2',
            ),
            stepRow(
                't = 200 · Exclusive Expiry Limit Reached',
                'red',
                'Source t3: v2 (exp 200)',
                'Index: v2 (t >= 200)',
                'Read at t >= 200 returns empty result',
            ),
        ],
    })
}

export default create('dark')
