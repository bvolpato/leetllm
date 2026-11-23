import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Monitoring Predictive Models. A 180-minute-old feature snapshot exceeds a 60-minute freshness limit and is rejected. A separate outcome cohort has five mature predictions and one still pending.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), shadow: 'transparent' }
    const label = (text: string, left: number, top: number, size: number, color = c.textPrimary, boxWidth = 492) =>
        <div key={text} style={{ position: 'absolute', left, top, width: boxWidth,
            display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 650,
            lineHeight: 1.2, color }}>{text}</div>
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092,
        children: <div style={{ display: 'flex', position: 'relative', width: 1092, height: 522 }}>
            {label('Monitoring Predictive Models', 0, 0, 48, c.textPrimary, 1092)}
            {label('INPUT CLOCK', 0, 142, 19, c.textSecondary)}
            {label('180-minute-old snapshot', 0, 181, 30)}
            {label('OUTCOME CLOCK', 600, 142, 19, c.textSecondary)}
            {label('5 mature · 1 pending', 600, 181, 30)}
            <svg width={1092} height={105} viewBox="0 0 1092 105" style={{ position: 'absolute', left: 0, top: 239 }}>
                <rect x={0} y={20} width={480} height={46} rx={5} fill={c.critical} />
                <line x1={160} x2={160} y1={0} y2={91} stroke={c.textPrimary} strokeWidth={3} strokeDasharray="6 5" />
                {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={627 + i * 78} cy={43} r={26}
                    fill={i < 5 ? c.positive : c.bg} stroke={i < 5 ? c.positive : c.warning} strokeWidth={3} />)}
            </svg>
            {label('0', 0, 343, 19, c.textSecondary, 60)}
            {label('limit 60m', 115, 343, 19, c.textSecondary, 140)}
            {label('180m', 424, 343, 19, c.textSecondary, 80)}
            {label('Reject before scoring', 0, 392, 27, c.critical)}
            {label('Exclude the open outcome window', 600, 392, 24, c.textSecondary)}
            {label('LeetLLM', 934, 491, 26, c.primary, 158)}
        </div>,
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

export default create()
