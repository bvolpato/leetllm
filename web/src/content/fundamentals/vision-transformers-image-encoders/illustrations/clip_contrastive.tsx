import { dotProduct, normalizeVector, stableSoftmax, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'A 3 by 3 CLIP similarity logit matrix pairs street sign, alpine trail, and coastal beam images with captions (scale 3.5). Row 1 softmax turns image 1 logits [3.50, 1.93, 1.47] into probabilities [0.75, 0.16, 0.10] (row 1 CE 0.292), while column 1 softmax turns caption 1 logits [3.50, 1.90, 1.57] into [0.74, 0.15, 0.11] (col 1 CE 0.298), giving symmetric batch InfoNCE loss 0.303.'

const rawImages = [
    [0.92, 0.28, 0.18],
    [0.24, 0.91, 0.25],
    [0.19, 0.26, 0.93],
]
const rawTexts = [
    [0.91, 0.27, 0.2],
    [0.25, 0.92, 0.24],
    [0.18, 0.24, 0.93],
]

const imageEmbs = rawImages.map((v) => normalizeVector(v))
const textEmbs = rawTexts.map((v) => normalizeVector(v))
const logitScale = 3.5

const logits: number[][] = imageEmbs.map((img) =>
    textEmbs.map((txt) => Number((logitScale * dotProduct(img, txt)).toFixed(2))),
)

const rowProbs = logits.map((row) => stableSoftmax(row))
const colProbs = [0, 1, 2].map((colIdx) => stableSoftmax(logits.map((row) => row[colIdx]!)))

const imageLoss = -rowProbs.reduce((acc, probs, i) => acc + Math.log(probs[i]!), 0) / rowProbs.length
const textLoss = -colProbs.reduce((acc, probs, i) => acc + Math.log(probs[i]!), 0) / colProbs.length
const symmetricLoss = (imageLoss + textLoss) / 2

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    // Left: 3x3 similarity logit matrix S
    const matX = 96
    const matY = 80
    const matW = 218
    const matH = 190

    fig.text(matX + matW / 2, 22, 'Similarity logits S (3×3)', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(matX + matW / 2, 43, 'Scale 3.5 · matched pairs on diagonal', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.heatGrid(
        logits,
        { x: matX, y: matY, width: matW, height: matH },
        {
            scale: 'sequential',
            domain: [1.0, 3.6],
            rowLabels: ['I1: Sign', 'I2: Trail', 'I3: Coast'],
            colLabels: ['T1', 'T2', 'T3'],
            labelSize: 13,
            valueSize: 13.5,
            showValues: true,
            gap: 5,
            radius: 6,
            highlightCell: { row: 0, col: 0 },
            highlightColor: green,
            rowLabelGap: 10,
            colLabelGap: 14,
        },
    )

    // Batch symmetric loss TeX readout below matrix
    fig.math(
        matX + matW / 2,
        304,
        `L_i = ${imageLoss.toFixed(2)},\\quad L_t = ${textLoss.toFixed(2)}`,
        { size: 14.5, color: green, align: 'center' },
    )
    fig.text(matX + matW / 2, 336, `Mean symmetric loss = ${symmetricLoss.toFixed(3)}`, {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Subtle divider
    fig.line(340, 26, 340, height - 24, { color: c.borderSubtle, width: 1 })

    // Helper for Row 1 and Col 1 softmax bar plots
    const drawSoftmaxBars = (
        x: number,
        title: string,
        titleColor: string,
        probs: readonly number[],
        xLabels: readonly string[],
        ceLabel: string,
    ) => {
        const w = 158
        const h = 190
        fig.text(x + w / 2, 22, title, {
            size: 14.5,
            weight: 700,
            color: titleColor,
            align: 'center',
        })
        fig.text(x + w / 2, 43, 'Positive vs negatives', {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })

        const p = fig.plot({ x, y: matY, width: w, height: h }, { x: [0, 3], y: [0, 1.0] })
        p.axes({
            xTicks: [],
            yTicks: [0, 0.5, 1.0],
            yFormat: (v) => v.toFixed(1),
            grid: true,
            labelSize: 12,
        })

        const bw = 34
        probs.forEach((val, idx) => {
            const cx = p.px(idx + 0.5)
            const topY = p.py(val)
            const col = idx === 0 ? green : warm
            fig.rect(cx - bw / 2, topY, bw, p.bottom - topY, {
                fill: tint(col, c.bg, isLight ? 0.24 : 0.38),
                stroke: col,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(cx, topY - 10, val.toFixed(2), {
                size: 12.5,
                weight: 700,
                color: col,
                align: 'center',
                mono: true,
            })
            fig.text(cx, p.bottom + 15, xLabels[idx]!, {
                size: 12.5,
                weight: 600,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        })

        fig.text(x + w / 2, 314, ceLabel, {
            size: 13.5,
            weight: 700,
            color: titleColor,
            align: 'center',
            mono: true,
        })
    }

    drawSoftmaxBars(
        392,
        'Row 1: P(T | I₁)',
        blue,
        rowProbs[0]!,
        ['T1', 'T2', 'T3'],
        `Row 1 CE = ${(-Math.log(rowProbs[0]![0]!)).toFixed(3)}`,
    )
    drawSoftmaxBars(
        584,
        'Col 1: P(I | T₁)',
        purple,
        colProbs[0]!,
        ['I1', 'I2', 'I3'],
        `Col 1 CE = ${(-Math.log(colProbs[0]![0]!)).toFixed(3)}`,
    )

    return fig.render()
}

export default create('dark')
