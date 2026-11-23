import React from 'react'
import { Scene, getReadableToneColor, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'AI-Generated Kernel Engineering. Passing four default-shape checks leaves stride bugs, shared-memory races, and uncalibrated GPU timers undetected.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const label = (text: string, x: number, y: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left: x, top: y, fontFamily: 'Inter', fontSize: size,
            fontWeight: 650, lineHeight: 1.2, color,
        } }, text)
    const cards = [
        { title: 'PUBLIC SHAPE', value: '4 / 4 pass', detail: 'Same shape & contiguous', color: getReadableToneColor('green', c) },
        { title: 'NEW SHAPE / LAYOUT', value: '0 / 2 pass', detail: 'Strides & tail fail', color: getReadableToneColor('critical', c) },
        { title: 'GPU TIMING / ROOF', value: 'NOT RUN', detail: 'Needs sync & warmup', color: c.textSecondary },
    ]
    return Scene({ c, background: c.bg, padding: 48, contentWidth: 1104, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1104, height: 534 } },
            label('AI-Generated', 0, 0, 51),
            label('Kernel Engineering', 0, 61, 51),
            label('Passing one public shape leaves layout and timing bugs hidden.', 0, 138, 28, c.textSecondary),
            ...cards.map((card, index) => React.createElement('div', { key: card.title, style: {
                position: 'absolute', left: index * 376, top: 210, display: 'flex',
                width: 352, height: 206, border: `2px solid ${card.color}`, borderRadius: 16, background: c.bgCard,
            } },
                label(card.title, 20, 23, 18, card.color),
                label(card.value, 20, 76, 39, card.color),
                label(card.detail, 20, 155, 20, c.textSecondary),
            )),
            label('Weighted RMSNorm • PyTorch Equivalence & CUDA Events', 0, 479, 23, c.textSecondary),
            label('LeetLLM', 970, 479, 24, c.info),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner size')
    return result
}

export default create()
