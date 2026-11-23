import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Multi-Query and Grouped-Query Attention. With eight query heads and equal head widths, MHA stores eight K/V pairs, GQA stores two, and MQA stores one. Their logical cache payloads are 1, one quarter, and one eighth of MHA.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const label = (text: string, x: number, y: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left: x, top: y, color, fontFamily: 'Inter',
            fontSize: size, fontWeight: 650, lineHeight: 1.2,
        } }, text)
    const cards = [
        { name: 'MHA', pairs: 8, ratio: '1× cache', color: c.critical },
        { name: 'GQA', pairs: 2, ratio: '1/4 cache', color: c.positive },
        { name: 'MQA', pairs: 1, ratio: '1/8 cache', color: c.info },
    ]
    return Scene({ c, background: c.bg, padding: 48, gap: 0, contentWidth: 1104,
        children: React.createElement('div', { style: { display: 'flex', position: 'relative', width: 1104, height: 534 } },
            label('Multi-Query &', 0, 0, 45),
            label('Grouped-Query Attention', 0, 54, 45),
            label('Same eight queries. Fewer stored K/V pairs.', 0, 124, 24, c.textSecondary),
            ...cards.map((card, index) => React.createElement('div', { key: card.name, style: {
                position: 'absolute', left: index * 376, top: 183, width: 352, height: 270,
                display: 'flex', border: `2px solid ${card.color}`, borderRadius: 18, background: c.bgCard,
            } },
                label(card.name, 22, 18, 29, card.color),
                label('8 query heads', 22, 61, 19, c.textSecondary),
                ...Array.from({ length: card.pairs }, (_, i) => React.createElement('div', { key: i, style: {
                    position: 'absolute', left: 22 + (i % 4) * 76, top: 108 + Math.floor(i / 4) * 46,
                    width: 64, height: 35, borderRadius: 6, border: `2px solid ${card.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color,
                    fontFamily: 'Inter', fontSize: 17, fontWeight: 700,
                } }, `KV${i}`)),
                label(card.ratio, 22, 218, 25, card.color),
            )),
            label('Equal sequence length, head width and cache dtype.', 0, 489, 20, c.textSecondary),
            label('LeetLLM', 970, 489, 23, c.info),
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

export default create()
