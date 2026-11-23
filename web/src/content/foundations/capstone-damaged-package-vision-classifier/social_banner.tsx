import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Image Damage Classifier: camera image quality check blocks a dark frame with brightness 0.12 below threshold 0.18 and routes to recapture before calibrated CNN triage.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const red = theme === 'dark' ? '#fca5a5' : '#b91c1c'
    const label = (text: string, left: number, top: number, w: number, size: number, color = c.textPrimary) =>
        React.createElement(
            'div',
            {
                key: `${text}-${left}-${top}`,
                style: {
                    position: 'absolute',
                    display: 'flex',
                    left,
                    top,
                    width: w,
                    fontFamily: 'Inter',
                    fontSize: size,
                    fontWeight: 650,
                    lineHeight: 1.2,
                    color,
                },
            },
            text,
        )
    return Scene({
        c,
        background: c.bg,
        padding: 54,
        contentWidth: 1092,
        gap: 0,
        children: React.createElement(
            'div',
            { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('PORTFOLIO CAPSTONE', 0, 0, 1000, 18, purple),
            label('Image Damage Classifier', 0, 48, 1092, 53),
            label('Quality checks gate CNN triage before routing.', 0, 122, 1092, 27, c.textSecondary),
            label('VISION TRIAGE PIPELINE', 0, 205, 1092, 16, c.textSecondary),
            React.createElement('div', {
                style: {
                    position: 'absolute',
                    display: 'flex',
                    left: 0,
                    top: 245,
                    width: 1092,
                    height: 181,
                    borderTop: `2px solid ${c.border}`,
                    borderBottom: `2px solid ${c.border}`,
                },
            }),
            label('Mean brightness', 0, 270, 290, 22, c.textSecondary),
            label('0.12 < 0.18', 0, 315, 300, 44, red),
            label('Quality decision', 340, 270, 330, 22, c.textSecondary),
            label('FAIL GATE', 340, 320, 320, 34, red),
            label('Hold CNN scoring', 340, 375, 290, 17, c.textSecondary),
            label('Recapture', 785, 301, 297, 31),
            label('new photo', 785, 340, 297, 31),
            label('Calibrated CNN + Platt scaling + mature outcome join', 0, 488, 780, 21, c.textSecondary),
            label('LeetLLM', 923, 483, 169, 25, purple),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner must be 1200x630')
    return result
}

export default create()
