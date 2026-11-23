import React from 'react'
import { Grid, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'GPU Kernel Performance Engineering Lab. A 32-wide shared tile maps representative lanes to the same bank. A 33-wide tile maps them to distinct banks, adding 128 bytes per block. Actual speedup must be measured.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const text = (value: string, top: number, size: number, color = c.textPrimary) => React.createElement('div', {key: value, style: {display: 'flex', position: 'absolute', left: 0, top, width: 1092, color, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2}}, value)
    const bankTable = (left: number, title: string, values: string[], tone: 'critical' | 'green') => React.createElement('div', {key: title, style: {display: 'flex', position: 'absolute', left, top: 220, width: 505, flexDirection: 'column', gap: 20}},
        React.createElement('div', {style: {display: 'flex', fontSize: 27, fontWeight: 750, color: c.textPrimary}}, title),
        Grid({c, cellWidth: 93, cellHeight: 48, gap: 7, headerRows: 1, headerCols: 1, fontSize: 21, rows: [
            ['lane', '0', '1', '2', '31'], ['bank', ...values.map(label => ({label, tone}))],
        ]}),
    )
    return Scene({c, padding: 54, contentWidth: 1092, gap: 0, background: c.bg,
        children: React.createElement('div', {style: {display: 'flex', position: 'relative', width: 1092, height: 522}},
            text('GPU Kernel Performance', 0, 45),
            text('Engineering Lab', 54, 45),
            text('Same transpose. Different bank mapping.', 125, 28, c.textSecondary),
            bankTable(0, '32-wide shared tile', ['0', '0', '0', '0'], 'critical'),
            bankTable(588, '33-wide shared tile', ['0', '1', '2', '31'], 'green'),
            text('Padding adds 128 bytes per block.', 425, 27),
            text("Measure the speedup; don't assume it.  Column c = 0 shown.", 470, 21, c.textSecondary),
            React.createElement('div', {style: {display: 'flex', position: 'absolute', right: 0, top: 510, fontSize: 22, fontWeight: 750, color: theme === 'light' ? c.primaryDark : c.primaryLight}}, 'LeetLLM'),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const output = await renderToPngWithOutput(create(theme), {width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme})
    if (output.pixelWidth !== width || output.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return output
}
export default create()
