import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/training/mixed-precision-training-loss-scaling/social_banner.tsx'; renderBanner('./src/content/training/mixed-precision-training-loss-scaling/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Mixed Precision Training: subtracting 0.0001 from a weight of 1.0 rounds back to 1.0 in FP16 and BF16 parameter storage, but an FP32 parameter changes to about 0.9999. This conventional AMP baseline keeps the update path in FP32.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const cyan = theme === 'dark' ? '#67e8f9' : '#0e7490'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            color, fontFamily: 'Inter', fontSize: size, fontWeight: weight, lineHeight: 1.2,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: {
            position: 'relative', display: 'flex', width: 1092, height: 522,
        } },
        label('Mixed Precision Training', 0, 0, 1092, 53, c.textPrimary, 750),
        label('ONE WEIGHT UPDATE', 0, 106, 1092, 18, c.textSecondary),
        label('1.0 − 0.0001', 0, 142, 1092, 56, c.textPrimary, 700),
        React.createElement('svg', { width: 1092, height: 70, viewBox: '0 0 1092 70',
            style: { position: 'absolute', left: 0, top: 217 } },
            React.createElement('path', { d: 'M 180 0 L 180 25 L 270 25 L 270 65 M 180 25 L 820 25 L 820 65',
                stroke: c.textMuted, strokeWidth: 3, fill: 'none' }),
            React.createElement('path', { d: 'M 260 53 L 270 65 L 280 53 M 810 53 L 820 65 L 830 53',
                stroke: c.textMuted, strokeWidth: 3, fill: 'none' })),
        label('FP16 / BF16 parameter', 0, 296, 530, 24, purple),
        label('1.0000', 0, 338, 530, 57, purple, 750),
        label('Update rounds away', 0, 413, 530, 23, c.textSecondary),
        label('FP32 parameter', 610, 296, 482, 24, cyan),
        label('≈ 0.9999', 610, 338, 482, 57, cyan, 750),
        label('Small change survives', 610, 413, 482, 23, c.textSecondary),
        label('Compute low. Update high.', 0, 488, 800, 24, c.textSecondary),
        label('LeetLLM', 958, 491, 134, 25, purple, 700),
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
