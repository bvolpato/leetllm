import React from 'react'
import { LineChart, Scene, defineIllustration } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 560
export const height = 430
export const alt =
    'Holdout horizon-1 parcel demand from March 29 through April 30 comparing actual daily counts against the q80 staffing plan and upper and lower 90 percent split conformal bounds'

const DATES = [
    '03-29',
    '',
    '',
    '',
    '',
    '',
    '04-04',
    '',
    '',
    '',
    '',
    '',
    '',
    '04-11',
    '',
    '',
    '',
    '',
    '',
    '',
    '04-18',
    '',
    '',
    '',
    '',
    '',
    '',
    '04-25',
    '',
    '',
    '',
    '',
    '04-30',
]

const ACTUAL = [
    281, 215, 254, 262, 238, 224, 245, 202, 187, 219, 230, 228, 239, 253, 221, 285, 262, 238, 245,
    222, 244, 187, 189, 249, 230, 252, 262, 264, 291, 207, 247, 247, 233,
]
const Q80 = [
    240, 249, 243, 237, 246, 252, 256, 230, 241, 251, 241, 233, 247, 244, 232, 289, 255, 240, 238,
    243, 244, 203, 195, 234, 230, 241, 241, 246, 285, 238, 258, 250, 249,
]
const HIGH_90 = [
    276, 278, 268, 263, 267, 271, 263, 242, 257, 266, 261, 255, 277, 273, 269, 312, 285, 268, 259,
    261, 264, 233, 214, 256, 257, 259, 269, 275, 296, 269, 284, 286, 276,
]
const LOW_90 = [
    216, 218, 208, 203, 207, 210, 203, 182, 196, 206, 201, 195, 217, 213, 209, 252, 225, 208, 199,
    200, 203, 173, 154, 196, 197, 199, 209, 215, 236, 209, 224, 226, 216,
]

const illustration = defineIllustration((c: ThemeColors) => (
    <Scene c={c} density={1.65} padding={16} gap={10} contentWidth={528}>
        <LineChart
            c={c}
            subtitle="Conformal q90 radius +/-30.1 parcels | Holdout coverage 90.6%"
            width={528}
            height={285}
            labels={DATES}
            min={140}
            max={330}
            yAxisLabel="Daily parcels"
            showGrid
            directLabels={false}
            series={[
                { name: 'Actual', points: ACTUAL, color: 'primary' },
                { name: 'q80 Plan', points: Q80, color: 'positive' },
                { name: 'Upper 90%', points: HIGH_90, color: 'warning' },
                { name: 'Lower 90%', points: LOW_90, color: 'neutral' },
            ]}
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
