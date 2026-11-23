import { Column, DataTable, FlowArrow, Grid, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'For the query How does RoPE encode token position?, label auditing protects a relevant RoPE rotation passage with overlap 3 and score 0.92. Two non-relevant candidates sharing position vocabulary score 0.76 (overlap 5) and 0.68 (overlap 2) and become hard negatives 1 and 2, while an unrelated NF4 quantization passage with overlap 0 and score 0.05 is dropped.'

export const width = 640
export const height = 660

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        title: 'Audit labels before mining high-scoring negatives',
        subtitle: 'Protect labeled positives, drop easy non-matches, and keep confusing lookalikes',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        align: 'center',
        children: Column({
            width: 608,
            gap: 12,
            align: 'center',
            children: [
                Grid({
                    c,
                    rows: [
                        [{ label: 'Query: "How does RoPE encode token position?"', tone: 'blue' }],
                    ],
                    cellWidth: 560,
                    cellHeight: 50,
                    gap: 8,
                    fontSize: 20,
                }),
                DataTable({
                    c,
                    rows: [
                        ['candidate passage', 'rel · ovlp', 'score', 'decision'],
                        ['RoPE pair rotation', 'yes · 3', '0.92', 'protect'],
                        ['Sinusoidal abs bias', 'no · 5', '0.76', 'hard #1'],
                        ['Learned pos embed', 'no · 2', '0.68', 'hard #2'],
                        ['NF4 block packing', 'no · 0', '0.05', 'drop'],
                    ],
                    firstColWidth: 215,
                    cellWidth: 118,
                    cellHeight: 50,
                    gap: 6,
                    fontSize: 19,
                    headerRows: 1,
                    headerCols: 1,
                    math: true,
                }),
                FlowArrow({ c, direction: 'down', tone: 'purple', length: 20 }),
                Grid({
                    c,
                    rows: [
                        [
                            { label: 'protect positives', tone: 'green' },
                            { label: 'mine top_k = 2', tone: 'warm' },
                            { label: 'drop zero overlap', tone: 'neutral' },
                        ],
                    ],
                    cellWidth: 186,
                    cellHeight: 46,
                    gap: 8,
                    fontSize: 19,
                }),
                TextLabel({
                    c,
                    text: 'High lexical overlap can belong to a non-matching mechanism.',
                    width: 600,
                    fontSize: 21,
                    fontWeight: 750,
                    align: 'center',
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Check relevance labels so unannotated positives are never trained as negatives.',
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
