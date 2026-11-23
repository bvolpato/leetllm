import React from 'react'
import { Scene, getThemeColors, getToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Positional Encoding: RoPE & ALiBi. At increasing token distances, one RoPE pair oscillates while the ALiBi bias falls linearly. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const label = (text: string, left: number, top: number, width: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: { position: 'absolute', display: 'flex', left, top, width, fontFamily: 'Inter', fontWeight: 650, fontSize: size, lineHeight: 1.15, color } }, text)
    const chart = (left: number, valueAt: (distance: number) => number, tone: 'blue' | 'warm') => {
        const x = (distance: number) => 40 + distance * 27
        const y = (value: number) => 20 + (1 - value) * 62
        const path = Array.from({ length: 129 }, (_, i) => `${i ? 'L' : 'M'} ${x(i / 8)} ${y(valueAt(i / 8))}`).join(' ')
        return React.createElement('div', { key: left, style: { display: 'flex', position: 'absolute', left, top: 248, width: 486, height: 244 } },
            React.createElement('svg', { width: 486, height: 218, viewBox: '0 0 486 218' },
                [1, 0, -1, -2].map(value => React.createElement('line', { key: value, x1: 40, x2: 472, y1: y(value), y2: y(value), stroke: c.border, strokeWidth: 1 })),
                React.createElement('path', { d: path, fill: 'none', stroke: getToneColor(tone, c), strokeWidth: 5 }),
            ),
            [1, 0, -1, -2].map(value => label(String(value), 0, y(value) - 11, 34, 20, c.textSecondary)),
            [0, 8, 16].map(distance => label(String(distance), x(distance) - 8, 220, 45, 20, c.textSecondary)),
        )
    }
    return Scene({ c, background: c.bg, padding: 52, gap: 0, contentWidth: 1096,
        children: React.createElement('div', { style: { display: 'flex', position: 'relative', width: 1096, height: 526 } },
            label('Positional Encoding:', 0, 0, 1096, 54),
            label('RoPE & ALiBi', 0, 63, 1096, 64),
            label('RoPE pair: cos(0.5 × distance)', 0, 198, 520, 25, getToneColor('blue', c)),
            label('ALiBi bias: −0.1 × distance', 570, 198, 526, 25, getToneColor('warm', c)),
            chart(0, distance => Math.cos(0.5 * distance), 'blue'),
            chart(570, distance => -0.1 * distance, 'warm'),
            label('token distance', 355, 501, 430, 22, c.textSecondary),
            label('LeetLLM', 940, 501, 156, 25, getToneColor('purple', c)),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner size')
    return result
}

export default create('dark')
