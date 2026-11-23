import React from 'react'
import { Scene, getThemeColors, getToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
import results from './illustrations/study_results.json'

export const width = 1200
export const height = 630
export const autoSize = false
export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), preset: 'engineering' as const }
    const s = results.summary
    const points = (v: number) => `${(100 * v).toFixed(1)} pp`
    const x = (v: number) => 100 + (v + 5) / 35 * 890
    const cyan = getToneColor('cyan', c)
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: 522, width: 1092, color: c.textPrimary, gap: 20 } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 18, color: c.textSecondary } },
                React.createElement('span', null, 'PAIRED REINFORCEMENT-LEARNING EXPERIMENT'), React.createElement('span', null, 'LeetLLM')),
            React.createElement('div', { style: { display: 'flex', fontSize: 47, fontWeight: 800 } }, 'Capstone: Reproducible ML Study'),
            React.createElement('div', { style: { display: 'flex', fontSize: 25, color: c.textSecondary } }, '24 paired seeds. A positive mean. Five regressions.'),
            React.createElement('div', { style: { display: 'flex', position: 'relative', width: 1092, height: 260 } },
                React.createElement('div', { style: { display: 'flex', position: 'absolute', top: 4, left: 100, fontSize: 21, color: c.textSecondary } }, '90% interval for the mean early-success difference'),
                React.createElement('div', { style: { position: 'absolute', left: x(0), top: 59, width: 2, height: 124, backgroundColor: c.textMuted } }),
                React.createElement('div', { style: { position: 'absolute', left: x(100 * s.early_low), top: 107, width: x(100 * s.early_high) - x(100 * s.early_low), height: 7, backgroundColor: cyan } }),
                React.createElement('div', { style: { position: 'absolute', left: x(100 * s.early_mean) - 12, top: 98, width: 24, height: 24, borderRadius: 99, border: `4px solid ${cyan}`, backgroundColor: c.bg } }),
                ...[
                    { value: s.early_low, top: 136, label: points(s.early_low) },
                    { value: s.early_mean, top: 60, label: `+${points(s.early_mean)}` },
                    { value: s.early_high, top: 136, label: points(s.early_high) },
                ].map((d) => React.createElement('div', { key: d.top + d.label, style: { display: 'flex', position: 'absolute', left: x(100 * d.value) - 75, top: d.top, width: 150, justifyContent: 'center', fontSize: 24, color: cyan } }, d.label)),
                React.createElement('div', { style: { position: 'absolute', left: 100, top: 188, width: 890, height: 1, backgroundColor: c.textMuted } }),
                ...[-5, 0, 10, 20, 30].map((tick) => React.createElement('div', { key: tick, style: { display: 'flex', position: 'absolute', left: x(tick) - 30, top: 200, width: 60, justifyContent: 'center', fontSize: 20, color: c.textSecondary } }, String(tick))),
                React.createElement('div', { style: { display: 'flex', position: 'absolute', left: 100, top: 237, fontSize: 20, color: c.textSecondary } }, 'Shaped minus sparse success (percentage points)'),
            ),
            React.createElement('div', { style: { display: 'flex', fontSize: 20, color: c.textSecondary } }, 'Early training success · 90% paired bootstrap interval · Worked simulator evidence'),
        ),
    })
}
export async function renderBanner(outputPath: string) {
    const result = await renderToPngWithOutput(create('dark'), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme: 'dark' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Expected 1200×630 PNG')
    return result
}
export default create('dark')
