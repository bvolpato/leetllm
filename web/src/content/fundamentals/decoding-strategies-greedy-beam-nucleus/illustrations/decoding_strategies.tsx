import {
    BarChart,
    Column,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 640
export const alt =
    'Probability comparison for two-token continuations after The autumn light is. First-step probabilities are bright 0.45, fading 0.30, soft 0.15, and nine tail tokens totaling 0.10. Width-2 beam search retains bright and fading while pruning soft and the tail. Greedy commits to bright followed by period at 0.180, whereas beam search rescues fading followed by fast at 0.270.'

const paths = [
    {
        label: 'bright .',
        score: 0.18,
        tone: 'warm' as const,
    },
    {
        label: 'bright today',
        score: 0.1575,
        tone: 'neutral' as const,
    },
    {
        label: 'bright now',
        score: 0.1125,
        tone: 'neutral' as const,
    },
    {
        label: 'fading fast',
        score: 0.27,
        tone: 'green' as const,
    },
    {
        label: 'fading slowly',
        score: 0.03,
        tone: 'neutral' as const,
    },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        title: 'Beam search scores 2-token paths, not just step 1',
        contentWidth: 636,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Beam search scores 2-token paths, not just step 1',
                        fontSize: 22,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Prefix: "The autumn light is" | B=2 keeps bright, fading',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
            BarChart({
                c: withDensity(c, 2.0),
                width: 636,
                height: 300,
                min: 0,
                max: 0.3,
                showValues: true,
                yAxisLabel: 'Path probability',
                data: paths.map((p) => ({
                    label: p.label,
                    value: p.score,
                    valueLabel: p.score.toFixed(3),
                    color: p.tone === 'neutral' ? 'neutral' : getReadableToneColor(p.tone, c),
                })),
                ariaLabel:
                    'Five expanded 2-token sequences from beam width 2 showing fading fast at 0.270 outscoring greedy bright period at 0.180',
            }),
            Column({
                gap: 4,
                align: 'center',
                children: [
                    Column({
                        gap: 16,
                        children: [
                            TextLabel({
                                c,
                                text: 'Green: beam fading fast (.270)',
                                fontSize: 20,
                                fontWeight: 700,
                                color: getReadableToneColor('green', c),
                            }),
                            TextLabel({
                                c,
                                text: 'Orange: greedy bright . (.180)',
                                fontSize: 20,
                                fontWeight: 700,
                                color: getReadableToneColor('warm', c),
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Pruned at step 1: soft (0.15), pale (0.02), and eight 0.01 tokens',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
