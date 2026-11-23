import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Local LLM Deployment. A calibrated worksheet bar adds 7.6 GB weight proxy, 2 GB assumed working memory, and 2.42 GB raw two-array cache to reach 12.02 GB. The 19.2 GB planning limit represents 80% of a hypothetical 24 GB device; measure actual allocations on the target system.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const text = (value: string, top: number, size: number, color = c.textPrimary) => React.createElement('div', {key: value, style: {display: 'flex', position: 'absolute', left: 0, top, fontSize: size, fontWeight: 650, color, fontFamily: 'Inter'}}, value)
    return Scene({c, padding: 54, contentWidth: 1092, background: c.bg,
        children: React.createElement('div', {style: {display: 'flex', position: 'relative', width: 1092, height: 522}},
            text('Local LLM Deployment', 0, 51),
            text('The file fits. Does the workload?', 86, 32, c.textSecondary),
            text('7.6 GB weight proxy', 172, 24, c.primary),
            text('+ 2.0 GB working + 2.42 GB raw cache = 12.02 GB', 214, 24),
            React.createElement('div', {style: {display: 'flex', position: 'absolute', left: 0, top: 286, width: 1056, height: 70, border: `1px solid ${c.textSecondary}`}},
                React.createElement('div', {style: {display: 'flex', width: 7.6 * 44, height: 68, background: c.primary}}),
                React.createElement('div', {style: {display: 'flex', width: 2 * 44, height: 68, background: c.textSecondary}}),
                React.createElement('div', {style: {display: 'flex', width: 2.415919104 * 44, height: 68, background: c.warning}}),
            ),
            React.createElement('div', {style: {display: 'flex', position: 'absolute', left: 19.2 * 44, top: 270, height: 103, borderLeft: `3px dashed ${c.warning}`}}),
            text('0', 371, 21, c.textSecondary),
            React.createElement('div', {style: {display: 'flex', position: 'absolute', left: 730, top: 385, fontSize: 22, color: c.textPrimary}}, '19.2 GB assumed limit'),
            React.createElement('div', {style: {display: 'flex', position: 'absolute', right: 20, top: 371, fontSize: 21, color: c.textSecondary}}, '24 GB'),
            text('Gemma 4 12B · 16K × 4 · sliding-window eviction', 447, 22, c.textSecondary),
            text('Planning inputs. Measure runtime allocations.', 484, 22, c.textSecondary),
            React.createElement('div', {style: {display: 'flex', position: 'absolute', right: 0, top: 527, fontSize: 22, fontWeight: 750, color: theme === 'light' ? c.primaryDark : c.primaryLight}}, 'LeetLLM'),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const output = await renderToPngWithOutput(create(theme), {width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme})
    if (output.pixelWidth !== width || output.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return output
}
export default create()
