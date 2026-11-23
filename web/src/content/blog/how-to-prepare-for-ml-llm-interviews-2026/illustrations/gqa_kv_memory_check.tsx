import { BarChart, Column, Scene, StepCard, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 700
export const autoSize = false
export const alt =
    'Bar chart compares single-sequence FP16 KV-cache memory at 32,768 tokens for a 32-layer decoder with head dimension 128: Multi-Head Attention with 32 KV heads uses 16.00 GiB, Grouped-Query Attention with 8 KV heads uses 4.00 GiB, GQA with 2 KV heads uses 1.00 GiB, and Multi-Query Attention with 1 KV head uses 0.50 GiB.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 616,
        children: Column({
            width: 616,
            gap: 12,
            children: [
                BarChart({
                    c,
                    width: 616,
                    height: 240,
                    title: 'KV-Cache Footprint at 32K Context (32L, d=128, FP16)',
                    subtitle: 'GiB per sequence scales linearly with n_kv_heads',
                    min: 0,
                    max: 20,
                    format: (value: number) => `${value.toFixed(1)}`,
                    showGrid: false,
                    showValues: true,
                    data: [
                        {
                            label: 'MHA (32 KV)',
                            value: 16.0,
                            valueLabel: '16.00 GiB',
                            color: 'warning',
                        },
                        {
                            label: 'GQA (8 KV)',
                            value: 4.0,
                            valueLabel: '4.00 GiB',
                            color: 'primary',
                        },
                        {
                            label: 'GQA (2 KV)',
                            value: 1.0,
                            valueLabel: '1.00 GiB',
                            color: 'positive',
                        },
                        { label: 'MQA (1 KV)', value: 0.5, valueLabel: '0.50 GiB', color: 'info' },
                    ],
                }),
                StepCard({
                    c,
                    width: 616,
                    padding: 12,
                    tone: 'blue',
                    eyebrow: 'INTERVIEW CHECK',
                    title: 'Verify KV bytes, causal mask stability, and throughput together',
                    subtitle:
                        'GQA-8 cuts 32K sequence KV state 4x (16.00 to 4.00 GiB) before batching.',
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
