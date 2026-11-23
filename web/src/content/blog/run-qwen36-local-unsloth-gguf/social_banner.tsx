import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Run Qwen3.6 Locally with Unsloth GGUF. A pinned GGUF file feeds a llama.cpp process on one local workstation, serving a text client at 127.0.0.1:8080. Start with one slot and 8K context.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const accent = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const cyan = theme === 'dark' ? '#7dd3fc' : '#0369a1'
    const label = (text: string, left: number, top: number, w: number, size: number, color = c.textPrimary) => React.createElement('div', {
        key: text, style: { position: 'absolute', display: 'flex', left, top, width: w, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2, color },
    }, text)
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Run Qwen3.6 Locally', 0, 0, 1092, 53),
            label('with Unsloth GGUF', 0, 67, 1092, 35, accent),
            label('ONE WORKSTATION', 0, 168, 600, 17, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', left: 0, top: 203, width: 1092, height: 205, border: `2px solid ${c.border}`, borderRadius: 20 } }),
            label('Pinned GGUF', 28, 239, 270, 27, accent),
            label('revision + SHA-256', 28, 288, 280, 18, c.textSecondary),
            label('→', 312, 252, 60, 34, cyan),
            label('llama.cpp', 390, 239, 270, 27),
            label('1 slot · 8K context', 390, 288, 280, 18, c.textSecondary),
            label('→', 697, 252, 60, 34, cyan),
            label('Text client', 778, 239, 280, 27, cyan),
            label('127.0.0.1:8080', 778, 288, 290, 21, c.textSecondary),
            label('Verify one answer before adding MTP or vision.', 28, 357, 1010, 21, c.textSecondary),
            label('LeetLLM', 915, 483, 177, 25, accent),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return result
}
export default create()
