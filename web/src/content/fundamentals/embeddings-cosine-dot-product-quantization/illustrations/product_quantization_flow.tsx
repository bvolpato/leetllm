import { Column, FlowArrow, Grid, Heatmap, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Grid splits 8-dimensional embeddings into four 2d subspaces for two documents: FlashAttention stores centroid code [1, 1, 1, 1] and LayerNorm stores [0, 0, 0, 0]. Below a downward FlowArrow, a 2x4 Heatmap displays the asymmetric distance lookup table between unquantized query subvectors and centroid IDs 0 and 1, giving total squared distance 0.08 vs 56.57.'
export const width = 640
export const height = 760

const lookupData = [
    [12.1, 4.49, 30.28, 9.7],
    [0.02, 0.02, 0.02, 0.02],
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        title: 'Product quantization replaces vector scans with table sums',
        subtitle: 'Four 2d subspaces with exact query subvectors against stored centroid IDs',
        padding: 14,
        gap: 8,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Stored 4-byte PQ codes across subspaces s₁..s₄',
                    fontSize: 20,
                    align: 'center',
                }),
                Grid({
                    c,
                    cellWidth: 114,
                    cellHeight: 44,
                    gap: 6,
                    fontSize: 19,
                    rows: [
                        [
                            { label: 'Document', tone: 'neutral' },
                            { label: 's₁ [0:2]', tone: 'purple' },
                            { label: 's₂ [2:4]', tone: 'blue' },
                            { label: 's₃ [4:6]', tone: 'cyan' },
                            { label: 's₄ [6:8]', tone: 'green' },
                        ],
                        [
                            { label: 'FlashAttn', tone: 'green' },
                            { label: 'id = 1', tone: 'green' },
                            { label: 'id = 1', tone: 'green' },
                            { label: 'id = 1', tone: 'green' },
                            { label: 'id = 1', tone: 'green' },
                        ],
                        [
                            { label: 'LayerNorm', tone: 'red' },
                            { label: 'id = 0', tone: 'red' },
                            { label: 'id = 0', tone: 'red' },
                            { label: 'id = 0', tone: 'red' },
                            { label: 'id = 0', tone: 'red' },
                        ],
                    ],
                }),
                FlowArrow({ c, direction: 'down', length: 24, tone: 'cyan' }),
                TextLabel({
                    c,
                    text: 'Per-query ADC table T[id][s] = ‖qₛ − cₛ,id‖²',
                    fontSize: 20,
                    align: 'center',
                    math: true,
                }),
                Heatmap({
                    c,
                    data: lookupData,
                    xLabels: ['s₁', 's₂', 's₃', 's₄'],
                    yLabels: ['ID 0', 'ID 1'],
                    cellWidth: 112,
                    cellHeight: 48,
                    rowLabelWidth: 78,
                    colorScale: 'strength',
                    fontSize: 20,
                }),
                TextLabel({
                    c,
                    text: 'FlashAttn [1,1,1,1]: 0.02 + 0.02 + 0.02 + 0.02 = 0.08',
                    fontSize: 20,
                    align: 'center',
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'LayerNorm [0,0,0,0]: 12.10 + 4.49 + 30.28 + 9.70 = 56.57',
                    fontSize: 20,
                    align: 'center',
                    math: true,
                }),
            ],
        }),
    })
}

export default create('dark')
