import React from 'react'
import { BarChart, Column, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'LLM Benchmarks & Limitations. In a hypothetical pool of 100 code samples with 20 passing programs, pass at 1 is 20% and the pass at 10 estimate is 90.5%. Evaluate deployed selectors on their target workload.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({
        c, background: c.bg, padding: 40, gap: 0, contentWidth: 1120,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1120, height: 550 } },
            React.createElement('div', { style: { position: 'absolute', top: 0, left: 0, display: 'flex' } },
                TextLabel({ c, text: 'LLM Benchmarks & Limitations', fontSize: 48, fontWeight: 800, color: c.textPrimary })),
            React.createElement('div', { style: { position: 'absolute', top: 76, left: 0, display: 'flex' } },
                TextLabel({ c, text: 'More attempts can raise the chance of finding a passing answer.', fontSize: 24, color: c.textSecondary })),
            React.createElement('div', { style: { position: 'absolute', top: 136, left: 0, display: 'flex' } },
                BarChart({
                    c, width: 610, height: 270, min: 0, max: 1, format: 'percent',
                    title: 'Hypothetical code task: n = 100, c = 20',
                    data: [
                        { label: 'pass@1', value: 0.2, color: c.secondary },
                        { label: 'pass@10', value: 0.9048837276, color: c.primary, valueLabel: '90.5%' },
                    ],
                })),
            React.createElement('div', { style: { position: 'absolute', top: 169, left: 660, display: 'flex', width: 450 } },
                    Column({ gap: 24, children: [
                        TextLabel({ c, text: 'Ask what was measured.', fontSize: 31, fontWeight: 750, color: c.textPrimary }),
                        TextLabel({ c, text: 'Same task. Same samples. Different attempt budgets.', width: 408, fontSize: 25, color: c.textSecondary }),
                        TextLabel({ c, text: 'Measure selection accuracy separately.', width: 408, fontSize: 25, color: c.textPrimary }),
                    ] })),
            React.createElement('div', { style: { position: 'absolute', top: 517, right: 0, display: 'flex' } },
                TextLabel({ c, text: 'LeetLLM', fontSize: 26, fontWeight: 750, color: c.primaryLight })),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
