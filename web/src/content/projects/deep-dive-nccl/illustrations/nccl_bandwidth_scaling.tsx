import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const alt =
    'For four ranks, 268435456 bytes divided by 0.006 seconds gives 44.74 GB/s algorithm bandwidth. Multiplying by 2(4-1)/4, or 1.5, gives 67.11 GB/s bus bandwidth. Device counters are needed to measure physical link traffic.'

export const width = 560
export const height = 350

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    a.text(28, 32, '256 MiB payload · 6 ms', { size: 24, weight: 700 })
    a.text(28, 68, '268,435,456 bytes ÷ 0.006 s', { size: 20, mono: true, color: k.mid })

    const bars = [
        { y: 143, value: 44.74, label: 'Algorithm bandwidth', tone: k.prefill },
        { y: 255, value: 67.11, label: 'Normalized bus bandwidth', tone: k.state },
    ]

    for (const b of bars) {
        a.text(28, b.y - 29, b.label, { size: 20, weight: 650 })
        a.rect(28, b.y, (b.value / 80) * 500, 30, { fill: tint(b.tone, 0.26), r: 3 })
        a.text(28 + (b.value / 80) * 500, b.y + 50, b.value + ' GB/s', {
            size: 24,
            weight: 700,
            align: 'right',
            color: b.tone,
        })
    }

    a.arrow(434, 169, 434, 231, k.mid)
    a.text(414, 203, '× 1.5', { size: 20, mono: true, align: 'right' })
    a.text(28, 332, '4 ranks: 2(k - 1) / k = 1.5', { size: 20, mono: true, color: k.mid })

    return a.render()
}

export default create('dark')
