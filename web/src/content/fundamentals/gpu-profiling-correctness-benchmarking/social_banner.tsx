import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import {renderBanner} from './src/content/fundamentals/gpu-profiling-correctness-benchmarking/social_banner.tsx'; renderBanner('./src/content/fundamentals/gpu-profiling-correctness-benchmarking/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Correct GPU Profiling and Benchmarking. One FP32 triad element reads x and z, writes y, and performs two FLOPs: 12 algorithmic bytes and 0.167 FLOPs per byte. Profile hardware counters to measure HBM traffic.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const cyan = theme === 'dark' ? '#67e8f9' : '#0e7490'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            color, fontFamily: 'Inter', fontSize: size, fontWeight: weight, lineHeight: 1.2,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Correct GPU Profiling', 0, 0, 1092, 49, c.textPrimary, 750),
            label('and Benchmarking', 0, 60, 1092, 49, c.textPrimary, 750),
            label('ONE FP32 TRIAD ELEMENT', 0, 151, 1092, 19, c.textSecondary),
            label('x: 4 bytes', 0, 222, 300, 31, cyan),
            label('z: 4 bytes', 0, 278, 300, 31, cyan),
            label('αx + z', 422, 242, 310, 42, purple, 700),
            label('2 FLOPs', 430, 300, 300, 23, c.textSecondary),
            label('y: 4 bytes', 860, 250, 232, 31, cyan),
            React.createElement('svg', { width: 1092, height: 150, viewBox: '0 0 1092 150', style: { position: 'absolute', left: 0, top: 208 } },
                React.createElement('path', { d: 'M 210 35 H 302 V 90 H 210 M 302 63 H 402 M 389 54 L 402 63 L 389 72 M 607 63 H 828 M 815 54 L 828 63 L 815 72', fill: 'none', stroke: c.textSecondary, strokeWidth: 3 })),
            label('2 FLOPs / 12 bytes ≈ 0.167 FLOPs/byte', 0, 394, 1092, 36, c.textPrimary, 650),
            label('Algorithmic bytes ≠ measured HBM traffic', 0, 480, 900, 25, c.textSecondary),
            label('LeetLLM', 958, 491, 134, 25, purple, 700),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}

export default create('dark')
