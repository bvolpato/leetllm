import React from 'react'
import { Column, Flow, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'JAX for PyTorch Researchers. A checked SGD step takes weights [0, 0] and bias 0, uses gradients [-4.5, -1.5] and -2.5, and returns weights [0.225, 0.075] and bias 0.125 at learning rate 0.05.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = { ...getThemeColors(theme), preset: 'engineering' as const, shadow: 'transparent' }
    const node = c
    const label = (text: string, top: number, fontSize: number, color = c.textPrimary, align: 'left' | 'right' = 'left') => React.createElement('div', { key: text, style: {
        position: 'absolute', top, left: 0, width: 1092, display: 'flex', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', color,
        fontFamily: 'Inter', fontSize, fontWeight: 650, lineHeight: 1.15,
    } }, text)
    const values = (weight: string, bias: string) => Column({ gap: 12, children: [
        TextLabel({ c: node, text: weight, fontSize: 25, fontWeight: 700 }),
        TextLabel({ c: node, text: bias, fontSize: 20 }),
    ] })
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('JAX for PyTorch', 0, 53), label('Researchers', 63, 53),
            label('A checked update with explicit state', 156, 27, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', left: 0, top: 232, display: 'flex' } },
                Flow({ c: node, connectorTone: 'cyan', connectorLength: 32, gap: 12,
                    stages: [
                        { title: 'Parameters', tone: 'purple', width: 318, minHeight: 142, children: values('weight [0, 0]', 'bias 0') },
                        { title: 'Mean gradient', tone: 'blue', width: 318, minHeight: 142, children: values('weight [-4.5, -1.5]', 'bias -2.5') },
                        { title: 'Returned parameters', tone: 'green', width: 318, minHeight: 142, children: values('[0.225, 0.075]', 'bias 0.125') },
                    ],
                })),
            label('SGD learning rate 0.05 · initial mean squared error 3.75', 413, 22, c.textSecondary),
            label('LeetLLM', 490, 25, c.primaryLight, 'right'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
