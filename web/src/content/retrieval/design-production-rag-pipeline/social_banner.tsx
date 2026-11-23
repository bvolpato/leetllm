import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Production RAG Pipelines. An EU support caller can retrieve permitted key policy but not the admin override. Citation E1 still needs claim support.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const green = theme === 'dark' ? '#6ee7b7' : '#047857'
    const red = theme === 'dark' ? '#fda4af' : '#be123c'
    const blue = theme === 'dark' ? '#93c5fd' : '#1d4ed8'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', display: 'flex', left, top, width: boxWidth,
            fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2, color,
        } }, text)
    const box = (left: number, top: number, boxWidth: number, color: string) =>
        React.createElement('rect', { key: `${left}-${top}`, x: left, y: top, width: boxWidth, height: 95,
            fill: c.bgSubtle, stroke: color, strokeWidth: 2, rx: 12 })
    const arrow = (start: number, end: number, y: number, color: string) =>
        React.createElement('path', { key: start, d: `M ${start} ${y} H ${end} M ${end - 10} ${y - 7} L ${end} ${y} L ${end - 10} ${y + 7}`,
            fill: 'none', stroke: color, strokeWidth: 3 })
    return Scene({ c, background: c.bg, padding: 60, gap: 0, contentWidth: 1080,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1080, height: 510 } },
            label('Production RAG Pipelines', 0, 0, 1080, 52),
            label('For an EU support caller, permission comes before similarity.', 0, 84, 1080, 26, c.textSecondary),
            React.createElement('svg', { width: 1080, height: 260, viewBox: '0 0 1080 260', style: { position: 'absolute', left: 0, top: 170 } },
                box(1, 0, 255, green), box(1, 140, 255, red),
                box(340, 0, 190, blue), box(610, 0, 195, green), box(885, 0, 194, blue),
                arrow(258, 329, 47, green), arrow(532, 599, 47, green), arrow(807, 874, 47, green),
                React.createElement('path', { d: 'M 258 187 H 300 M 301 176 L 323 198 M 301 198 L 323 176', fill: 'none', stroke: red, strokeWidth: 3 }),
            ),
            label('EU key policy v2', 20, 187, 228, 25, green),
            label('Current · support:eu', 20, 229, 228, 19, c.textSecondary),
            label('ACL + dates', 358, 187, 160, 24, blue),
            label('Allowed evidence', 358, 229, 160, 18, c.textSecondary),
            label('Parent → E1', 628, 187, 165, 24, green),
            label('Version matched', 628, 229, 165, 18, c.textSecondary),
            label('Cited answer', 901, 187, 174, 24, blue),
            label('Or abstain', 901, 229, 170, 18, c.textSecondary),
            label('Admin override', 20, 328, 225, 25, red),
            label('Outside caller grants', 20, 370, 230, 19, c.textSecondary),
            label('Excluded from context', 344, 346, 610, 23, red),
            label('Grounding check: citations require sentence-level claim support.', 0, 438, 1080, 23, c.textSecondary),
            label('LeetLLM', 922, 487, 158, 26, blue),
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
