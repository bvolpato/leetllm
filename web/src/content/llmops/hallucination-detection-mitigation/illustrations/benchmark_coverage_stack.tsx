import {
    BarChart,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 560
export const alt =
    'Bar chart showing unsupported claim rates dropping across layered mitigation stages from 28 percent on unverified RAG drafts down to 4 percent with corrective retrieval and a conformal verification gate.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.4)

    return Scene({
        c,
        padding: 20,
        gap: 10,
        contentWidth: 720,
        children: [
            TextLabel({
                c,
                text: 'Unsupported-claim rate across defense layers',
                fontSize: 28,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'Layering verification, pruning, and retrieval beats prompting alone.',
                fontSize: 23,
                color: c.textSecondary,
            }),
            BarChart({
                c,
                width: 720,
                height: 410,
                min: 0,
                max: 0.35,
                format: 'percent',
                showGrid: false,
                showValues: true,
                data: [
                    { label: 'Draft', value: 0.28, color: getReadableToneColor('critical', c) },
                    { label: 'Prompt', value: 0.21, color: getReadableToneColor('warm', c) },
                    { label: 'SelfCheck', value: 0.14, color: getReadableToneColor('purple', c) },
                    { label: 'Prune', value: 0.08, color: getReadableToneColor('blue', c) },
                    { label: 'Retry+Gate', value: 0.04, color: getReadableToneColor('green', c) },
                ],
            }),
        ],
    })
}

export default create('dark')
