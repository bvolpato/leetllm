import {
    Column,
    DataTable,
    FlowArrow,
    Grid,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Two-stage retrieval pipeline for the query How does RoPE encode token position?. Bi-encoder cosine shortlist at K=3 selects Absolute pos bias (0.84), RoPE rotation proof (0.81), and RoPE base theta notes (0.78), while excluding NF4 quantization (0.10, hypothetical cross score 0.05 unused). Joint cross-encoder reranking reorders the shortlist to RoPE rotation (0.96), RoPE base theta (0.91), and drops Absolute pos bias (0.21) at top_k=2.'

export const width = 640
export const height = 740

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        title: 'Two-stage retrieval: fast shortlist recall then cross-encoder precision',
        subtitle: 'Bi-encoder sets candidate coverage; cross-encoder reorders the top-K set',
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
                    text: 'Query: "How does RoPE encode token position?"',
                    width: 600,
                    fontSize: 21,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Grid({
                    c,
                    rows: [
                        [
                            { label: 'Stage 1 · Cosine (K = 3)', tone: 'blue' },
                            { label: 'Stage 2 · Cross-encoder (top_k = 2)', tone: 'green' },
                        ],
                    ],
                    cellWidth: 288,
                    cellHeight: 46,
                    gap: 12,
                    fontSize: 19,
                }),
                FlowArrow({ c, direction: 'down', tone: 'purple', length: 16 }),
                Row({
                    gap: 12,
                    align: 'center',
                    justify: 'center',
                    children: [
                        DataTable({
                            c,
                            rows: [
                                ['shortlist candidate', 'cos'],
                                ['#1 Abs pos bias', '0.84'],
                                ['#2 RoPE rotation', '0.81'],
                                ['#3 RoPE base θ', '0.78'],
                            ],
                            firstColWidth: 192,
                            cellWidth: 74,
                            cellHeight: 50,
                            gap: 5,
                            fontSize: 19,
                            headerRows: 1,
                            math: true,
                        }),
                        FlowArrow({ c, direction: 'right', tone: 'green', length: 24 }),
                        DataTable({
                            c,
                            rows: [
                                ['reranked output', 'logit'],
                                ['#1 RoPE rotation', '0.96'],
                                ['#2 RoPE base θ', '0.91'],
                                ['drop: Abs bias', '0.21'],
                            ],
                            firstColWidth: 184,
                            cellWidth: 76,
                            cellHeight: 50,
                            gap: 5,
                            fontSize: 19,
                            headerRows: 1,
                            math: true,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Returned (top_k = 2): RoPE rotation (0.96) + RoPE base θ (0.91)',
                    width: 600,
                    fontSize: 20,
                    fontWeight: 800,
                    align: 'center',
                    color: green,
                    math: true,
                }),
                Grid({
                    c,
                    rows: [
                        [
                            {
                                label: 'Excluded (rank #4): NF4 quant · cosine 0.10',
                                tone: 'neutral',
                            },
                            { label: 'cross score 0.05 unused outside K=3', tone: 'warm' },
                        ],
                    ],
                    cellWidth: 292,
                    cellHeight: 56,
                    gap: 8,
                    fontSize: 19,
                }),
                TextLabel({
                    c,
                    text: 'Reranking can reorder top-K candidates, not rescue items missed by Stage 1.',
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
