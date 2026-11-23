import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'AI Engineer Salary Guide 2026. Hypothetical first-year packages on a common dollar scale. Offer A: 175,000 dollars base, 26,250 target bonus, and 110,000 in public RSUs at stated value, totaling 311,250 dollars. Offer B: 190,000 base, 19,000 target bonus, and 95,000 in private options at stated value, totaling 304,000 dollars. Target cash is 201,250 versus 209,000 dollars. These hypothetical offers show calculation examples. Compare real compensation with current market data, and model equity separately based on vesting and liquidity.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const base = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const bonus = theme === 'dark' ? '#fbbf24' : '#a16207'
    const equity = theme === 'dark' ? '#c4b5fd' : '#7c3aed'
    const ink = theme === 'dark' ? '#101827' : '#ffffff'
    const scale = 2.6
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    const offers = [
        { key: 'A', y: 190, base: 175, bonus: 26.25, equity: 110, kind: 'public RSUs', total: '$311.25K', cash: '$201.25K' },
        { key: 'B', y: 350, base: 190, bonus: 19, equity: 95, kind: 'private options', total: '$304K', cash: '$209K' },
    ]
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('AI Engineer Salary Guide 2026', 0, 0, 1092, 49, c.textPrimary, 750),
            label('Hypothetical offers · first year · pre-tax stated value', 0, 77, 1092, 29, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 460, viewBox: '0 0 1092 460', style: { position: 'absolute', left: 0, top: 0 } },
                ...offers.flatMap(o => {
                    const bonusX = (o.base + o.bonus / 2) * scale
                    return [
                        React.createElement('rect', { key: `base-${o.key}`, x: 0, y: o.y, width: o.base * scale, height: 66, fill: base }),
                        React.createElement('rect', { key: `bonus-${o.key}`, x: o.base * scale, y: o.y, width: o.bonus * scale, height: 66, fill: bonus }),
                        React.createElement('rect', { key: `equity-${o.key}`, x: (o.base + o.bonus) * scale, y: o.y, width: o.equity * scale, height: 66, fill: equity }),
                        React.createElement('path', { key: `leader-${o.key}`, d: `M ${bonusX} ${o.y + 66} L ${bonusX} ${o.y + 81}`, fill: 'none', stroke: bonus, strokeWidth: 2 }),
                    ]
                }),
            ),
            ...offers.flatMap(o => [
                label(`Offer ${o.key}`, 0, o.y - 39, 180, 29, c.textPrimary, 700),
                label(`Target cash: ${o.cash}`, 202, o.y - 37, 620, 26, c.textSecondary),
                label(`$${o.base}K base`, 0, o.y + 17, o.base * scale, 29, ink, 700, true),
                label(`$${o.equity}K`, (o.base + o.bonus) * scale, o.y + 6, o.equity * scale, 29, ink, 750, true),
                label(o.kind, (o.base + o.bonus) * scale, o.y + 39, o.equity * scale, 20, ink, 600, true),
                label(`$${o.bonus}K target bonus`, (o.base + o.bonus / 2) * scale - 173, o.y + 87, 346, 23, bonus, 650, true),
                label(o.total, 849, o.y + 15, 243, 35, c.textPrimary, 750),
            ]),
            label('Worked examples of offer arithmetic.', 0, 474, 913, 25, c.textSecondary),
            label('Bonus varies. Equity depends on vesting and liquidity.', 0, 508, 926, 23, c.textSecondary),
            label('LeetLLM', 932, 490, 160, 30, c.textPrimary, 750),
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
