import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Bidirectional spatial self-attention in a Vision Transformer contrasted with a causal decoder mask. In the 5-token ViT street scene, [CLS] and early patches attend freely to later tokens such as Sign (0.36) and Road. In the causal mask, upper-triangular entries where key index exceeds query index stay masked to zero before softmax.'

const tokens = ['CLS', 'Sky', 'Tree', 'Sign', 'Road'] as const

const vitWeights: number[][] = [
    [0.12, 0.14, 0.24, 0.36, 0.14],
    [0.1, 0.42, 0.2, 0.18, 0.1],
    [0.14, 0.18, 0.34, 0.22, 0.12],
    [0.16, 0.14, 0.18, 0.38, 0.14],
    [0.12, 0.12, 0.18, 0.24, 0.34],
]

const causalWeights: number[][] = [
    [1.0, 0.0, 0.0, 0.0, 0.0],
    [0.3, 0.7, 0.0, 0.0, 0.0],
    [0.22, 0.26, 0.52, 0.0, 0.0],
    [0.18, 0.16, 0.2, 0.46, 0.0],
    [0.15, 0.14, 0.19, 0.22, 0.3],
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const warm = fig.tone('warm')

    const gridW = 285
    const gridH = 235
    const gridY = 82

    // Left panel: Bidirectional ViT Encoder
    const leftX = 68
    fig.text(leftX + gridW / 2, 22, 'ViT encoder · bidirectional', {
        size: 15.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(leftX + gridW / 2, 43, 'Every patch attends to all 5 tokens (Sign row highlighted)', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.heatGrid(
        vitWeights,
        { x: leftX, y: gridY, width: gridW, height: gridH },
        {
            scale: 'sequential',
            domain: [0, 0.6],
            rowLabels: tokens,
            colLabels: tokens,
            labelSize: 12.5,
            valueSize: 12.5,
            showValues: true,
            gap: 4,
            radius: 5,
            highlightRow: 3,
            highlightColor: blue,
            rowLabelGap: 10,
            colLabelGap: 14,
        },
    )

    // Compact highlight chip below left grid
    fig.rect(leftX + 34, gridY + gridH + 22, gridW - 68, 30, {
        fill: tint(blue, c.bg, isLight ? 0.1 : 0.18),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 15,
    })
    fig.text(leftX + gridW / 2, gridY + gridH + 37, 'CLS attends to Sign (0.36)', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })

    // Subtle vertical divider between the two matrices
    fig.line(384, 30, 384, height - 24, { color: c.borderSubtle, width: 1 })

    // Right panel: Causal LLM Decoder
    const rightX = 454
    fig.text(rightX + gridW / 2, 22, 'Causal decoder · masked', {
        size: 15.5,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(rightX + gridW / 2, 43, 'Hatched cells masked (key > query)', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.heatGrid(
        causalWeights,
        { x: rightX, y: gridY, width: gridW, height: gridH },
        {
            scale: 'sequential',
            domain: [0, 1.0],
            rowLabels: tokens,
            colLabels: tokens,
            labelSize: 12.5,
            valueSize: 12.5,
            showValues: true,
            causal: true,
            gap: 4,
            radius: 5,
            highlightRow: 1,
            highlightColor: warm,
            rowLabelGap: 10,
            colLabelGap: 14,
        },
    )

    fig.rect(rightX + 26, gridY + gridH + 22, gridW - 52, 30, {
        fill: tint(warm, c.bg, isLight ? 0.1 : 0.18),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 15,
    })
    fig.text(rightX + gridW / 2, gridY + gridH + 37, 'Prefix cannot read later slots', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
