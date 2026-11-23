import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'How to Become an AI Engineer from Zero in 2026. An incident-report assistant preserves INC-123 under application control and summarizes a rollback attempt without inventing a successful outcome.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const box = (label: string, text: string) => React.createElement('div', { key: label, style: {
        display: 'flex', flexDirection: 'column', width: 522, padding: 26,
        background: c.bgCard, border: `2px solid ${c.border}`, borderRadius: 14, gap: 20,
    } },
    React.createElement('div', { style: { display: 'flex', color: c.textSecondary, fontSize: 22 } }, label),
    React.createElement('div', { style: { display: 'flex', color: c.textPrimary, fontSize: 31, lineHeight: 1.3 } }, text))
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: 1092, height: 522, gap: 30 } },
            React.createElement('div', { style: { display: 'flex', fontSize: 47, lineHeight: 1.16, fontWeight: 750, color: c.textPrimary } }, 'How to Become an AI Engineer from Zero in 2026'),
            React.createElement('div', { style: { display: 'flex', fontSize: 26, color: c.textSecondary } }, 'Grow one project you can explain and test.'),
            React.createElement('div', { style: { display: 'flex', gap: 48 } },
                box('INPUT REPORT', 'Rollback attempted. Result unknown.'),
                box('FAITHFUL SUMMARY', 'A rollback was attempted; its outcome is unknown.')),
            React.createElement('div', { style: { display: 'flex', fontSize: 26, color: c.textPrimary, fontFamily: 'JetBrains Mono' } }, 'Application owns incident_id: INC-123'),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', fontSize: 25, fontWeight: 700, color: c.textPrimary } }, 'LeetLLM'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
}

export default create('dark')
