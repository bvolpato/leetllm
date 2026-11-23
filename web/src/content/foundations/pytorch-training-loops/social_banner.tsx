import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/pytorch-training-loops/social_banner.tsx'; renderBanner('./src/content/foundations/pytorch-training-loops/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'PyTorch Training Loops. For a two-sequence batch, backward writes a gradient matrix with rows [0.5, 0.5] and [-0.5, -0.5] without changing zero weights. An SGD step with learning rate 0.2 produces weight rows [-0.1, -0.1] and [0.1, 0.1]. Validation measures fixed weights without updating them.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const purple = theme === 'dark' ? '#b79aff' : '#6d28d9'
    const cyan = theme === 'dark' ? '#55dcec' : '#087e8b'
    const green = theme === 'dark' ? '#56d7ad' : '#087f5b'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth,
            display: 'flex', color, fontFamily: 'Inter', fontSize: size,
            fontWeight: weight, lineHeight: 1.2, letterSpacing: 0.5,
        } }, text)
    const card = (left: number, title: string, values: string[], note: string, accent: string) =>
        React.createElement('div', { key: title, style: {
            position: 'absolute', left, top: 157, width: 304, height: 228,
            display: 'flex', flexDirection: 'column', borderRadius: 16,
            border: `1px solid ${accent}`, backgroundColor: c.bgCard,
        } },
        label(title, 24, 22, 260, 22, accent, 700),
        label(values[0], 44, 74, 240, 31, c.textPrimary, 650),
        label(values[1], 44, 122, 240, 31, c.textPrimary, 650),
        label(note, 24, 183, 260, 18, c.textSecondary),
        )
    return Scene({
        c, background: c.bg, padding: 50, gap: 0, contentWidth: 1100,
        children: React.createElement('div', { style: {
            position: 'relative', width: 1100, height: 530, display: 'flex',
        } },
        label('PyTorch Training Loops', 0, 0, 1100, 57, c.textPrimary, 750),
        label('A gradient is not a parameter update.', 0, 80, 1100, 27, c.textSecondary),
        card(0, 'Initial weights W₀', ['[ 0.0,   0.0 ]', '[ 0.0,   0.0 ]'], 'Two classes × two features', purple),
        label('→', 325, 244, 50, 43, cyan),
        card(394, 'backward() → gradient', ['[+0.5, +0.5]', '[−0.5, −0.5]'], 'Weights remain W₀', cyan),
        label('→', 719, 244, 50, 43, green),
        card(788, 'step() → weights W₁', ['[−0.1, −0.1]', '[+0.1, +0.1]'], 'SGD learning rate = 0.2', green),
        label('Mean cross-entropy · two-sequence batch · zero bias', 0, 403, 1100, 19, c.textSecondary),
        label('Validation measures fixed weights. It never calls step().', 0, 451, 1100, 26, cyan, 650),
        label('LeetLLM', 964, 509, 136, 24, purple, 700),
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
