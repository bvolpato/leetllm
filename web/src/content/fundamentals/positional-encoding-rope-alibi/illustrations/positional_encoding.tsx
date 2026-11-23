import { Column, Flow, Panel, Scene, getThemeColors, withDensity, type ThemeMode } from 'vizmatic'

const DENSITY = 2.5

export const width = 848
export const height = 740
export const alt =
    'Three attention pipelines compare where position enters: additive embeddings modify token vectors before QKV projections, RoPE rotates projected queries and keys in 2D pairs while leaving values unrotated, and ALiBi adds a distance penalty directly to pre-softmax logits.'

function makePositionalEncoding(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)

    const additivePanel = Panel({
        c,
        title: '1. Additive PE · Embeddings (Vaswani / GPT-2)',
        subtitle: 'Adds p_i before QKV projections so V carries position',
        tone: 'blue',
        titleFontSize: 27,
        padding: 10,
        gap: 6,
        width: 800,
        children: Flow({
            c,
            direction: 'horizontal',
            gap: 4,
            connectorLength: 10,
            stages: [
                {
                    title: 'Input x_i',
                    subtitle: 'Content',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: '+ Pos p_i',
                    subtitle: 'Before QKV',
                    tone: 'blue',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: 'Proj QKV',
                    subtitle: 'Mixes V',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: 'Score',
                    subtitle: 'Implicit',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
            ],
        }),
    })

    const ropePanel = Panel({
        c,
        title: '2. RoPE · Projected Q & K (RoFormer / Llama)',
        subtitle: 'Rotates 2D pairs after projection; V stays unrotated',
        tone: 'green',
        titleFontSize: 27,
        padding: 10,
        gap: 6,
        width: 800,
        children: Flow({
            c,
            direction: 'horizontal',
            gap: 4,
            connectorLength: 10,
            stages: [
                {
                    title: 'Input x_i',
                    subtitle: 'Content',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: 'Proj QKV',
                    subtitle: 'Clean V',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: 'Rot Q,K',
                    subtitle: 'R(m), R(n)',
                    tone: 'green',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: 'QK^T',
                    subtitle: 'Offset n−m',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
            ],
        }),
    })

    const alibiPanel = Panel({
        c,
        title: '3. ALiBi · Pre-Softmax Logits (Press et al.)',
        subtitle: 'Adds −m_h(i − j) to logits; Q, K, V untouched',
        tone: 'warm',
        titleFontSize: 27,
        padding: 10,
        gap: 6,
        width: 800,
        children: Flow({
            c,
            direction: 'horizontal',
            gap: 4,
            connectorLength: 10,
            stages: [
                {
                    title: 'Input x_i',
                    subtitle: 'Content',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: 'Proj QKV',
                    subtitle: 'Untouched',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: '+ Bias B',
                    subtitle: '−m_h(i−j)',
                    tone: 'warm',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
                {
                    title: 'Softmax',
                    subtitle: 'Recency',
                    tone: 'neutral',
                    width: 174,
                    minHeight: 80,
                    padding: 5,
                },
            ],
        }),
    })

    return Scene({
        c,
        density: DENSITY,
        padding: 12,
        gap: 10,
        contentWidth: 800,
        children: Column({
            gap: 10,
            children: [additivePanel, ropePanel, alibiPanel],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makePositionalEncoding(theme)
}

export default create('dark')
