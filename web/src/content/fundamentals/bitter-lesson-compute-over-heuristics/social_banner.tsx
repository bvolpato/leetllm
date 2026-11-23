import React from 'react'
import { FlowArrow, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'The Bitter Lesson and Compute. Extra CPU time leaves a fixed keyword map with the same conditions. Learning uses examples and training to update a router, then tests new issues. Search uses a candidate budget and checker, then evaluates the choice. Decision quality depends on how a system uses extra compute.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const box = (text: string, color: string) => React.createElement('div', { style: {
        display: 'flex', width: 250, height: 74, alignItems: 'center', justifyContent: 'center',
        color: c.textPrimary, background: `${color}22`, border: `1.5px solid ${color}`, borderRadius: 7,
        fontSize: 22, textAlign: 'center', padding: 12,
    } }, text)
    const lane = (label: string, terms: string[], tone: 'neutral' | 'purple' | 'cyan', color: string) => React.createElement('div', { key: label, style: { display: 'flex', alignItems: 'center', gap: 12, width: 1092 } },
        React.createElement('div', { style: { display: 'flex', width: 142, fontSize: 24, fontWeight: 650, color } }, label),
        box(terms[0], color),
        FlowArrow({ c, direction: 'right', tone, length: 35 }),
        box(terms[1], color),
        FlowArrow({ c, direction: 'right', tone, length: 35 }),
        box(terms[2], color),
    )
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092, children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: 1092, height: 522 } },
        React.createElement('div', { style: { display: 'flex', fontSize: 49, fontWeight: 750, letterSpacing: .2, color: c.textPrimary } }, 'The Bitter Lesson & Compute'),
        React.createElement('div', { style: { display: 'flex', marginTop: 17, fontSize: 25, color: c.textSecondary } }, 'Where can extra computation change behavior?'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 } },
            lane('Fixed rules', ['More CPU time', 'Same keyword map', 'Same conditions'], 'neutral', c.textMuted),
            lane('Learning', ['Examples + training', 'Updated router', 'Test on new issues'], 'purple', c.primaryLight),
            lane('Search', ['Candidate budget', 'Search + checker', 'Evaluate choice'], 'cyan', c.infoLight),
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 37 } },
            React.createElement('div', { style: { display: 'flex', fontSize: 21, color: c.textSecondary } }, 'Decision quality depends on how a system uses extra compute.'),
            React.createElement('div', { style: { display: 'flex', fontSize: 25, fontWeight: 700, color: c.primaryLight } }, 'LeetLLM'),
        ),
    ) })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
