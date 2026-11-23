import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Reranking and Cross-Encoders for RAG. Cross-encoder scoring moves the token rule from rank three to rank one. Troubleshooting, password reset, the token rule, and audit export remain the same four candidates.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const accent = theme === 'dark' ? '#5eead4' : '#0f766e'
    const muted = c.textSecondary
    const label = (value: string, x: number, y: number, w: number, size: number, color = c.textPrimary) =>
        <div key={value} style={{ position: 'absolute', left: x, top: y, width: w, display: 'flex', color, fontSize: size, fontFamily: 'Inter', fontWeight: 650, lineHeight: 1.2, letterSpacing: .3 }}>{value}</div>
    const row = (name: string, rank: number, x: number, y: number, relevant = false) =>
        <div key={`${x}-${rank}`} style={{ position: 'absolute', display: 'flex', alignItems: 'center', left: x, top: y, width: 390, height: 58, padding: '0 20px', border: `2px solid ${relevant ? accent : c.border}`, borderRadius: 8, background: c.bgCard, color: relevant ? accent : muted, fontFamily: 'Inter', fontSize: 24, fontWeight: relevant ? 750 : 500 }}>{`${rank} · ${name}`}</div>
    return Scene({ c, padding: 48, contentWidth: 1104, background: c.bg, gap: 0,
        children: <div style={{ display: 'flex', position: 'relative', width: 1104, height: 534 }}>
            {label('Reranking and Cross-Encoders for RAG', 0, 0, 1104, 43)}
            {label('CROSS-ENCODER RESCORING', 0, 91, 1104, 19, muted)}
            {label('Hybrid retrieval', 0, 151, 400, 28)}
            {label('After reranking', 704, 151, 400, 28)}
            {row('Troubleshooting', 1, 0, 205)}
            {row('Password reset', 2, 0, 271)}
            {row('Token rule', 3, 0, 337, true)}
            {row('Audit export', 4, 0, 403)}
            {row('Token rule', 1, 704, 205, true)}
            {row('Audit export', 2, 704, 271)}
            {row('Password reset', 3, 704, 337)}
            {row('Troubleshooting', 4, 704, 403)}
            <svg width={314} height={230} viewBox='0 0 314 230' style={{ position: 'absolute', left: 390, top: 205 }}>
                <path d='M 14 161 L 86 161 L 222 29 L 299 29 M 287 17 L 299 29 L 287 41' fill='none' stroke={accent} strokeWidth={4} />
            </svg>
            {label('3 → 1', 434, 207, 250, 34, accent)}
            {label('Fixture scores move the rule to the top.', 0, 501, 860, 25, muted)}
            {label('LeetLLM', 944, 501, 160, 25, accent)}
        </div>,
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
