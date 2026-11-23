import React from 'react'
import {
    BarChart,
    Matrix,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    dotProduct,
    getReadableToneColor,
    normalizeVector,
    stableSoftmax,
    withDensity,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 840
export const height = 510
export const alt =
    'A 3 by 3 CLIP similarity logit matrix pairs street sign, alpine trail, and coastal beam images with captions. Row softmax turns image 1 logits [3.50, 1.93, 1.47] into probabilities [0.75, 0.16, 0.10] with cross-entropy 0.292, while column softmax turns caption 1 logits [3.50, 1.90, 1.57] into [0.74, 0.15, 0.11] with cross-entropy 0.298 and symmetric InfoNCE mean 0.303.'

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
const colProbs = [0, 1, 2].map((colIdx) => stableSoftmax(logits.map((row) => row[colIdx])))

const imageLoss = -rowProbs.reduce((acc, probs, i) => acc + Math.log(probs[i]), 0) / rowProbs.length
const textLoss = -colProbs.reduce((acc, probs, i) => acc + Math.log(probs[i]), 0) / colProbs.length
const symmetricLoss = (imageLoss + textLoss) / 2

const labels = ['Sign', 'Trail', 'Coast']

const pill = (text: string, tone: ToneName, c: ThemeColors) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7px 14px',
            borderRadius: 999,
            border: '2px solid ' + getReadableToneColor(tone, c, c.bgSubtle),
            background: c.bgSubtle,
            color: getReadableToneColor(tone, c, c.bgSubtle),
            fontSize: 25,
            fontWeight: 700,
            whiteSpace: 'nowrap',
        }}
    >
        {text}
    </div>
)

const illustration = defineIllustration((c) => {
    const chartC = withDensity(c, 2.75)
    return (
        <Scene c={c} background={c.bg} padding={18} contentWidth={804} gap={12}>
            <TextLabel
                text={`CLIP InfoNCE: align pairs on diagonal (symmetric loss ${symmetricLoss.toFixed(3)})`}
                c={c}
                fontSize={27}
                fontWeight={700}
                math={false}
            />
            <Row gap={12} align="stretch" justify="space-between" width="100%">
                <Panel
                    c={c}
                    title="Similarity logits S (3x3)"
                    tone="green"
                    width={332}
                    padding={12}
                    gap={8}
                    align="center"
                    titleFontSize={25}
                >
                    <TextLabel
                        text="Scale = 3.5 | Positive pairs"
                        c={c}
                        fontSize={25}
                        color={c.textSecondary}
                        math={false}
                    />
                    <Matrix
                        data={logits}
                        c={c}
                        rowLabels={labels.map((l, i) => `I${i + 1}:${l}`)}
                        colLabels={['T1', 'T2', 'T3']}
                        cellWidth={72}
                        cellHeight={48}
                        rowLabelWidth={102}
                        fontSize={25}
                        format="decimal"
                        colorScale="strength"
                        highlightCell={{ row: 0, col: 0 }}
                        ariaLabel="3 by 3 CLIP similarity logit matrix with positive diagonal"
                    />
                    {pill(`L_i=${imageLoss.toFixed(2)}  L_t=${textLoss.toFixed(2)}`, 'green', c)}
                </Panel>

                <Panel
                    c={c}
                    title="Row 1: P(T | I1)"
                    tone="blue"
                    width={224}
                    padding={12}
                    gap={6}
                    align="center"
                    titleFontSize={25}
                >
                    <BarChart
                        c={chartC}
                        width={214}
                        height={224}
                        max={1.0}
                        showValues={false}
                        showGrid
                        format="decimal"
                        ariaLabel="Softmax probabilities for Image 1 across three captions"
                        data={rowProbs[0].map((val, idx) => ({
                            label: `${idx + 1}`,
                            value: Number(val.toFixed(2)),
                            color: idx === 0 ? 'positive' : 'warning',
                        }))}
                    />
                    <TextLabel
                        text={rowProbs[0].map((v) => v.toFixed(2)).join('  ')}
                        c={c}
                        fontSize={25}
                        fontWeight={700}
                        math={false}
                    />
                    <TextLabel
                        text={`CE: ${(-Math.log(rowProbs[0][0])).toFixed(3)}`}
                        c={c}
                        fontSize={25}
                        math={false}
                    />
                </Panel>

                <Panel
                    c={c}
                    title="Col 1: P(I | T1)"
                    tone="purple"
                    width={224}
                    padding={12}
                    gap={6}
                    align="center"
                    titleFontSize={25}
                >
                    <BarChart
                        c={chartC}
                        width={214}
                        height={224}
                        max={1.0}
                        showValues={false}
                        showGrid
                        format="decimal"
                        ariaLabel="Softmax probabilities for Caption 1 across three images"
                        data={colProbs[0].map((val, idx) => ({
                            label: `${idx + 1}`,
                            value: Number(val.toFixed(2)),
                            color: idx === 0 ? 'positive' : 'warning',
                        }))}
                    />
                    <TextLabel
                        text={colProbs[0].map((v) => v.toFixed(2)).join('  ')}
                        c={c}
                        fontSize={25}
                        fontWeight={700}
                        math={false}
                    />
                    <TextLabel
                        text={`CE: ${(-Math.log(colProbs[0][0])).toFixed(3)}`}
                        c={c}
                        fontSize={25}
                        math={false}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
