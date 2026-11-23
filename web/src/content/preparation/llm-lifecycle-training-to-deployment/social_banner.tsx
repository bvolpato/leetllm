import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'The LLM Lifecycle. Training produces a candidate for evaluation and release. Approved weights load into frozen inference. Authorized requests may include retrieved evidence, then inference generates a response for validation and tracing. Trace cases feed release evaluation; model weights change in a later training run.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const artifact = theme === 'dark' ? c.primaryLight : c.primaryDark
    const request = theme === 'dark' ? c.infoLight : c.infoDark
    const feedback = theme === 'dark' ? c.positiveLight : c.positiveDark
    const card = (x: number, y: number, cardWidth: number, title: string, detail: string, color: string) => <div style={{ display: 'flex', position: 'absolute', left: x, top: y, width: cardWidth, height: 100, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, border: `2px solid ${color}`, borderTopWidth: 6, background: c.bgCard }}>
        <div style={{ display: 'flex', fontSize: 27, fontWeight: 700, color }}>{title}</div>
        <div style={{ display: 'flex', fontSize: 20, color: c.textPrimary }}>{detail}</div>
    </div>
    return Scene({ c, padding: 58, contentWidth: 1084, background: c.bg, gap: 0,
        children: <div style={{ display: 'flex', flexDirection: 'column', height: 514, color: c.textPrimary, fontFamily: 'Inter', gap: 18 }}>
            <div style={{ display: 'flex', fontSize: 58, fontWeight: 750 }}>The LLM Lifecycle</div>
            <div style={{ display: 'flex', fontSize: 25, color: c.textSecondary }}>Training produces artifacts. Serving handles requests.</div>
            <div style={{ display: 'flex', position: 'relative', width: 1084, height: 324, marginTop: 12 }}>
                <svg width="1084" height="324" viewBox="0 0 1084 324" style={{ position: 'absolute', left: 0, top: 0 }}>
                    <path d="M300 50 H395 M383 43 L395 50 L383 57" fill="none" stroke={artifact} strokeWidth="3" />
                    <path d="M560 100 V215 M553 203 L560 215 L567 203" fill="none" stroke={artifact} strokeWidth="3" />
                    <path d="M300 270 H395 M383 263 L395 270 L383 277 M720 270 H815 M803 263 L815 270 L803 277" fill="none" stroke={request} strokeWidth="3" />
                    <path d="M952 220 V50 H725" fill="none" stroke={feedback} strokeWidth="3" strokeDasharray="8 6" />
                    <path d="M737 43 L725 50 L737 57" fill="none" stroke={feedback} strokeWidth="3" />
                </svg>
                {card(0, 0, 300, 'Training', 'pre-training / post-training', artifact)}
                {card(400, 0, 320, 'Evaluate + release', 'candidate + application', artifact)}
                <div style={{ display: 'flex', position: 'absolute', left: 303, top: 12, width: 95, justifyContent: 'center', fontSize: 18, color: artifact }}>candidate</div>
                <div style={{ display: 'flex', position: 'absolute', left: 580, top: 125, width: 200, fontSize: 22, color: artifact }}>Load approved weights</div>
                <div style={{ display: 'flex', position: 'absolute', left: 812, top: 113, width: 124, fontSize: 20, color: feedback }}>Trace cases for next evaluation</div>
                {card(0, 220, 300, 'Authorized request', 'with optional retrieval', request)}
                {card(400, 220, 320, 'Frozen inference', 'weights stay fixed', request)}
                {card(820, 220, 264, 'Validate + trace', 'check one response', request)}
            </div>
            <div style={{ display: 'flex', marginTop: 'auto', justifyContent: 'flex-end', fontSize: 25, fontWeight: 700, color: c.textSecondary }}>LeetLLM</div>
        </div>,
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
