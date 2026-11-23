import {
    BadgePill,
    Column,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const alt =
    'Prefill scores causal pairs among all prompt positions together, so dense work grows as Θ(T² dₖ) per head and contributes to time to first token. During decode, one query scores the cached keys and combines the cached values into an attention context vector; each step costs Θ(t dₖ) per head and contributes to inter-token latency.'

export const width = 660
export const height = 650
export const preset = 'architecture'

const illustration = defineIllustration((c) => {
    const prompt = [
        [
            { label: 'The', tone: 'blue' as const },
            { label: 'model', tone: 'blue' as const },
            { label: 'reads', tone: 'blue' as const },
            { label: 'prompt', tone: 'blue' as const },
        ],
    ]

    const causalScores = [
        [
            { label: 'Q/K', tone: 'neutral' as const },
            ...['k₁', 'k₂', 'k₃', 'k₄'].map((label) => ({ label, tone: 'neutral' as const })),
        ],
        ...Array.from({ length: 4 }, (_, row) => [
            { label: `q${['₁', '₂', '₃', '₄'][row]}`, tone: 'neutral' as const },
            ...Array.from({ length: 4 }, (_, col) =>
                col <= row
                    ? { label: '●', tone: 'purple' as const }
                    : { label: '·', tone: 'neutral' as const, opacity: 0.35 },
            ),
        ]),
    ]

    const kvHistory = [
        [
            { label: 'K₁', tone: 'blue' as const },
            { label: 'K₂', tone: 'blue' as const },
            { label: '…', tone: 'neutral' as const },
            { label: 'Kₜ', tone: 'warm' as const },
        ],
        [
            { label: 'V₁', tone: 'green' as const },
            { label: 'V₂', tone: 'green' as const },
            { label: '…', tone: 'neutral' as const },
            { label: 'Vₜ', tone: 'warm' as const },
        ],
    ]

    const prefillPanel = Panel({
        c,
        title: 'Prefill · score prompt positions together',
        titleFontSize: 21,
        tone: 'purple',
        width: 628,
        padding: '12px 14px',
        gap: 10,
        shadow: false,
        children: Row({
            gap: 16,
            align: 'center',
            children: [
                Grid({
                    c,
                    rows: causalScores,
                    headerRows: 1,
                    headerCols: 1,
                    cellWidth: 42,
                    cellHeight: 30,
                    gap: 3,
                    fontSize: 20,
                    radius: 5,
                }),
                Column({
                    gap: 8,
                    align: 'stretch',
                    children: [
                        Grid({
                            c,
                            rows: prompt,
                            cellWidth: 80,
                            cellHeight: 32,
                            gap: 4,
                            fontSize: 20,
                            radius: 5,
                        }),
                        TextLabel({
                            c,
                            text: 'Causal row qᵢ sees k₁…kᵢ.',
                            fontSize: 20,
                            color: c.textSecondary,
                        }),
                        Row({
                            gap: 10,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Work: Θ(T² dₖ) / head',
                                    fontSize: 20,
                                    fontWeight: 750,
                                    color: c.primaryLight,
                                }),
                                BadgePill({
                                    c,
                                    text: 'TTFT',
                                    tone: 'purple',
                                    fontSize: 20,
                                    height: 32,
                                    padding: '4px 10px',
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Double T → 4× dense score pairs.',
                            fontSize: 20,
                            color: c.textMuted,
                        }),
                    ],
                }),
            ],
        }),
    })

    const decodePanel = Panel({
        c,
        title: 'Decode · append Kₜ/Vₜ, then attend history',
        titleFontSize: 21,
        tone: 'cyan',
        width: 628,
        padding: '12px 14px',
        gap: 10,
        shadow: false,
        children: Row({
            gap: 14,
            align: 'center',
            children: [
                Column({
                    gap: 6,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'KV cache (length t)',
                            fontSize: 20,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }),
                        Grid({
                            c,
                            rows: kvHistory,
                            cellWidth: 46,
                            cellHeight: 32,
                            gap: 4,
                            fontSize: 20,
                            radius: 5,
                        }),
                    ],
                }),
                FlowArrow({ c, direction: 'right', length: 24, tone: 'cyan' }),
                Column({
                    gap: 8,
                    align: 'stretch',
                    children: [
                        TextLabel({
                            c,
                            text: '1. qₜ scores K₁…Kₜ → softmax',
                            fontSize: 20,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: '2. Weights sum V₁…Vₜ → zₜ',
                            fontSize: 20,
                            color: c.textPrimary,
                        }),
                        Row({
                            gap: 10,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Per step: Θ(t dₖ) / head',
                                    fontSize: 20,
                                    fontWeight: 750,
                                    color: c.textPrimary,
                                }),
                                BadgePill({
                                    c,
                                    text: 'ITL',
                                    tone: 'cyan',
                                    fontSize: 20,
                                    height: 32,
                                    padding: '4px 10px',
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: width - 32,
        align: 'center',
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Prefill Fills a Grid; Decode Grows the Cache',
                    fontSize: 23,
                    fontWeight: 760,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Count dense attention work per head for each phase',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                prefillPanel,
                decodePanel,
                TextLabel({
                    c,
                    text: 'Serving batching and scheduling also shape observed latency.',
                    fontSize: 20,
                    color: c.textMuted,
                    align: 'center',
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
