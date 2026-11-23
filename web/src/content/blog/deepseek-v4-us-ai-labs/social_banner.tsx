import React from 'react'
import { Scene, getThemeColors, getReadableToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'DeepSeek V4 artifact identity: a pinned Flash 0731 checkpoint remains Flash 0731; the hosted deepseek-flash alias currently points to V4.1 Flash 1017. Hosted mapping checked November 7, 2026.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const frozen = getReadableToneColor('cyan', c)
    const hosted = getReadableToneColor('purple', c)
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) => React.createElement('div', {
        key: text,
        style: { position: 'absolute', left, top, width: boxWidth, display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: weight, lineHeight: 1.15, color },
    }, text)
    return Scene({
        c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('DeepSeek V4: identify the artifact', 0, 0, 1092, 47, c.textPrimary, 750),
            label('Pin the checkpoint. Date the hosted alias.', 0, 78, 1092, 30, c.textSecondary, 500),
            React.createElement('svg', { width: 1092, height: 522, viewBox: '0 0 1092 522', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('line', { x1: 0, x2: 1092, y1: 305, y2: 305, stroke: c.border, strokeWidth: 1 }),
                [232, 407].map((y, index) => React.createElement('g', { key: y, stroke: index ? hosted : frozen, fill: index ? hosted : frozen },
                    React.createElement('line', { x1: 407, x2: 525, y1: y, y2: y, strokeWidth: 3 }),
                    React.createElement('path', { d: `M 525 ${y} L 512 ${y - 7} L 512 ${y + 7} Z`, stroke: 'none' }),
                )),
            ),
            label('PINNED CHECKPOINT', 0, 153, 500, 21, frozen, 700),
            label('Flash 0731', 0, 206, 400, 36, c.textPrimary, 700),
            label('Flash 0731', 573, 206, 510, 36, frozen, 700),
            label('Save the revision and file hashes.', 573, 257, 519, 23, c.textSecondary, 500),
            label('MUTABLE HOSTED NAME', 0, 328, 500, 21, hosted, 700),
            label('deepseek-flash', 0, 381, 405, 35, c.textPrimary, 700),
            label('V4.1 Flash 1017', 573, 381, 519, 36, hosted, 700),
            label('Mapping checked November 7, 2026.', 573, 432, 519, 23, c.textSecondary, 500),
            label('Match the artifact before comparing outcomes.', 0, 495, 900, 22, c.textSecondary, 500),
            label('LeetLLM', 941, 491, 151, 24, c.textPrimary, 700),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}

export default create('dark')
