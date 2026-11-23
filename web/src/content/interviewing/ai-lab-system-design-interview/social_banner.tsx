import React from 'react'
import { Scene, getThemeColors, getToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'AI Lab System Design Interview. Under the example gateway policy, 20,000 queued tokens imply 0.16 seconds of waiting and pass a 0.25-second queue budget. 50,000 imply 0.40 seconds and receive 503. Both callers are under quota.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const green = getToneColor('green', c)
    const red = getToneColor('critical', c)
    const purple = getToneColor('purple', c)
    const row = (tokens: string, wait: number, outcome: string, color: string) => React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: 24, height: 88 },
    },
    React.createElement('div', { style: { display: 'flex', width: 230, fontSize: 25, color: c.textPrimary } }, tokens),
    React.createElement('div', { style: { display: 'flex', position: 'relative', width: 520, height: 52, background: c.bgCard, border: `1px solid ${c.border}` } },
        React.createElement('div', { style: { display: 'flex', width: wait / 0.5 * 520, height: 50, background: color } }),
        React.createElement('div', { style: { display: 'flex', position: 'absolute', left: 260, top: 0, height: 50, borderLeft: `3px dashed ${c.textPrimary}` } }),
    ),
    React.createElement('div', { style: { display: 'flex', width: 250, fontSize: 26, fontWeight: 700, color } }, `${wait.toFixed(2)} s · ${outcome}`),
    )
    return Scene({ c, background: c.bg, padding: 52, contentWidth: 1096, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', height: 526, flexDirection: 'column' } },
            React.createElement('div', { style: { display: 'flex', fontSize: 47, fontWeight: 750, color: c.textPrimary } }, 'AI Lab System Design Interview'),
            React.createElement('div', { style: { display: 'flex', marginTop: 22, fontSize: 29, color: c.textSecondary } }, 'Serving readiness includes quota, latency, and quality headroom.'),
            React.createElement('div', { style: { display: 'flex', marginTop: 42, marginLeft: 400, fontSize: 22, color: c.textPrimary } }, '0.25 s queue budget'),
            row('20K tokens queued', 0.16, 'accept', green),
            row('50K tokens queued', 0.40, '503', red),
            React.createElement('div', { style: { display: 'flex', marginLeft: 254, width: 520, justifyContent: 'space-between', fontSize: 19, color: c.textSecondary } },
                React.createElement('span', null, '0 s'), React.createElement('span', null, '0.50 s'),
            ),
            React.createElement('div', { style: { display: 'flex', marginTop: 35, fontSize: 23, color: c.textSecondary } }, 'Reference capacity: 125K tokens/s. Measure latency on live traffic.'),
            React.createElement('div', { style: { display: 'flex', marginTop: 33, justifyContent: 'flex-end', fontSize: 23, fontWeight: 700, color: purple } }, 'LeetLLM'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
