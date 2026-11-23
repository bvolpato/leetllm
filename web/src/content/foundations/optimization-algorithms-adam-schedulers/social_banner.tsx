import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/optimization-algorithms-adam-schedulers/social_banner.tsx'; renderBanner('./src/content/foundations/optimization-algorithms-adam-schedulers/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Adam, Momentum, Schedulers. Adam step one, starting from zero moment buffers with bias correction and epsilon 10 to the minus 8: gradient 100 is normalized to 100 divided by (100 plus epsilon), while gradient 1 is normalized to 1 divided by (1 plus epsilon). Multiplying both by learning rate 0.01 gives updates approximately 0.01, subtracted from each parameter. Later updates depend on gradient history.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Adam, Momentum, Schedulers', 0, 0, 1092, 49, c.textPrimary, 750),
            label('Adam step 1 · zero state · bias corrected · ε = 10⁻⁸', 0, 80, 1092, 28, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 450, viewBox: '0 0 1092 450', style: { position: 'absolute', left: 0, top: 0 } },
                ...[0, 1].flatMap((row) => {
                    const y = 217 + row * 128
                    return [
                        React.createElement('rect', { key: `gradient-${row}`, x: 0, y, width: 208, height: 84, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 }),
                        React.createElement('rect', { key: `ratio-${row}`, x: 346, y, width: 388, height: 84, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                        React.createElement('rect', { key: `update-${row}`, x: 910, y, width: 182, height: 84, rx: 12, fill: purple, fillOpacity: 0.12, stroke: purple, strokeWidth: 2 }),
                        React.createElement('path', { key: `input-arrow-${row}`, d: `M 226 ${y + 42} L 328 ${y + 42} M 317 ${y + 35} L 330 ${y + 42} L 317 ${y + 49}`, fill: 'none', stroke: c.textMuted, strokeWidth: 2.5 }),
                        React.createElement('path', { key: `output-arrow-${row}`, d: `M 752 ${y + 42} L 892 ${y + 42} M 880 ${y + 35} L 893 ${y + 42} L 880 ${y + 49}`, fill: 'none', stroke: purple, strokeWidth: 2.5 }),
                    ]
                }),
            ),
            label('gradient', 0, 169, 208, 27, cyan, 650, true),
            label('direction / scale', 346, 169, 388, 27, purple, 650, true),
            label('subtract', 910, 169, 182, 27, purple, 650, true),
            ...[100, 1].flatMap((gradient, row) => [
                label(String(gradient), 0, 236 + row * 128, 208, 39, cyan, 750, true),
                label(`${gradient} / (${gradient} + ε)`, 346, 242 + row * 128, 388, 30, c.textPrimary, 650, true),
                label('× 0.01', 752, 224 + row * 128, 140, 23, purple, 650, true),
                label('≈ 0.01', 910, 239 + row * 128, 182, 34, purple, 750, true),
            ]),
            label('Later updates depend on gradient history.', 0, 480, 900, 29, c.textSecondary),
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
