import { Column, FlowArrow, Grid, Panel, Row, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Three retrieval architectures place query-passage interaction at different stages. A bi-encoder encodes query and passage tokens separately into single vectors q and d and computes q dot d. A cross-encoder concatenates [query ; passage] for full joint self-attention on a shortlist. Late interaction stores document-token vectors d_j, computes every q_i dot d_j similarity, takes each query row maximum, and sums them.'

export const width = 640
export const height = 740

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        title: 'Where query and passage tokens interact',
        subtitle: 'Interaction timing sets what can be precomputed versus scored at query time',
        padding: 14,
        gap: 10,
        contentWidth: 612,
        align: 'center',
        children: Column({
            width: 612,
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Where does query–passage interaction happen?',
                    width: 604,
                    fontSize: 22,
                    fontWeight: 850,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Panel({
                    c,
                    title: 'Bi-encoder · independent encoding',
                    tone: 'green',
                    width: 604,
                    padding: 10,
                    titleFontSize: 21,
                    gap: 8,
                    align: 'center',
                    children: [
                        Row({
                            gap: 10,
                            align: 'center',
                            justify: 'center',
                            children: [
                                Grid({
                                    c,
                                    rows: [['q: rope angle'], ['d: rotate pair']],
                                    cellWidth: 165,
                                    cellHeight: 38,
                                    gap: 6,
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', tone: 'green', length: 24 }),
                                Grid({
                                    c,
                                    rows: [['q ∈ R^d'], ['d ∈ R^d']],
                                    cellWidth: 135,
                                    cellHeight: 38,
                                    gap: 6,
                                    fontSize: 19,
                                    math: true,
                                }),
                                FlowArrow({ c, direction: 'right', tone: 'green', length: 24 }),
                                Grid({
                                    c,
                                    rows: [[{ label: 'q · d', tone: 'green' }]],
                                    cellWidth: 96,
                                    cellHeight: 46,
                                    gap: 6,
                                    fontSize: 21,
                                    math: true,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Store 1 vector per passage; fast ANN recall over millions of documents.',
                            width: 580,
                            fontSize: 19,
                            fontWeight: 650,
                            align: 'center',
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Cross-encoder · joint attention over [q ; d]',
                    tone: 'warm',
                    width: 604,
                    padding: 10,
                    titleFontSize: 21,
                    gap: 8,
                    align: 'center',
                    children: [
                        Row({
                            gap: 10,
                            align: 'center',
                            justify: 'center',
                            children: [
                                Grid({
                                    c,
                                    rows: [[{ label: '[query ; passage]', tone: 'warm' }]],
                                    cellWidth: 205,
                                    cellHeight: 44,
                                    gap: 6,
                                    fontSize: 20,
                                }),
                                FlowArrow({ c, direction: 'right', tone: 'warm', length: 26 }),
                                Grid({
                                    c,
                                    rows: [[{ label: 'joint self-attn', tone: 'blue' }]],
                                    cellWidth: 175,
                                    cellHeight: 44,
                                    gap: 6,
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', tone: 'warm', length: 26 }),
                                Grid({
                                    c,
                                    rows: [[{ label: 'logit s', tone: 'warm' }]],
                                    cellWidth: 96,
                                    cellHeight: 44,
                                    gap: 6,
                                    fontSize: 20,
                                    math: true,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'No offline passage vectors; run only on a top-K shortlist.',
                            width: 580,
                            fontSize: 19,
                            fontWeight: 650,
                            align: 'center',
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Late interaction (ColBERT) · MaxSim',
                    tone: 'blue',
                    width: 604,
                    padding: 10,
                    titleFontSize: 21,
                    gap: 8,
                    align: 'center',
                    children: [
                        Row({
                            gap: 10,
                            align: 'center',
                            justify: 'center',
                            children: [
                                Grid({
                                    c,
                                    rows: [
                                        ['q_i / d_j', 'shift', 'rope', 'angle'],
                                        ['rope', '0.12', '0.93', '0.08'],
                                        ['angle', '0.19', '0.07', '0.91'],
                                    ],
                                    cellWidth: 74,
                                    cellHeight: 34,
                                    gap: 4,
                                    fontSize: 19,
                                    headerRows: 1,
                                    headerCols: 1,
                                    math: true,
                                }),
                                FlowArrow({ c, direction: 'right', tone: 'blue', length: 24 }),
                                Grid({
                                    c,
                                    rows: [[{ label: 'Σ_i max_j q_i · d_j', tone: 'blue' }]],
                                    cellWidth: 205,
                                    cellHeight: 46,
                                    gap: 6,
                                    fontSize: 20,
                                    math: true,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Store per-token passage vectors; keep token-level precision with late scoring.',
                            width: 580,
                            fontSize: 19,
                            fontWeight: 650,
                            align: 'center',
                            color: c.textSecondary,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create()
