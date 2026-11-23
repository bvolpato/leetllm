import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'CNNs from Scratch. A 4 by 4 crop and shared 3 by 3 kernel produce the 2 by 2 map [[0.852,0.789],[0.817,0.874]]. The first window is highlighted. Its row contributions -0.114, 2.112, and -1.146 sum to 0.852. The operation uses cross-correlation with stride one, zero padding, and zero bias.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    const grid = (values: string[][], left: number, top: number, size: number, kind: 'crop' | 'kernel' | 'map') =>
        values.flatMap((row, r) => row.map((value, col) => {
            const bright = kind === 'crop' && Number(value) > 0.8
            const chosen = kind === 'map' && r === 0 && col === 0
            const positive = kind === 'kernel' && r === 1
            return React.createElement('div', { key: `${kind}-${r}-${col}`, style: {
                position: 'absolute', left: left + col * size, top: top + r * size,
                width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bright ? (theme === 'dark' ? '#dbeafe' : '#cbd5e1') : c.bgCard,
                border: `1px solid ${chosen ? cyan : c.border}`, fontFamily: 'Inter',
                fontSize: kind === 'crop' ? 22 : 27, fontWeight: chosen || positive ? 750 : 550,
                color: bright ? '#172554' : chosen ? cyan : positive ? purple : c.textPrimary,
            } }, value)
        }))
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('CNNs from Scratch', 0, 0, 1092, 54, c.textPrimary, 750),
            label('Reuse one 3 × 3 kernel at four positions', 0, 80, 1092, 29, c.textSecondary),
            label('4 × 4 crop', 0, 147, 244, 27, cyan, 650, true),
            label('shared kernel', 394, 147, 230, 27, purple, 650, true),
            label('2 × 2 feature map', 822, 147, 270, 27, cyan, 650, true),
            ...grid([
                ['0.05', '0.08', '0.06', '0.07'],
                ['0.12', '0.92', '0.88', '0.09'],
                ['0.08', '0.90', '0.93', '0.11'],
                ['0.06', '0.07', '0.09', '0.05'],
            ], 10, 195, 56, 'crop'),
            ...grid([['−0.6', '−0.6', '−0.6'], ['1.1', '1.1', '1.1'], ['−0.6', '−0.6', '−0.6']], 407, 205, 68, 'kernel'),
            ...grid([['0.852', '0.789'], ['0.817', '0.874']], 859, 209, 98, 'map'),
            React.createElement('svg', { width: 1092, height: 430, viewBox: '0 0 1092 430', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 9, y: 194, width: 169, height: 169, fill: 'none', stroke: cyan, strokeWidth: 3 }),
                React.createElement('path', { d: 'M 675 307 L 796 307 M 783 298 L 797 307 L 783 316', fill: 'none', stroke: purple, strokeWidth: 2.5 }),
            ),
            label('×', 275, 277, 75, 45, c.textSecondary, 500, true),
            label('slide', 675, 254, 122, 24, c.textSecondary, 600, true),
            label('and sum', 665, 330, 142, 24, c.textSecondary, 600, true),
            label('First window: −0.114 + 2.112 − 1.146 = 0.852', 0, 445, 1092, 28, cyan),
            label('Cross-correlation · stride 1 · padding 0 · bias 0', 0, 494, 918, 24, c.textSecondary),
            label('LeetLLM', 932, 480, 160, 30, c.textPrimary, 750),
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
