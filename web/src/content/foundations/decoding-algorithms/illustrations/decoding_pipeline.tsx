import {
    Column,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneColor,
    type ThemeMode,
} from 'vizmatic'

export const width = 820
export const height = 640
export const alt =
    'Probability distributions comparing peaked and flat next-token logits. In the peaked case, Top-k (k=2) and Top-p (p=0.90) retain attention and supervision with cumulative mass 0.913; Min-p (0.10) retains attention, supervision, and consistency with mass 0.990. In the flat case, Top-k retains two tokens with mass 0.530 and cuts 0.470, while Top-p and Min-p dynamically retain all four candidate tokens.'

type Method = 'top-k' | 'top-p' | 'min-p'

interface Distribution {
    name: string
    tone: 'cyan' | 'purple'
    probabilities: Array<{
        token: string
        p: number
        tone: 'green' | 'warm' | 'blue' | 'critical'
    }>
    retained: Record<Method, string[]>
}

const distributions: Distribution[] = [
    {
        name: 'Peaked',
        tone: 'cyan',
        probabilities: [
            { token: 'attention', p: 0.568, tone: 'green' },
            { token: 'supervision', p: 0.345, tone: 'warm' },
            { token: 'consistency', p: 0.077, tone: 'blue' },
            { token: 'regression', p: 0.01, tone: 'critical' },
        ],
        retained: {
            'top-k': ['attention', 'supervision'],
            'top-p': ['attention', 'supervision'],
            'min-p': ['attention', 'supervision', 'consistency'],
        },
    },
    {
        name: 'Flat',
        tone: 'purple',
        probabilities: [
            { token: 'attention', p: 0.28, tone: 'green' },
            { token: 'supervision', p: 0.25, tone: 'warm' },
            { token: 'consistency', p: 0.24, tone: 'blue' },
            { token: 'regression', p: 0.23, tone: 'critical' },
        ],
        retained: {
            'top-k': ['attention', 'supervision'],
            'top-p': ['attention', 'supervision', 'consistency', 'regression'],
            'min-p': ['attention', 'supervision', 'consistency', 'regression'],
        },
    },
]

const methods: Array<{ key: Method; label: string }> = [
    { key: 'top-k', label: 'Top-k (k=2)' },
    { key: 'top-p', label: 'Top-p (p=0.90)' },
    { key: 'min-p', label: 'Min-p (p=0.10)' },
]

function massFor(distribution: Distribution, method: Method) {
    const kept = new Set(distribution.retained[method])
    return distribution.probabilities
        .filter(({ token }) => kept.has(token))
        .reduce((total, { p }) => total + p, 0)
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    const distributionColumns = distributions.map((distribution) =>
        Column({
            width: 375,
            gap: 6,
            align: 'stretch',
            children: [
                Row({
                    width: '100%',
                    align: 'center',
                    justify: 'space-between',
                    children: [
                        TextLabel({
                            c,
                            text: `${distribution.name} distribution`,
                            fontSize: 22,
                            fontWeight: 800,
                            color: getReadableToneColor(distribution.tone, c),
                        }),
                    ],
                }),
                Column({
                    width: '100%',
                    gap: 4,
                    align: 'stretch',
                    children: distribution.probabilities.map(({ token, p, tone }) =>
                        Row({
                            width: '100%',
                            gap: 6,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: token,
                                    width: 110,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: c.textPrimary,
                                }),
                                TextLabel({
                                    c,
                                    text: p.toFixed(3),
                                    width: 60,
                                    fontSize: 18,
                                    mono: true,
                                    color: c.textSecondary,
                                }),
                                StackedBar({
                                    c,
                                    width: 190,
                                    height: 18,
                                    showLegend: false,
                                    segments: [
                                        {
                                            label: token,
                                            value: p,
                                            color: getToneColor(tone, c),
                                            valueLabel: '',
                                        },
                                        {
                                            label: 'rem',
                                            value: 1 - p,
                                            color: c.borderSubtle,
                                            valueLabel: '',
                                        },
                                    ],
                                }),
                            ],
                        }),
                    ),
                }),
                TextLabel({
                    c,
                    text: 'Filtering policies & retained probability mass',
                    width: '100%',
                    fontSize: 19,
                    fontWeight: 800,
                    color: c.textPrimary,
                }),
                Column({
                    width: '100%',
                    gap: 6,
                    align: 'stretch',
                    children: methods.map(({ key, label }) => {
                        const mass = massFor(distribution, key)
                        const keptTokens = distribution.retained[key].join(', ')
                        return Column({
                            width: '100%',
                            gap: 2,
                            align: 'stretch',
                            children: [
                                Row({
                                    width: '100%',
                                    align: 'center',
                                    justify: 'space-between',
                                    children: [
                                        TextLabel({
                                            c,
                                            text: label,
                                            fontSize: 18,
                                            fontWeight: 700,
                                            color: c.textPrimary,
                                        }),
                                        TextLabel({
                                            c,
                                            text: `Mass: ${mass.toFixed(3)}`,
                                            fontSize: 18,
                                            mono: true,
                                            fontWeight: 700,
                                            color: getReadableToneColor(
                                                mass > 0.9 ? 'green' : 'warm',
                                                c,
                                            ),
                                        }),
                                    ],
                                }),
                                TextLabel({
                                    c,
                                    text: `Retains: [${keptTokens}]`,
                                    fontSize: 16,
                                    color: c.textSecondary,
                                }),
                            ],
                        })
                    }),
                }),
            ],
        }),
    )

    return Scene({
        c,
        padding: 16,
        gap: 8,
        align: 'center',
        contentWidth: 780,
        children: Column({
            width: '100%',
            gap: 8,
            align: 'stretch',
            children: [
                TextLabel({
                    c,
                    text: 'Top-k vs Top-p vs Min-p across peaked and flat distributions',
                    width: '100%',
                    fontSize: 25,
                    fontWeight: 800,
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Top-k fixes candidate count; Top-p and Min-p adapt to distribution entropy.',
                    width: '100%',
                    fontSize: 19,
                    color: c.textSecondary,
                }),
                Row({
                    width: '100%',
                    gap: 24,
                    align: 'start',
                    children: distributionColumns,
                }),
                TextLabel({
                    c,
                    text: 'In flat distributions, Top-k truncates valid mass (47% lost); Top-p and Min-p dynamically preserve the vocabulary tail.',
                    width: '100%',
                    fontSize: 18,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
            ],
        }),
    })
}

export default create()
