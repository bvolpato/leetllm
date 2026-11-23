import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/blog/run-gemma4-local-ollama/social_banner.tsx'; renderBanner('./src/content/blog/run-gemma4-local-ollama/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Run Gemma 4 Locally with Ollama. A local API request fixes the model and 8192-token context, then checks placement, completion, and timings.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const accent = theme === 'dark' ? c.primaryLight : c.primaryDark
    const label = (text: string, left: number, top: number, size: number, color = c.textPrimary, boxWidth = 1092) => React.createElement('div', {
        style: { position: 'absolute', left, top, width: boxWidth, display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 600, color, lineHeight: 1.2 },
    }, text)
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Run Gemma 4 Locally', 0, 0, 52),
            label('with Ollama', 0, 65, 43, accent),
            React.createElement('div', { style: { position: 'absolute', left: 0, top: 175, width: 640, height: 236, display: 'flex', background: c.bgCard, border: `2px solid ${c.border}`, borderRadius: 18 } }),
            label('127.0.0.1:11434/api/generate', 25, 199, 26, accent, 590),
            label('model: gemma4:12b-it-q4_K_M', 25, 258, 27, c.textPrimary, 590),
            label('num_ctx: 8192', 25, 306, 27, c.textPrimary, 590),
            label('think: false', 25, 354, 27, c.textSecondary, 590),
            React.createElement('svg', { width: 80, height: 40, style: { position: 'absolute', left: 659, top: 277 } },
                React.createElement('path', { d: 'M 0 20 H 62 M 50 8 L 64 20 L 50 32', fill: 'none', stroke: accent, strokeWidth: 4 })),
            label('VERIFY', 770, 194, 20, accent, 310),
            label('Placement', 770, 244, 32, c.textPrimary, 310),
            label('Completion', 770, 300, 32, c.textPrimary, 310),
            label('Timings', 770, 356, 32, c.textPrimary, 310),
            label('Record the digest. Measure your workload.', 0, 448, 26, c.textSecondary),
            label('LeetLLM', 950, 499, 24, accent, 142),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}

export default create('dark')
