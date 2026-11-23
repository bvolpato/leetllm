import { Column, getThemeColors, Heatmap, LineChart, Scene, TextLabel, withDensity } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 720
export const height = 780
export const alt =
    'Needle-in-a-Haystack miss rates rise with both sequence length and middle depth: at 128K tokens the miss rates across depths 0%, 25%, 50%, 75%, and 100% are 12%, 37%, 72%, 39%, and 13%. The corresponding 128K recall U-curve dips to 28% at the midpoint while keeping 88% at the start and 87% at the end.'

const contexts = ['4K', '16K', '64K', '128K']
const depths = ['0%', '25%', '50%', '75%', '100%']
const misses = [
    [0.01, 0.02, 0.03, 0.02, 0.01],
    [0.04, 0.1, 0.22, 0.11, 0.04],
    [0.08, 0.25, 0.54, 0.27, 0.09],
    [0.12, 0.37, 0.72, 0.39, 0.13],
]
const recall128k = misses[3].map((miss) => Math.round((1 - miss) * 100))

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)
    const missLabels = misses.map((row) => row.map((v) => `${Math.round(v * 100)}%`))

    return Scene({
        c,
        density: 2.2,
        contentWidth: 690,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 10,
                align: 'center',
                children: [
                    Heatmap({
                        c,
                        title: 'Miss rate by context length and depth',
                        data: misses,
                        labels: missLabels,
                        xLabels: depths,
                        yLabels: contexts,
                        cellWidth: 96,
                        cellHeight: 42,
                        rowLabelWidth: 78,
                        fontSize: 22,
                        colorScale: 'heat',
                        colorDomain: [0, 0.8],
                    }),
                    LineChart({
                        c,
                        title: '128K recall U-curve across depth (%)',
                        width: 670,
                        height: 220,
                        labels: depths,
                        min: 0,
                        max: 100,
                        format: (v) => `${Math.round(v)}%`,
                        showPoints: true,
                        series: [
                            {
                                name: '128K recall',
                                points: recall128k,
                                color: c.primary,
                                area: true,
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Middle positions dilute attention weight over distant context',
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
