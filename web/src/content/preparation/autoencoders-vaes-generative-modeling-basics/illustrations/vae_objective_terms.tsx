import React from 'react'
import {
    BarChart,
    Column,
    LineChart,
    Panel,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 760
export const alt =
    'Two charts showing a beta-VAE sweep on 5x5 patches with 4 latent dimensions: as beta rises from 0.05 to 2.00, KL divergence drops from 3.80 to 0.00 nats while reconstruction sum-squared error rises from 0.09 to 1.23, pruning active latent dimensions from 4 at beta=0.00 down to 2 at beta=0.10-0.50 and collapsing to 0 at beta=1.00.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.95)
    const warm = getReadableToneColor('warm', c)

    return (
        <Scene c={c} padding={12} gap={12}>
            <Column gap={12} align="stretch">
                <Panel
                    c={c}
                    title="ELBO Rate-Distortion Across Beta"
                    width={636}
                    padding={12}
                    tone="blue"
                >
                    <LineChart
                        c={c}
                        width={608}
                        height={190}
                        subtitle="5x5 patch VAE (z_dim = 4); unregularized beta = 0.00 hits KL = 34.6"
                        labels={['0.05', '0.10', '0.25', '0.50', '1.00', '2.00']}
                        min={0}
                        max={4.2}
                        yAxisLabel="Nats / SSE"
                        directLabels
                        showPoints
                        format="decimal"
                        series={[
                            {
                                name: 'KL (nats)',
                                points: [3.8, 2.69, 1.68, 0.85, 0.0, 0.0],
                                color: 'purple',
                            },
                            {
                                name: 'Recon SSE',
                                points: [0.09, 0.13, 0.32, 0.62, 1.22, 1.23],
                                color: warm,
                                area: true,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Active Latent Dimensions by Beta"
                    width={636}
                    padding={12}
                    tone="green"
                >
                    <BarChart
                        c={c}
                        width={608}
                        height={190}
                        subtitle="Dimensions with KL > 0.1 nats; true patch manifold has 2 factors"
                        min={0}
                        max={4.8}
                        yAxisLabel="Active z dims"
                        format="integer"
                        showValues
                        data={[
                            { label: '0.00', value: 4, color: 'critical' },
                            { label: '0.05', value: 3, color: 'blue' },
                            { label: '0.10', value: 2, color: 'green' },
                            { label: '0.25', value: 2, color: 'green' },
                            { label: '0.50', value: 2, color: warm },
                            { label: '1.00', value: 0, color: 'critical' },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
