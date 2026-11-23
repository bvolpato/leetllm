import React from 'react'
import { Grid, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Continuous Batching and Scheduling. Decode-only snapshots show D replacing A after iteration 10 and E replacing B after iteration 50, while C continues. Refill freed slots within token and KV budgets.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const cell = (label: string, tone: 'blue' | 'green' | 'purple' | 'cyan' | 'warm') => ({ label, tone })
    return Scene({ c, background: c.bg, padding: 48, gap: 30,
        title: 'Continuous Batching & Scheduling',
        subtitle: 'New requests fill freed slots without waiting for the longest sequence.',
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 32 } },
            Grid({ c, cellWidth: 265, cellHeight: 64, fontSize: 20, headerRows: 1, headerCols: 1,
                rows: [
                    ['after iteration', '0', '10', '50'],
                    ['slot 1', cell('A', 'blue'), cell('D joins', 'cyan'), cell('D', 'cyan')],
                    ['slot 2', cell('B', 'green'), cell('B', 'green'), cell('E joins', 'warm')],
                    ['slot 3', cell('C', 'purple'), cell('C', 'purple'), cell('C', 'purple')],
                ],
            }),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', color: c.textSecondary, fontSize: 22 } },
                React.createElement('span', {}, 'Refill within token and KV budgets.'),
                React.createElement('span', { style: { color: c.primary, fontWeight: 700 } }, 'LeetLLM'),
            ),
            React.createElement('span', { style: { fontSize: 16, color: c.textSecondary } }, 'Decode slot transitions after iterations 0, 10, and 50.'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner size')
    return result
}

export default create('dark')
