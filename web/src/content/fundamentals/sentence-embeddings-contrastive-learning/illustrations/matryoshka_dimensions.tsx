import {
    Column,
    DataTable,
    FlowArrow,
    Grid,
    ProgressList,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'A 768-dimensional embedding is structured into prefixes at 32, 128, and 768 dimensions, using 4.17 percent, 16.67 percent, and 100 percent of full float storage. Multi-width contrastive training sums prefix losses 0.0088 at d=2, 0.0147 at d=4, and 0.0225 at d=6, giving a mean loss of 0.0153.'

export const width = 640
export const height = 720

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        title: 'Train multiple prefix cutoffs inside one embedding',
        subtitle: 'Storage scales linearly with retained prefix dimensions',
        padding: 16,
        gap: 10,
        contentWidth: 608,
        align: 'center',
        children: Column({
            width: 608,
            gap: 12,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: '768-d Matryoshka vector · storage per retained prefix',
                    width: 600,
                    fontSize: 21,
                    fontWeight: 850,
                    align: 'center',
                    color: c.textPrimary,
                    math: true,
                }),
                Column({
                    width: 580,
                    align: 'stretch',
                    children: [
                        ProgressList({
                            c,
                            labelWidth: 130,
                            valueWidth: 160,
                            barHeight: 26,
                            fontSize: 20,
                            gap: 10,
                            rows: [
                                {
                                    label: '32-d prefix',
                                    value: 32 / 768,
                                    valueLabel: '4.17% (32/768)',
                                    tone: 'blue',
                                },
                                {
                                    label: '128-d prefix',
                                    value: 128 / 768,
                                    valueLabel: '16.67% (128/768)',
                                    tone: 'warm',
                                },
                                {
                                    label: '768-d full',
                                    value: 1,
                                    valueLabel: '100% (768/768)',
                                    tone: 'purple',
                                },
                            ],
                        }),
                    ],
                }),
                FlowArrow({ c, direction: 'down', tone: 'green', length: 20 }),
                TextLabel({
                    c,
                    text: 'Prefix InfoNCE losses across nested widths (2, 4, 6)',
                    width: 600,
                    fontSize: 20,
                    fontWeight: 800,
                    align: 'center',
                    color: green,
                    math: true,
                }),
                DataTable({
                    c,
                    rows: [
                        ['prefix cutoff', 'InfoNCE loss', 'objective role'],
                        ['d = 2', '0.0088', 'coarse filter'],
                        ['d = 4', '0.0147', 'mid-width rank'],
                        ['d = 6', '0.0225', 'full embedding'],
                    ],
                    firstColWidth: 165,
                    cellWidth: 195,
                    cellHeight: 44,
                    gap: 6,
                    fontSize: 19,
                    headerRows: 1,
                    math: true,
                }),
                Grid({
                    c,
                    rows: [
                        [
                            { label: '(0.0088 + 0.0147 + 0.0225) / 3', tone: 'neutral' },
                            { label: 'mean = 0.0153', tone: 'green' },
                        ],
                    ],
                    cellWidth: 280,
                    cellHeight: 46,
                    gap: 10,
                    fontSize: 20,
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'Training jointly prevents early coordinates from depending on later tail slots.',
                    width: 600,
                    fontSize: 19,
                    fontWeight: 650,
                    align: 'center',
                    color: c.textSecondary,
                }),
            ],
        }),
    })
}

export default create()
