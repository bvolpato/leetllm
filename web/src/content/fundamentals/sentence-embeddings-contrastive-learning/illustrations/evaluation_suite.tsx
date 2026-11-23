import {
    Column,
    DataTable,
    FlowArrow,
    ProgressList,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Top table shows Semantic Textual Similarity comparing human relatedness ratings 4.5 and 1.2 out of 5 with cosine rankings via Spearman rank correlation. Bottom bar chart shows the original MTEB paper snapshot of 58 datasets across eight categories: retrieval 15, classification 12, clustering 11, STS 10, reranking 4, pair classification 3, bitext mining 2, and summarization 1.'

export const width = 640
export const height = 740

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        title: 'STS tests relatedness; MTEB spans eight task groups',
        subtitle: 'Screen on broad benchmarks, then verify your target retrieval split',
        padding: 16,
        gap: 10,
        contentWidth: 608,
        align: 'center',
        children: Column({
            width: 608,
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'STS task: rank agreement via Spearman correlation',
                    width: 600,
                    fontSize: 21,
                    fontWeight: 800,
                    align: 'center',
                    color: purple,
                }),
                DataTable({
                    c,
                    rows: [
                        ['sentence pair', 'rating', 'role'],
                        ['CI build failed ↔ test run failed', '4.5 / 5', 'high rank'],
                        ['CI build failed ↔ attention mask', '1.2 / 5', 'low rank'],
                    ],
                    firstColWidth: 332,
                    cellWidth: 124,
                    cellHeight: 44,
                    gap: 6,
                    fontSize: 19,
                    headerRows: 1,
                    math: true,
                }),
                FlowArrow({ c, direction: 'down', tone: 'purple', length: 18 }),
                TextLabel({
                    c,
                    text: 'Original MTEB snapshot · 58 datasets across 8 task groups',
                    width: 600,
                    fontSize: 21,
                    fontWeight: 800,
                    align: 'center',
                    color: green,
                }),
                Column({
                    width: 580,
                    align: 'stretch',
                    children: [
                        ProgressList({
                            c,
                            labelWidth: 180,
                            valueWidth: 52,
                            barHeight: 22,
                            fontSize: 19,
                            gap: 8,
                            rows: [
                                {
                                    label: 'Retrieval',
                                    value: 15 / 15,
                                    valueLabel: '15',
                                    tone: 'green',
                                },
                                {
                                    label: 'Classification',
                                    value: 12 / 15,
                                    valueLabel: '12',
                                    tone: 'purple',
                                },
                                {
                                    label: 'Clustering',
                                    value: 11 / 15,
                                    valueLabel: '11',
                                    tone: 'blue',
                                },
                                { label: 'STS', value: 10 / 15, valueLabel: '10', tone: 'warm' },
                                {
                                    label: 'Reranking',
                                    value: 4 / 15,
                                    valueLabel: '4',
                                    tone: 'cyan',
                                },
                                {
                                    label: 'Pair classification',
                                    value: 3 / 15,
                                    valueLabel: '3',
                                    tone: 'purple',
                                },
                                {
                                    label: 'Bitext mining',
                                    value: 2 / 15,
                                    valueLabel: '2',
                                    tone: 'red',
                                },
                                {
                                    label: 'Summarization',
                                    value: 1 / 15,
                                    valueLabel: '1',
                                    tone: 'neutral',
                                },
                            ],
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Counts reflect the 2023 MTEB release; MMTEB (2025) expanded task coverage.',
                    width: 600,
                    fontSize: 19,
                    fontWeight: 600,
                    align: 'center',
                    color: c.textSecondary,
                }),
            ],
        }),
    })
}

export default create()
