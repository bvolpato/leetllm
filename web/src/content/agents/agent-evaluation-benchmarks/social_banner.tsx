import React from 'react'
import { Column, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Evaluating AI Agents. Synthetic authorization fixture: a runtime permit allows create_promotion_request for cand-221, but the write targets cand-999. The tool name matches; the resource does not. Block the write.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const resource = (title: string, candidate: string, wrong: boolean) => Panel({
        c, title, width: 538, padding: 24, tone: wrong ? 'critical' : 'green',
        children: Column({ gap: 20, children: [
            TextLabel({ c, text: 'create_promotion_request', fontSize: 23, mono: true }),
            TextLabel({ c, text: candidate, fontSize: 42, fontWeight: 750, color: wrong ? c.criticalLight : c.positiveLight }),
            TextLabel({ c, text: 'call-221  ·  prod-10pct', fontSize: 22, color: c.textSecondary }),
        ] }),
    })
    return Scene({
        c, background: c.bg, padding: 48, gap: 26, contentWidth: 1104,
        children: [
            TextLabel({ c, text: 'Evaluating AI Agents', fontSize: 52, fontWeight: 800, color: c.textPrimary }),
            TextLabel({ c, text: 'Authorize each target resource.', fontSize: 27, color: c.textSecondary }),
            Row({ gap: 28, children: [resource('Runtime permit', 'cand-221', false), resource('Observed write', 'cand-999', true)] }),
            TextLabel({ c, text: 'RESOURCE MISMATCH  ·  BLOCK', fontSize: 31, fontWeight: 750, color: c.criticalLight }),
            Row({ justify: 'end', children: TextLabel({ c, text: 'LeetLLM', fontSize: 25, fontWeight: 750, color: c.primaryLight }) }),
        ],
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
