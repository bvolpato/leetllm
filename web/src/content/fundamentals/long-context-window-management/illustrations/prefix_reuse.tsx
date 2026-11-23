import { BarChart, Column, Flow, getThemeColors, Scene, TextLabel, withDensity } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 720
export const height = 700
export const alt =
    'Three requests share a 48,000-token prefix plus unique suffixes of 800, 1,200, and 600 tokens. Without prefix caching, prefill computes 146,600 tokens; reusing exact cached prefix blocks computes 50,600 new tokens and skips 96,000 duplicate prefix tokens.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 690,
        padding: 12,
        gap: 12,
        children: [
            Column({
                gap: 14,
                align: 'center',
                children: [
                    Flow({
                        c,
                        direction: 'horizontal',
                        gap: 8,
                        connectorLength: 22,
                        stages: [
                            {
                                title: '48,000 shared prefix',
                                subtitle: 'System + repo docs (computed 1×)',
                                tone: 'green',
                                width: 280,
                            },
                            {
                                title: 'Unique query suffixes',
                                subtitle: 'R1: 800 · R2: 1,200 · R3: 600',
                                tone: 'blue',
                                width: 290,
                            },
                        ],
                    }),
                    BarChart({
                        c,
                        title: 'Total prefill tokens across R1, R2, R3',
                        width: 670,
                        height: 250,
                        min: 0,
                        max: 180000,
                        format: (v) => `${Math.round(v / 1000)}K`,
                        showValues: true,
                        data: [
                            {
                                label: 'No reuse',
                                value: 146600,
                                color: c.warning,
                                valueLabel: '146,600',
                            },
                            {
                                label: 'KV skipped',
                                value: 96000,
                                color: c.info,
                                valueLabel: '96,000',
                            },
                            {
                                label: 'Reused prefill',
                                value: 50600,
                                color: c.positive,
                                valueLabel: '50,600',
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Decode attention still reads cached prefix KV blocks for each query',
                        fontSize: 21,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
