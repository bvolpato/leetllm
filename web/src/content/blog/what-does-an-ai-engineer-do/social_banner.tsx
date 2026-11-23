import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'What Does an AI Engineer Actually Do? Applied AI delivers a tested product workflow, ML platforms deliver a reliable train-and-serve path, and research engineering delivers a reproducible experiment.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const lanes = [
        ['Applied AI', 'Tested product workflow'],
        ['ML platforms', 'Reliable train-and-serve path'],
        ['Research engineering', 'Reproducible experiment'],
    ]
    return Scene({ c, background: c.bg, padding: 52, gap: 0, contentWidth: 1096,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: 1096, height: 526, gap: 24 } },
            React.createElement('div', { style: { display: 'flex', fontSize: 45, fontWeight: 750, color: c.textPrimary, lineHeight: 1.15 } }, 'What Does an AI Engineer Actually Do?'),
            React.createElement('div', { style: { display: 'flex', fontSize: 23, color: c.textSecondary, marginBottom: 6 } }, 'Read the job by the artifact you own.'),
            ...lanes.map(([role, artifact]) => React.createElement('div', { key: role, style: {
                display: 'flex', alignItems: 'center', width: 1096, padding: '22px 26px',
                background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14,
            } },
            React.createElement('div', { style: { display: 'flex', width: 400, fontSize: 28, fontWeight: 700, color: c.textPrimary } }, role),
            React.createElement('div', { style: { display: 'flex', fontSize: 27, color: c.textSecondary } }, artifact))),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', fontSize: 25, fontWeight: 700, color: c.textPrimary, marginTop: 4 } }, 'LeetLLM'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
}

export default create('dark')
