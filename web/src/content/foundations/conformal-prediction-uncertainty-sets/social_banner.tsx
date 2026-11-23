import React from 'react'
import { Column, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Conformal Prediction and Uncertainty. Nine calibration errors are 2, 3, 3, 4, 5, 6, 7, 8, and 12 ms. An 80% target selects rank ceil(10 times 0.8) = 8 and radius 8 ms. A 40 ms point prediction gets [32, 48]. Marginal coverage averages over calibration and new examples under exchangeability.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const errors = [2, 3, 3, 4, 5, 6, 7, 8, 12]
    const rank = Math.ceil((errors.length + 1) * 0.8)
    const radius = errors[rank - 1]
    return Scene({ c, background: c.bg, padding: 40, contentWidth: 1120, gap: 18, children: [
        TextLabel({ c, text: 'Conformal Prediction and Uncertainty', fontSize: 43, fontWeight: 750, color: c.textPrimary, width: 1120 }),
        TextLabel({ c, text: 'A rank rule turns held-out errors into a prediction interval.', fontSize: 25, color: c.textSecondary, width: 1120 }),
        Row({ gap: 16, align: 'stretch', children: [
            Panel({ c, title: '9 calibration residuals (ms)', titleFontSize: 26, width: 660, minHeight: 280, padding: 24, gap: 22, tone: 'blue',
                bodyStyle: { alignItems: 'center', justifyContent: 'center' }, children: [
                    Column({ gap: 8, width: 540, children: [
                        Row({ gap: 0, children: errors.map((_, i) => TextLabel({ c, text: String(i + 1), width: 60, fontSize: 20, align: 'center', color: c.textSecondary })) }),
                        Row({ gap: 0, children: errors.map((error, i) => <div key={i} style={{ display: 'flex', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', border: `${i + 1 === rank ? 3 : 1}px solid ${i + 1 === rank ? c.textPrimary : c.border}`, borderRadius: 8 }}>
                            {TextLabel({ c, text: String(error), width: 54, fontSize: 29, fontWeight: i + 1 === rank ? 750 : 500, align: 'center', color: c.textPrimary })}
                        </div>) }),
                    ] }),
                    TextLabel({ c, text: `Position ${rank} selects ${radius} ms`, fontSize: 26, color: c.textPrimary, width: 612, align: 'center' }),
                ] }),
            Panel({ c, title: 'Next prediction: 40 ms', titleFontSize: 26, width: 444, minHeight: 280, padding: 24, gap: 22, tone: 'purple', children: [
                TextLabel({ c, text: `k = ceil(10 × 0.80) = ${rank}`, fontSize: 25, color: c.textSecondary, width: 396 }),
                TextLabel({ c, text: `Radius q = ${radius} ms`, fontSize: 27, color: c.textPrimary, width: 396 }),
                TextLabel({ c, text: `[${40 - radius}, ${40 + radius}] ms`, fontSize: 38, fontWeight: 700, color: c.textPrimary, width: 396 }),
            ] }),
        ] }),
        TextLabel({ c, text: '80% marginal coverage under exchangeability, averaged over calibration and new cases.', fontSize: 23, color: c.textSecondary, width: 1120 }),
        TextLabel({ c, text: 'LeetLLM', fontSize: 23, fontWeight: 700, color: c.textPrimary, width: 1120, align: 'right' }),
    ] })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
