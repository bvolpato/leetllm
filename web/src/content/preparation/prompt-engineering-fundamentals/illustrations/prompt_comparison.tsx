import React from 'react'
import { Matrix, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'
import capture from '../assets/prompt-capture.json'

export const width = 900
export const height = 320
export const alt =
    'Food-label match for eight captured reviews. The baseline matches r4, r5, r6, and r7. The food-specific prompt matches all eight. One denotes a match and zero a mismatch.'

const matches = capture.runs.map((run) => {
    const predictions: { id: string; label: string }[] = JSON.parse(run.raw_response)
    return capture.cases.map((review) =>
        Number(
            predictions.find((prediction) => prediction.id === review.id)?.label ===
                review.expected,
        ),
    )
})
const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.8)
    return (
        <Scene c={c} padding={24} gap={16} title="Food-label match: 1 = yes, 0 = no">
            <Matrix
                c={c}
                data={matches}
                colLabels={capture.cases.map((review) => review.id)}
                rowLabels={matches.map(
                    (row, i) =>
                        `${i === 0 ? 'Baseline' : 'Food only'}  ${row.reduce((a, b) => a + b, 0)}/8`,
                )}
                cellWidth={78}
                cellHeight={72}
                rowLabelWidth={200}
                fontSize={24}
                colorize
                colorScale="strength"
                colorDomain={[0, 1]}
                format="integer"
            />
        </Scene>
    )
})
export const create = illustration.create
export default illustration.default
