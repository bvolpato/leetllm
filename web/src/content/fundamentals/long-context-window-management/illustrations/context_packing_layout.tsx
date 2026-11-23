import { BarChart, Column, Flow, getThemeColors, Scene, TextLabel, withDensity } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 740
export const height = 700
export const alt =
    'Five ranked code and spec chunks (A 0.95 Attention, B 0.92 RoPE, C 0.88 KV Layout, D 0.45 Logs, E 0.30 README) are reordered into prompt slots so high-relevance evidence sits at the head and tail (A and B) while lower-scoring background chunks fill the center between System instructions and Query.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 710,
        padding: 12,
        gap: 12,
        children: [
            Column({
                gap: 14,
                align: 'center',
                children: [
                    BarChart({
                        c,
                        title: '1 · Ranked retrieval scores placed at prompt edges',
                        width: 680,
                        height: 240,
                        min: 0,
                        max: 1.05,
                        format: (v) => v.toFixed(2),
                        showValues: true,
                        data: [
                            {
                                label: 'Head: A (Attn)',
                                value: 0.95,
                                color: c.primary,
                                valueLabel: '0.95',
                            },
                            {
                                label: 'Mid 1: C (KV)',
                                value: 0.88,
                                color: c.info,
                                valueLabel: '0.88',
                            },
                            {
                                label: 'Mid 2: D (Logs)',
                                value: 0.45,
                                color: c.neutral,
                                valueLabel: '0.45',
                            },
                            {
                                label: 'Mid 3: E (Docs)',
                                value: 0.3,
                                color: c.neutral,
                                valueLabel: '0.30',
                            },
                            {
                                label: 'Tail: B (RoPE)',
                                value: 0.92,
                                color: c.warning,
                                valueLabel: '0.92',
                            },
                        ],
                    }),
                    Flow({
                        c,
                        direction: 'horizontal',
                        gap: 3,
                        connectorLength: 8,
                        stages: [
                            { title: 'System', tone: 'neutral', width: 136 },
                            { title: 'A (0.95)', subtitle: 'Head', tone: 'purple', width: 120 },
                            { title: 'C · D · E', subtitle: 'Middle', tone: 'blue', width: 118 },
                            { title: 'B (0.92)', subtitle: 'Tail', tone: 'warm', width: 120 },
                            { title: 'Query', tone: 'green', width: 116 },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Keep chunk IDs intact and place strong evidence near prompt edges',
                        fontSize: 22,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
