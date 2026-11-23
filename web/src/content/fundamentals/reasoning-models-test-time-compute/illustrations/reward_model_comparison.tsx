import React from 'react'
import { Heatmap, Scene, defineIllustration } from 'vizmatic'

export const width = 820
export const height = 380
export const opaqueBackground = false

export const alt =
    'Heatmap comparing Outcome Reward Model (ORM) and Process Reward Model (PRM) scores across steps S1 through S8. The ORM gives no intermediate signal and scores 0.12 at S8, whereas the PRM scores S1 to S3 near 0.90 and drops immediately to 0.15 at error step S4.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.1} padding={14}>
        <Heatmap
            c={c}
            xLabels={['S1', 'S2', 'S3', 'S4*', 'S5', 'S6', 'S7', 'S8']}
            yLabels={['ORM (terminal)', 'PRM (per-step)']}
            data={[
                [0, 0, 0, 0, 0, 0, 0, 0.12],
                [0.92, 0.94, 0.89, 0.15, 0.12, 0.09, 0.07, 0.05],
            ]}
            labels={[
                ['-', '-', '-', '-', '-', '-', '-', '0.12'],
                ['0.92', '0.94', '0.89', '0.15', '0.12', '0.09', '0.07', '0.05'],
            ]}
            cellWidth={66}
            cellHeight={74}
            rowLabelWidth={220}
            fontSize={24}
            colorScale="strength"
            highlightCell={{ row: 1, col: 3 }}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
