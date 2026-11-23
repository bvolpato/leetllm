import React from 'react'
import { Scene, Grid, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width = 1200
export const height = 630
export const autoSize = false
export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), preset: 'engineering' as const }
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092, children:
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 32, width: 1092, height: 522, color: c.textPrimary } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 20, color: c.textSecondary } }, React.createElement('span', null, 'TRAIN ON THE ANSWER'), React.createElement('span', null, 'LeetLLM')),
            React.createElement('div', { style: { fontSize: 47, fontWeight: 800 } }, 'Supervised Fine-Tuning Pipeline'),
            React.createElement('div', { style: { fontSize: 26, color: c.textSecondary } }, 'Prompt stays context. Answer and stop receive loss.'),
            React.createElement(Grid, { c, rows: [
                ['Symbolic span', 'Instruction + prompt', 'Response tokens', 'Stop'],
                ['Loss label', '-100', 'answer ID', 'stop ID'],
                ['Purpose', 'Condition the reply', 'Teach behavior', 'Teach ending'],
            ], cellWidth: 262, cellHeight: 58, fontSize: 21, headerRows: 1, headerCols: 1, gap: 5 }),
            React.createElement('div', { style: { display: 'flex', fontSize: 25, color: c.textSecondary } }, 'Group the split · Verify the shift · Test the resume · Select on validation'),
        ),
    })
}
export async function renderBanner(outputPath: string) {
    const result = await renderToPngWithOutput(create('dark'), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme: 'dark' })
    if (result.width !== width || result.height !== height) throw new Error('Expected 1200x630')
    return result
}
