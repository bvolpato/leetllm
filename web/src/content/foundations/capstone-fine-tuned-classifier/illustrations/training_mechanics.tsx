import React from 'react'
import { LineChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 560
export const autoSize = false
export const alt =
    'Training NLL decreases steadily from 1.21 to 0.069 across 45 epochs while validation NLL bottoms at 0.150 at Epoch 20 before rising to 0.255.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    return (
        <Scene c={c} padding={12} contentWidth={616}>
            <LineChart
                c={c}
                width={616}
                height={300}
                title="PhraseCNN Loss: Train vs Val Overconfidence"
                subtitle="Val NLL bottoms at 0.150 (Ep 20), then climbs to 0.255 (Ep 45)"
                labels={['1', '5', '10', '15', '20', '24', '30', '35', '40', '45']}
                min={0}
                max={1.35}
                format="decimal"
                yAxisLabel="NLL"
                showGrid={false}
                showPoints
                directLabels
                ariaLabel={alt}
                series={[
                    {
                        name: 'Train NLL',
                        color: 'primary',
                        points: [
                            1.21, 0.523, 0.316, 0.244, 0.193, 0.163, 0.127, 0.103, 0.082, 0.069,
                        ],
                    },
                    {
                        name: 'Val NLL',
                        color: 'warning',
                        points: [
                            1.17, 0.417, 0.248, 0.228, 0.15, 0.192, 0.179, 0.216, 0.218, 0.255,
                        ],
                    },
                ]}
                footer="Epochs 1 to 45 · Accuracy stays near 95% even while margins grow overconfident"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
