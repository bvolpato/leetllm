import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import {renderBanner} from './src/content/system-design/vision-language-models-clip-beyond/social_banner.tsx'; renderBanner('./src/content/system-design/vision-language-models-clip-beyond/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Vision-Language Models & CLIP. Toy normalized image vector [1,0] scores 0.8 against caption vector [0.8,0.6] and 0.6 against [0.6,0.8]. Similarity ranks captions; it does not generate them.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const cyan = theme === 'dark' ? '#67e8f9' : '#0e7490'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            color, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Vision-Language', 0, 0, 1092, 55),
            label('Models & CLIP', 0, 66, 1092, 55),
            label('TOY NORMALIZED VECTORS', 0, 173, 1092, 20, c.textSecondary),
            label('image', 0, 242, 210, 23, c.textSecondary),
            label('[1, 0]', 0, 282, 210, 42, cyan),
            label('caption A', 446, 236, 290, 23, c.textSecondary),
            label('[0.8, 0.6]', 446, 274, 290, 32, purple),
            label('0.8', 910, 266, 180, 45, cyan),
            label('caption B', 446, 348, 290, 23, c.textSecondary),
            label('[0.6, 0.8]', 446, 386, 290, 32, purple),
            label('0.6', 910, 378, 180, 45, c.textSecondary),
            label('cosine', 910, 215, 180, 21, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 215, viewBox: '0 0 1092 215', style: { position: 'absolute', left: 0, top: 233 } },
                React.createElement('path', { d: 'M 200 66 H 294 V 55 H 400 M 294 66 V 167 H 400 M 386 47 L 400 55 L 386 63 M 386 159 L 400 167 L 386 175 M 740 55 H 866 M 852 47 L 866 55 L 852 63 M 740 167 H 866 M 852 159 L 866 167 L 852 175', fill: 'none', stroke: c.textSecondary, strokeWidth: 3 })),
            label('Similarity ranks captions. It does not generate them.', 0, 482, 930, 26),
            label('LeetLLM', 958, 491, 134, 25, purple),
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
