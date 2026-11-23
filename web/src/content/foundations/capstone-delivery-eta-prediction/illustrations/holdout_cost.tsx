import React from 'react'
import { LineChart, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 380
export const alt =
    'Validation cost per parcel across alert thresholds from 0.06 to 0.82 comparing calibrated and uncalibrated GBDT late-risk probabilities'

const THRESHOLDS = ['0.06', '', '', '0.26', '', '', '0.50', '', '', '', '0.82']
const CALIBRATED_COST = [1.37, 1.1, 0.95, 0.88, 1.01, 1.31, 1.46, 1.41, 1.71, 1.87, 2.17]
const RAW_COST = [1.29, 1.46, 1.44, 1.44, 1.41, 1.59, 1.56, 1.54, 1.71, 1.71, 1.89]

const illustration = defineIllustration((c: ThemeColors) => (
    <Scene c={c} density={1.65} padding={16} gap={10} contentWidth={528}>
        <LineChart
            c={c}
            width={528}
            height={295}
            labels={THRESHOLDS}
            min={0.6}
            max={2.4}
            yAxisLabel="Cost / parcel ($)"
            showGrid
            showPoints
            directLabels
            series={[
                {
                    name: 'Calibrated',
                    points: CALIBRATED_COST,
                    color: 'positive',
                    area: true,
                },
                { name: 'Uncalibrated', points: RAW_COST, color: 'warning' },
            ]}
            footer="Threshold sweep ($22 missed late parcel vs $3 false alert); min $0.88 at 0.26"
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
