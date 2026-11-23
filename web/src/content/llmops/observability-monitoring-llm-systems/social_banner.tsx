import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'LLM Observability & Monitoring. Six reviewed requests have first-token delays of 172 to 240 ms, all below a 500 ms warning, yet two served answers are unsafe. Fast is not the same as correct.'
const delays = [172, 181, 188, 205, 218, 240]
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const dark = theme === 'dark'
    const good = dark ? '#5eead4' : '#0f766e'
    const bad = dark ? '#fda4af' : '#be123c'
    const label = (text: string, x: number, y: number, w: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: { position: 'absolute', display: 'flex', left: x, top: y, width: w,
            color, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2 } }, text)
    return Scene({ c, background: c.bg, padding: 52, gap: 0, contentWidth: 1096,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1096, height: 526 } },
            label('LLM Observability & Monitoring', 0, 0, 1096, 46),
            label('Fast is not the same as correct.', 0, 74, 1096, 28, c.textSecondary),
            label('REVIEWED WINDOW · FIRST-TOKEN DELAY', 0, 142, 850, 18, c.textSecondary),
            label('500 ms warning', 748, 187, 320, 20, c.textSecondary),
            React.createElement('svg', { width: 1040, height: 244, viewBox: '0 0 1040 244', style: { position: 'absolute', left: 0, top: 188 } },
                React.createElement('line', { x1: 0, y1: 20, x2: 692, y2: 20, stroke: c.textSecondary, strokeWidth: 2, strokeDasharray: '6 5' }),
                React.createElement('line', { x1: 0, y1: 220, x2: 692, y2: 220, stroke: c.textSecondary, strokeWidth: 2 }),
                ...delays.map((ms, i) => React.createElement('rect', { key: ms, x: i * 115 + 18, y: 220 - ms * .4, width: 72, height: ms * .4,
                    fill: i >= 4 ? bad : good, rx: 3 })),
            ),
            ...delays.flatMap((ms, i) => [label(`${ms}`, i * 115 + 23, 374 - ms * .4, 95, 22, i >= 4 ? bad : good),
                label(`trace ${i + 1}`, i * 115 + 7, 424, 110, 16, c.textSecondary)]),
            label('2 / 6', 766, 279, 290, 58, bad),
            label('reviewed unsafe', 766, 354, 310, 25, bad),
            label('0 ms', 0, 475, 130, 18, c.textSecondary),
            label('LeetLLM', 930, 491, 166, 25, c.textSecondary),
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
