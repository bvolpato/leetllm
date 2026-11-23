import React from 'react'
import { AxisPlot, Scene, getThemeColors, getToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Privacy-Preserving Machine Learning. Two neighboring output distributions overlap; the promise bounds how much removing one user changes output probabilities.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getToneColor('blue', c)
    const purple = getToneColor('purple', c)
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary) =>
        <div key={text} style={{ position: 'absolute', display: 'flex', left, top, width: boxWidth, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.15, color }}>{text}</div>
    const curve = (mean: number) => Array.from({ length: 101 }, (_, i) => {
        const x = -4 + i * 0.08
        return { x, y: Math.exp(-((x - mean) ** 2) / 2) / Math.sqrt(2 * Math.PI) }
    })
    return Scene({ c, background: c.bg, padding: 52, gap: 0, contentWidth: 1096,
        children: <div style={{ position: 'relative', display: 'flex', width: 1096, height: 526 }}>
            {label('Privacy-Preserving', 0, 0, 1096, 53)}
            {label('Machine Learning', 0, 60, 1096, 53)}
            {label('One user changes. How much can the output change?', 0, 139, 1096, 25, c.textSecondary)}
            <div style={{ position: 'absolute', display: 'flex', left: 0, top: 206 }}>
                {AxisPlot({ c, width: 730, height: 262, padding: 18, xMin: -4, xMax: 4, yMin: 0, yMax: 0.44,
                    showAxes: false, showGrid: false, showFrame: false,
                    paths: [{ points: curve(-0.45), color: blue, strokeWidth: 5 }, { points: curve(0.45), color: purple, strokeWidth: 5 }],
                })}
            </div>
            {label('With one user', 800, 276, 296, 27, blue)}
            {label('Without that user', 800, 325, 296, 27, purple)}
            {label('Illustrative output distributions', 20, 478, 750, 19, c.textSecondary)}
            {label('LeetLLM', 940, 493, 156, 27, purple)}
        </div>,
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner size')
    return result
}

export default create('dark')
