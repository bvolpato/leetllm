import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Serving Benchmark Engineering. A hypothetical comparison shows 190 of 200 requests qualifying at 1.5 requests per second, versus 160 of 200 at 2.0 requests per second. Only the first reaches the 95 percent attainment target. Measure request attainment with a load test on the target service.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const text = (value: string, x: number, y: number, size: number, color = c.textPrimary) => React.createElement('div', {key: value, style: {display: 'flex', position: 'absolute', left: x, top: y, fontFamily: 'Inter', fontWeight: 650, fontSize: size, color}}, value)
    return Scene({c, padding: 54, contentWidth: 1092, background: c.bg,
        children: React.createElement('div', {style: {display: 'flex', position: 'relative', width: 1092, height: 522}},
            text('Serving Benchmark', 0, 0, 49),
            text('Engineering', 0, 57, 49),
            text('Count the requests that meet the promise.', 0, 139, 29, c.textSecondary),
            ...[{rps:'1.5 RPS', pass:190, y:245}, {rps:'2.0 RPS', pass:160, y:360}].map(row => React.createElement('div', {key: row.rps, style: {display: 'flex'}},
                text(row.rps, 0, row.y + 6, 27),
                React.createElement('div', {style: {display: 'flex', position: 'absolute', left: 200, top: row.y, width: 680, height: 51, border: `1px solid ${c.textSecondary}`}},
                    React.createElement('div', {style: {display: 'flex', width: 680 * row.pass / 200, height: 49, background: c.primary}}),
                ),
                text(`${row.pass}/200`, 915, row.y + 8, 26),
            )),
            React.createElement('div', {style: {display: 'flex', position: 'absolute', left: 200 + 680 * .95, top: 220, height: 207, borderLeft: `3px dashed ${c.warning}`}}),
            text('95% target', 737, 187, 23, c.textSecondary),
            text('Supplied scenario inputs. Replace them with measured serving data.', 0, 458, 23, c.textSecondary),
            text('Qualified / offered requests', 0, 496, 22, c.textSecondary),
            text('LeetLLM', 975, 526, 22, theme === 'light' ? c.primaryDark : c.primaryLight),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const output = await renderToPngWithOutput(create(theme), {width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme})
    if (output.pixelWidth !== width || output.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return output
}
export default create()
