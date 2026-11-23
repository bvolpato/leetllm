import { Column, FlowArrow, Grid, Heatmap, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Product quantization diagram partitions a 16-dimensional vector into four 4-dimensional subspaces s1 through s4 and assigns discrete centroid code [1, 0, 3, 1]. Below a downward FlowArrow, a 4x4 Heatmap shows asymmetric squared distances T[k][s] computed against an unquantized query. Looking up each stored byte gives 0.09 + 0.33 + 0.06 + 0.42 = 0.90 to approximate squared L2 distance.'
export const width = 640
export const height = 760

const subspaceGrid = ['s₁ [0:4]', 's₂ [4:8]', 's₃ [8:12]', 's₄ [12:16]']
const codeBytes = ['k₁ = 1', 'k₂ = 0', 'k₃ = 3', 'k₄ = 1']
const tones = ['purple', 'blue', 'cyan', 'green'] as const

const lookupData = [
    [0.72, 0.33, 0.61, 2.75],
    [0.09, 1.99, 0.8, 0.42],
    [0.56, 1.14, 1.14, 1.53],
    [0.58, 0.91, 0.06, 1.01],
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const strip = (values: string[]) =>
        Grid({
            c,
            cellWidth: 132,
            cellHeight: 46,
            gap: 6,
            fontSize: 20,
            math: true,
            rows: [values.map((label, index) => ({ label, tone: tones[index] }))],
        })

    return Scene({
        c,
        title: 'Product quantization replaces vector slices with table lookups',
        subtitle: 'Each stored centroid byte selects one entry from a per-query distance table',
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
                    text: '16d vector split into 4 subspaces → 4 stored centroid IDs',
                    fontSize: 20,
                    align: 'center',
                }),
                strip(subspaceGrid),
                strip(codeBytes),
                FlowArrow({ c, direction: 'down', length: 30, tone: 'cyan' }),
                TextLabel({
                    c,
                    text: 'ADC query table T[k][s] = ‖qₛ − cₛ,ₖ‖²',
                    fontSize: 21,
                    align: 'center',
                    math: true,
                }),
                Heatmap({
                    c,
                    data: lookupData,
                    xLabels: ['s₁', 's₂', 's₃', 's₄'],
                    yLabels: ['k=0', 'k=1', 'k=2', 'k=3'],
                    cellWidth: 108,
                    cellHeight: 46,
                    rowLabelWidth: 74,
                    colorScale: 'strength',
                    fontSize: 20,
                }),
                TextLabel({
                    c,
                    text: 'Sum for [1, 0, 3, 1]: 0.09 + 0.33 + 0.06 + 0.42 = 0.90',
                    fontSize: 21,
                    align: 'center',
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'Query q stays exact; database vectors store centroid IDs.',
                    fontSize: 19,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
