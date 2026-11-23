import React from 'react'
import { FlowArrow, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import {renderBanner} from './src/content/preparation/calling-llm-apis-production/social_banner.tsx'; renderBanner('./src/content/preparation/calling-llm-apis-production/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Calling LLM APIs in Production. Server adapter validates strict JSON schema output against retrieved context IDs before returning answers. Bounded retries handle transient HTTP 429 and 503 responses with single-owner backoff, Retry-After floors, full jitter, and a circuit breaker fallback.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const blue = theme === 'dark' ? '#93c5fd' : '#1d4ed8'
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const card = (title: string, subtitle: string, color: string) => <div style={{
        display: 'flex', flexDirection: 'column', width: 332, height: 105, padding: 19,
        justifyContent: 'center', gap: 10, border: `2px solid ${color}`, borderRadius: 8,
    }}>
        <span style={{ fontSize: 27, fontWeight: 700, color }}>{title}</span>
        <span style={{ fontSize: 20, color: c.textSecondary }}>{subtitle}</span>
    </div>
    return Scene({ c, background: c.bg, padding: 50, gap: 0,
        children: <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 20 }}>
            <div style={{ display: 'flex', fontSize: 51, fontWeight: 750, color: c.textPrimary }}>Calling LLM APIs in Production</div>
            <div style={{ display: 'flex', fontSize: 28, color: c.textSecondary }}>Validate schemas, bound retries, and handle streams safely.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: blue }}>GROUNDED OUTPUT VALIDATION</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {card('Model response', 'Untrusted JSON candidate', blue)}
                    <FlowArrow c={c} direction="right" length={32} color={blue} />
                    {card('Server validation', 'Schema + retrieved chunk IDs', blue)}
                    <FlowArrow c={c} direction="right" length={32} color={blue} />
                    {card('Verified reply', 'Cited answer or reject', blue)}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: purple }}>BOUNDED RETRY & FALLBACK</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {card('Error classifier', 'Transient 429 vs quota fail', purple)}
                    <FlowArrow c={c} direction="right" length={32} color={purple} />
                    {card('Single retry loop', 'Deadline + Retry-After + jitter', purple)}
                    <FlowArrow c={c} direction="right" length={32} color={purple} />
                    {card('Circuit breaker', 'Half-Open probe & fallback', purple)}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 5, color: c.textSecondary }}>
                <span style={{ fontSize: 21 }}>Streams: treat missing terminal completion event as incomplete; track cached vs ordinary tokens</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22 }}>
                    <span>Reject ungrounded citations. Keep provider credentials server-side.</span>
                    <span style={{ color: purple, fontWeight: 700 }}>LeetLLM</span>
                </div>
            </div>
        </div>,
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
