import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Choosing an LLM Inference Engine. Local deployment offers Ollama or llama.cpp; shared GPU serving offers vLLM, SGLang, and compatible NVIDIA TensorRT-LLM deployments. Both branches require checkpoint, quality, latency and cost checks.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = theme === 'dark' ? '#22d3ee' : '#087e8b'
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const label = (text: string, left: number, top: number, size: number, color = c.textPrimary, weight = 600, boxWidth = 1080) => React.createElement('div', {
        key: text, style: { position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight, color, lineHeight: 1.15, letterSpacing: 0.4 },
    }, text)
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Choosing an LLM Inference Engine', 0, 0, 48, c.textPrimary, 750),
            label('LOCAL DEPLOYMENT', 0, 126, 18, cyan),
            label('Ollama', 0, 167, 35, c.textPrimary, 700, 440),
            label('packaged model workflow', 0, 213, 21, c.textSecondary, 500, 440),
            label('llama.cpp', 0, 263, 35, c.textPrimary, 700, 440),
            label('embedded or custom runtime', 0, 309, 21, c.textSecondary, 500, 440),
            label('SHARED GPU SERVING', 560, 126, 18, purple, 600, 532),
            label('vLLM / SGLang', 560, 167, 35, c.textPrimary, 700, 532),
            label('server runtime candidates', 560, 213, 21, c.textSecondary, 500, 532),
            label('TensorRT-LLM', 560, 263, 35, c.textPrimary, 700, 532),
            label('when the NVIDIA support matrix fits', 560, 309, 21, c.textSecondary, 500, 532),
            React.createElement('svg', { width: 1092, height: 80, viewBox: '0 0 1092 80', style: { position: 'absolute', top: 352 } },
                React.createElement('path', { d: 'M 180 0 L 180 28 L 546 28 L 546 65 M 825 0 L 825 28 L 546 28 M 537 55 L 546 66 L 555 55', fill: 'none', stroke: cyan, strokeWidth: 3 })),
            label('Checkpoint fit → quality → latency → cost', 145, 435, 29, c.textPrimary, 650, 940),
            label('LeetLLM', 957, 502, 18, c.textSecondary, 600, 135),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
