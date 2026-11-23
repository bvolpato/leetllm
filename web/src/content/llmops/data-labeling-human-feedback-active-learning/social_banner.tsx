import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Data Labeling and Human Feedback. A 3x3 reviewer confusion matrix has diagonal counts 42, 38 and 27: 107 of 120 agreements, with kappa approximately 0.835. Agreement measures reviewer consistency; audit labels against the rubric for correctness.'
const counts = [[42, 3, 1], [4, 38, 2], [2, 1, 27]]
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const dark = theme === 'dark'
    const good = dark ? '#5eead4' : '#0f766e'
    const label = (text: string, x: number, y: number, w: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: { position: 'absolute', left: x, top: y, width: w,
            color, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2, display: 'flex' } }, text)
    return Scene({ c, background: c.bg, padding: 52, gap: 0, contentWidth: 1096,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1096, height: 526 } },
            label('Data Labeling and Human Feedback', 0, 0, 1096, 46),
            label('Independent dual review before adjudication', 0, 72, 1096, 23, c.textSecondary),
            label('Rater 2', 220, 131, 190, 19, c.textSecondary),
            label('Rater 1', 0, 181, 110, 19, c.textSecondary),
            ...['A', 'B', 'Tie'].flatMap((name, index) => [
                label(`column ${name}`, 120 + index * 118, 166, 110, 17, c.textSecondary),
                label(name, 52, 231 + index * 82, 62, 23, c.textPrimary),
            ]),
            ...counts.flatMap((row, i) => row.map((count, j) => React.createElement('div', {
                key: `${i}-${j}`, style: { position: 'absolute', left: 120 + j * 118, top: 210 + i * 82,
                    width: 108, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Inter', fontSize: 32, fontWeight: 750, borderRadius: 8,
                    color: i === j ? good : c.textPrimary,
                    backgroundColor: i === j ? (dark ? '#12392f' : '#d1fae5') : c.bgCard,
                    border: `2px solid ${i === j ? good : c.borderLight}`,
                },
            }, String(count)))),
            label('107 / 120', 585, 178, 480, 56, good),
            label('reviewer agreements', 588, 248, 480, 25, c.textSecondary),
            label('Kappa ≈ 0.835', 588, 316, 480, 33),
            label('Agreement ≠ correctness', 588, 394, 495, 27, c.textPrimary),
            label('LeetLLM', 938, 494, 158, 25, c.textSecondary),
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
