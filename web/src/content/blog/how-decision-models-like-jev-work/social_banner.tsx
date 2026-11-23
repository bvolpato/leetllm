import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'How decision models like Jev work. A long text answer with a parser is compared with a direct registry-authentication decision from the same incident state.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = theme === 'dark' ? '#22d3ee' : '#087e99'
    const violet = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const green = theme === 'dark' ? '#4ade80' : '#15803d'
    const muted = theme === 'dark' ? '#94a3b8' : '#475569'
    const line = (text: string, top: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { style: { position: 'absolute', left: 0, top, color, fontFamily: c.fontSans, fontSize: size, fontWeight: weight, lineHeight: 1.1 } }, text)
    const panel = (top: number, title: string, detail: string, color: string) =>
        React.createElement('div', { style: {
            position: 'absolute', left: 0, top, width: 1092, height: 112,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 25px', borderRadius: 14, border: `2px solid ${color}`,
            backgroundColor: c.bgCard, fontFamily: c.fontSans,
        } },
        React.createElement('div', { style: { color, fontSize: 21, fontWeight: 750 } }, title),
        React.createElement('div', { style: { color: c.textPrimary, fontSize: 23, fontWeight: 650 } }, detail))
    return Scene({
        c,
        padding: 54,
        gap: 0,
        contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            line('HOW DECISION MODELS LIKE JEV WORK', 0, 18, cyan, 750),
            line('AI without the paragraph', 47, 56, c.textPrimary, 800),
            line('Same incident. Different output path.', 116, 25, muted, 500),
            panel(195, 'GENERATE + PARSE', '“The error might involve...”  →  parser', violet),
            panel(329, 'SCORE + CHOOSE', 'registry_auth  ✓', green),
            line('The model still reads the input. Software owns the route.', 464, 21, muted, 500),
            React.createElement('div', { style: { position: 'absolute', right: 0, top: 482, color: cyan, fontFamily: c.fontSans, fontSize: 23, fontWeight: 750 } }, 'LeetLLM'),
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
