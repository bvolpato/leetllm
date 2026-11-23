import React from 'react'
import { Column, Row, Scene, StackedBar, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'GPU Failure Operations. Synthetic 40 GiB device: 36.70 GiB reserved by PyTorch, 2.68 GiB outside reserve, and 0.62 GiB free. After a failed 1.50 GiB request, inspect allocator and device evidence before deciding whether to drain the node.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), shadow: 'transparent' }
    const label = (text: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: { display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 650, color },
    }, text)
    return Scene({ c, background: c.bg, padding: 48, gap: 34, contentWidth: 1104, children: [
        label('GPU Failure Operations', 48),
        label('Synthetic incident: one request exceeds free memory.', 29, c.textSecondary),
        Column({ gap: 22, children: [
            label('40 GiB device · PyTorch reserve: 36.70 GiB', 26),
            StackedBar({ c, width: 1096, height: 90, showLegend: false, segments: [
                { label: 'PyTorch reserved', value: 36.70, valueLabel: '', color: c.secondary },
                { label: 'Outside', value: 2.68, valueLabel: '', color: c.warning },
                { label: 'Free', value: 0.62, valueLabel: '', color: c.positive },
            ] }),
            Row({ gap: 48, children: [
                label('Outside reserve: 2.68 GiB', 24, c.warning),
                label('Free: 0.62 GiB', 24, c.positive),
            ] }),
        ] }),
        label('Failed request: 1.50 GiB', 30, c.critical),
        label('Capture evidence before choosing the repair scope.', 27),
        Row({ justify: 'end', children: label('LeetLLM', 26, c.accent) }),
    ] })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
