import React from 'react'
import { Scene, StackedBar, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Continued Pretraining for Domain Shift. An illustrative fixed token budget contains 75 percent domain text and 25 percent general replay. The same next-token objective is evaluated on held-out domain and general text.'

export function create(theme: ThemeMode = 'dark') {
    const c = {...getThemeColors(theme), shadow: 'transparent'}
    const text = (value: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: {display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2, color},
    }, value)
    return Scene({c, background: c.bg, padding: 50, contentWidth: 1100, gap: 28,
        children: [
            text('Continued Pretraining for Domain Shift', 49),
            text('FIXED TOKEN BUDGET · ILLUSTRATIVE 25% REPLAY', 19, c.textSecondary),
            React.createElement('div', {style: {display: 'flex', flexDirection: 'column', gap: 12}},
                React.createElement('div', {style: {display: 'flex', width: 1100}},
                    React.createElement('div', {style: {display: 'flex', width: 825, justifyContent: 'center'}}, text('75% domain text', 27)),
                    React.createElement('div', {style: {display: 'flex', width: 275, justifyContent: 'center'}}, text('25% replay', 27)),
                ),
                StackedBar({c, width: 1100, height: 80, showLegend: false, segments: [
                    {label: 'Domain text', value: 75, color: c.primary, valueLabel: ''},
                    {label: 'General replay', value: 25, color: c.secondary, valueLabel: ''},
                ]}),
            ),
            text('One next-token objective. Two evaluation lanes.', 31),
            React.createElement('div', {style: {display: 'flex', gap: 24, width: 1100}},
                React.createElement('div', {style: {display: 'flex', flex: 1, padding: 24, border: `2px solid ${c.primary}`, borderRadius: 12}}, text('Domain: did text fit improve?', 23)),
                React.createElement('div', {style: {display: 'flex', flex: 1, padding: 24, border: `2px solid ${c.secondary}`, borderRadius: 12}}, text('General: what regressed?', 23)),
            ),
            React.createElement('div', {style: {display: 'flex', justifyContent: 'flex-end', width: 1100}}, text('LeetLLM', 24, c.primaryLight)),
        ],
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme})
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
