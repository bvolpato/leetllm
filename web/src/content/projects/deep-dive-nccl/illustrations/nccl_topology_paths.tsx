import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'
export const alt =
    'Two separate paths run vertically. Within one host, GPU 0 uses NVLink through NVSwitch to GPU 1. Across hosts, GPU 0 uses PCIe to NIC A, IB or RoCE fabric to NIC B, and PCIe to GPU 4. NVSwitch is not in the PCIe-to-NIC path.'
export const width = 560
export const height = 570
export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)
    const node = (x: number, y: number, label: string, color: string, w = 170) => {
        a.rect(x - w / 2, y - 25, w, 50, { fill: tint(color, 0.1), stroke: tint(color, 0.4), r: 5 })
        a.text(x, y, label, { size: 21, weight: 650, align: 'center' })
    }
    a.text(144, 28, 'Within one host', { size: 22, weight: 700, align: 'center' })
    a.text(416, 28, 'Across hosts', { size: 22, weight: 700, align: 'center' })
    node(144, 101, 'GPU 0', k.prefill)
    node(144, 270, 'NVSwitch', k.state)
    node(144, 439, 'GPU 1', k.prefill)
    a.arrow(144, 131, 144, 239, k.state)
    a.arrow(144, 300, 144, 408, k.state)
    a.text(158, 182, 'NVLink', { size: 20, color: k.state })
    a.text(158, 351, 'NVLink', { size: 20, color: k.state })
    const labels = ['GPU 0 · host A', 'NIC A', 'IB / RoCE', 'NIC B', 'GPU 4 · host B']
    labels.forEach((label, i) => {
        const y = 101 + i * 103
        node(416, y, label, i === 2 ? k.wait : i % 2 ? k.decode : k.prefill, 218)
        if (i < 4) a.arrow(416, y + 29, 416, y + 74, k.mid)
    })
    a.text(435, 153, 'PCIe', { size: 18, color: k.mid })
    a.text(435, 462, 'PCIe', { size: 18, color: k.mid })
    a.line(280, 58, 280, 546, k.line)
    return a.render()
}
export default create('dark')
