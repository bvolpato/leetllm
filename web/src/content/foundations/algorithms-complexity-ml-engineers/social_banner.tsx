import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/algorithms-complexity-ml-engineers/social_banner.tsx'; renderBanner('./src/content/foundations/algorithms-complexity-ml-engineers/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Algorithms for ML Engineers. In the authored example, scans of 4, 8, and 16 chunks perform 4, 8, and 16 inspections. Comparing each unordered pair once performs 6, 28, and 120 comparisons. The values count operations in two different algorithms.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const baseline = 406
    const scale = 1.5
    const groups = [4, 8, 16].map((n, i) => ({ n, pairs: n * (n - 1) / 2, left: 182 + i * 308 }))
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Algorithms for ML Engineers', 0, 0, 1092, 51, c.textPrimary, 750),
            label('Track operation counts as input size grows.', 0, 77, 1092, 27, c.textSecondary),
            label('Scan inspections: n', 124, 140, 420, 25, cyan),
            label('Pair comparisons: n(n − 1) / 2', 592, 140, 500, 25, purple),
            React.createElement('svg', { width: 1092, height: 440, viewBox: '0 0 1092 440', style: { position: 'absolute', left: 0, top: 0 } },
                ...[0, 40, 80, 120].map((value) => React.createElement('line', {
                    key: `grid-${value}`, x1: 85, x2: 1092,
                    y1: baseline - value * scale, y2: baseline - value * scale,
                    stroke: c.textMuted, strokeOpacity: value === 0 ? 0.65 : 0.22, strokeWidth: 1,
                })),
                ...groups.flatMap(({ n, pairs, left }) => [
                    React.createElement('rect', { key: `scan-${n}`, x: left, y: baseline - n * scale, width: 48, height: n * scale, fill: cyan }),
                    React.createElement('rect', { key: `pair-${n}`, x: left + 80, y: baseline - pairs * scale, width: 48, height: pairs * scale, fill: purple }),
                ]),
            ),
            ...[0, 40, 80, 120].map((value) => label(String(value), 20, baseline - value * scale - 10, 64, 20, c.textSecondary)),
            ...groups.flatMap(({ n, pairs, left }) => [
                label(String(n), left + 8, baseline - n * scale - 31, 68, 24, cyan, 750),
                label(String(pairs), left + 78, baseline - pairs * scale - 31, 80, 24, purple, 750),
                label(`n = ${n}`, left + 13, baseline + 19, 170, 26),
            ]),
            label('Same chunk count. Different growth.', 0, 480, 880, 28, c.textSecondary),
            label('LeetLLM', 932, 480, 160, 30, c.textPrimary, 750),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
