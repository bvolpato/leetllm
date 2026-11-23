import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/training/programmatic-prompt-optimization-dspy/social_banner.tsx'; renderBanner('./src/content/training/programmatic-prompt-optimization-dspy/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Prompt Optimization with DSPy. Validation counts show Compiled A at 19/20 versus baseline 14/20, then test counts reverse to 13/20 versus baseline 16/20 on a 20-case scale.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = theme === 'dark' ? '#60a5fa' : '#1d4ed8'
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const label = (text: string, left: number, top: number, w: number, size: number, color = c.textPrimary) => React.createElement('div', {
        key: `${text}-${left}-${top}`, style: { display: 'flex', position: 'absolute', left, top, width: w, fontFamily: 'Inter', fontWeight: 600, fontSize: size, lineHeight: 1.15, color },
    }, text)
    const rows = [
        { name: 'Baseline', count: 14, color: blue, left: 0, top: 230 },
        { name: 'Compiled A', count: 19, color: purple, left: 0, top: 330 },
        { name: 'Baseline', count: 16, color: blue, left: 570, top: 230 },
        { name: 'Compiled A', count: 13, color: purple, left: 570, top: 330 },
    ]
    return Scene({ c, background: c.bg, padding: 48, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', position: 'relative', width: 1104, height: 534 } },
            label('Prompt Optimization with DSPy', 0, 0, 1104, 51),
            label('VALIDATION VS TEST RESULTS · 20 CASES PER SPLIT', 0, 94, 1104, 19, c.textSecondary),
            label('Select on validation', 0, 163, 520, 30),
            label('Then check untouched test', 570, 163, 534, 30),
            ...rows.flatMap(row => [
                label(row.name, row.left, row.top, 520, 23, row.color),
                React.createElement('div', { key: `bar-${row.left}-${row.top}`, style: { display: 'flex', position: 'absolute', left: row.left, top: row.top + 37, width: 400, height: 30, background: c.bgSubtle, border: `1px solid ${c.border}` } },
                    React.createElement('div', { style: { display: 'flex', width: 400 * row.count / 20, height: 28, background: row.color } })),
                label(`${row.count}/20`, row.left + 420, row.top + 34, 100, 27, row.color),
            ]),
            label('A search winner still needs independent evaluation.', 0, 445, 1104, 26, c.textSecondary),
            label('LeetLLM', 955, 502, 149, 25, purple),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
