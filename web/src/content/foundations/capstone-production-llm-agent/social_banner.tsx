import React from 'react'
import { Scene, getReadableToneColor, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Capstone: Production Agent. Validate tool arguments with strict schemas, enforce step, token, and latency budgets, quarantine untrusted observations, and measure trajectory pass@k.'
export function create(theme: ThemeMode = 'dark') {
    const c = {...getThemeColors(theme), shadow: 'transparent'}
    const text = (value: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: {display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2, color},
    }, value)
    const lane = (label: string, values: string[], tone: 'purple' | 'warm') => React.createElement('div', {
        style: {display: 'flex', flexDirection: 'column', gap: 18, padding: 24, width: 1100,
            borderLeft: `5px solid ${getReadableToneColor(tone, c)}`, background: c.bgCard},
    }, text(label, 20, c.textSecondary), React.createElement('div', {style: {display: 'flex', gap: 24}},
        ...values.map((value) => React.createElement('div', {key: value, style: {display: 'flex', width: 310}}, text(value, 31, getReadableToneColor(tone, c))))))
    return Scene({c, background: c.bg, padding: 50, contentWidth: 1100, gap: 28,
        children: [
            text('Capstone: Production Agent', 49),
            lane('AGENT RUNTIME - TYPED TOOL FSM', ['Pydantic schemas', 'Budget + loop guard', 'Retry recovery'], 'purple'),
            lane('SAFETY + TRAJECTORY EVALUATION', ['Capability gate', 'Injection quarantine', 'Unbiased pass@k'], 'warm'),
            text('Validate every call. Stop runaway loops. Measure pass@k.', 28),
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
