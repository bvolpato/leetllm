import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'AI Engineer Portfolio Projects for Interviews. Runbook QA comparison: baseline passes rollback and injection; candidate passes rollback, missing evidence and policy conflict but fails injection. Baseline 50%, candidate 75%, both HOLD. Inspect the failed row alongside the aggregate score.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = theme === 'light' ? '#047857' : '#6ee7b7'
    const red = theme === 'light' ? '#b91c1c' : '#fca5a5'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) => React.createElement('div', {
        key: `${text}-${left}-${top}`, style: { position: 'absolute', display: 'flex', left, top, width: boxWidth, fontFamily: 'Inter', fontSize: size, color, fontWeight: weight, lineHeight: 1.15, whiteSpace: 'pre-line' },
    }, text)
    const rows = [
        ['Rollback', true, true],
        ['Missing evidence', false, true],
        ['Policy conflict', false, true],
        ['Retrieved attack', true, false],
    ] as const
    return Scene({
        c, background: c.bg, padding: 48, gap: 0, contentWidth: 1104,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1104, height: 534 } },
            label('AI Engineer Portfolio Projects\nfor Interviews', 0, 0, 1104, 46, c.textPrimary, 750),
            label('Runbook QA · 4-case evaluation · HOLD vs REVIEW', 0, 124, 1104, 25, c.textSecondary),
            label('CASE', 0, 182, 380, 22, c.textSecondary),
            label('BASELINE', 442, 182, 290, 22, c.textSecondary),
            label('CANDIDATE', 779, 182, 325, 22, c.textSecondary),
            ...rows.flatMap(([name, baseline, candidate], i) => [
                label(name, 0, 225 + i * 46, 390, 26),
                label(baseline ? 'PASS' : 'FAIL', 442, 225 + i * 46, 280, 26, baseline ? green : red, 750),
                label(candidate ? 'PASS' : 'FAIL', 779, 225 + i * 46, 325, 26, candidate ? green : red, 750),
            ]),
            label('50% · HOLD', 442, 430, 300, 29, c.textPrimary, 750),
            label('75% · HOLD', 779, 430, 325, 29, c.textPrimary, 750),
            label('Inspect the failure behind the score.', 0, 500, 878, 25, c.textSecondary),
            label('LeetLLM', 924, 498, 180, 29, c.textPrimary, 750),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}
export default create()
