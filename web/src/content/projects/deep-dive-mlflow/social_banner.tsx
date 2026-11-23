import React from 'react'
import { FlowArrow, Scene, getThemeColors, getReadableToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - MLflow. The production prompt alias now points to v18, but a worker with a cached v17 object still records v17 in its request trace. A fresh load resolves v18. Trace the version used by each request.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const lane = (name: string, version: string, tone: string) => React.createElement('div', {
        style: { display: 'flex', height: 110, gap: 24, alignItems: 'center', padding: 20, border: `1px solid ${c.border}`, borderRadius: 10, background: c.bgCard },
    },
    React.createElement('div', { style: { display: 'flex', width: 300, fontSize: 28, color: c.textPrimary } }, name),
    React.createElement('div', { style: { display: 'flex', width: 260, fontSize: 29, color: tone, fontWeight: 700 } }, `uses ${version}`),
    FlowArrow({ c, direction: 'right', length: 64 }),
    React.createElement('div', { style: { display: 'flex', width: 290, fontSize: 29, color: tone, fontWeight: 700 } }, `trace records ${version}`),
    )
    return Scene({ c, background: c.bg, padding: 52, contentWidth: 1096, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', height: 526, flexDirection: 'column' } },
            React.createElement('div', { style: { display: 'flex', fontSize: 52, fontWeight: 750, color: c.textPrimary } }, 'Deep Dive - MLflow'),
            React.createElement('div', { style: { display: 'flex', marginTop: 22, fontSize: 29, color: c.textSecondary } }, 'The production prompt alias now points to v18.'),
            React.createElement('div', { style: { display: 'flex', marginTop: 36, gap: 20, flexDirection: 'column' } },
                lane('Cached worker', 'v17', purple),
                lane('Fresh load', 'v18', green),
            ),
            React.createElement('div', { style: { display: 'flex', marginTop: 30, fontSize: 27, color: c.textPrimary } }, 'Record the resolved template and model configuration.'),
            React.createElement('div', { style: { display: 'flex', marginTop: 28, justifyContent: 'flex-end', fontSize: 23, fontWeight: 700, color: purple } }, 'LeetLLM'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
