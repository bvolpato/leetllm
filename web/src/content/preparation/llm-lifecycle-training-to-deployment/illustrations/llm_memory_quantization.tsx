import React from 'react'
import {
    BarChart,
    Column,
    Panel,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 800
export const alt =
    'Top chart compares 70B LLM memory footprint across precisions: BF16 weights take 130.4 GiB, INT8 takes 65.2 GiB, INT4 weights alone take 32.6 GiB, and INT4 weights plus two 32k KV-cache requests reach 52.6 GiB. Bottom chart shows output distortion |x|*|dW| where Channel 1 with |x|=2.0 dominates (0.040 vs 0.020) until AWQ channel scaling drops it to 0.010.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.95)
    const warm = getReadableToneColor('warm', c)
    return (
        <Scene c={c} padding={12} gap={10}>
            <Column gap={10} align="stretch">
                <Panel
                    c={c}
                    title="70B Serving VRAM Budget (Weights + 32k KV Cache, GiB)"
                    width={636}
                    padding={12}
                    tone="blue"
                >
                    <BarChart
                        c={c}
                        width={608}
                        height={176}
                        subtitle="Weight compression alone still leaves active KV cache on the GPU"
                        min={0}
                        max={145}
                        yAxisLabel="GiB"
                        showValues
                        data={[
                            { label: 'BF16 W', value: 130.4, color: 'purple' },
                            { label: 'INT8 W', value: 65.2, color: 'blue' },
                            { label: 'INT4 W', value: 32.6, color: 'green' },
                            { label: 'INT4 + 2xKV', value: 52.6, color: warm },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Outlier Activation Error (|x| * |dW|)"
                    width={636}
                    padding={12}
                    tone="purple"
                >
                    <BarChart
                        c={c}
                        width={608}
                        height={176}
                        subtitle="AWQ scales salient weight channels before rounding to suppress outlier distortion"
                        min={0}
                        max={0.05}
                        yAxisLabel="Error"
                        showValues
                        data={[
                            { label: 'Ch1 (|x|=2.0)', value: 0.04, color: 'critical' },
                            { label: 'Ch2 (|x|=0.25)', value: 0.02, color: 'blue' },
                            { label: 'AWQ Scaled Ch1', value: 0.01, color: 'green' },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
