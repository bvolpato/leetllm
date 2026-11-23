import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import {renderBanner} from './src/content/foundations/dataset-pipelines-data-quality/social_banner.tsx'; renderBanner('./src/content/foundations/dataset-pipelines-data-quality/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Dataset Pipelines and Data Quality. The grouped-split fixture keeps tickets 301 and 315 from conversation build-001 in train, ticket 303 from build-005 in validation, and ticket 304 from build-006 in test. Provenance records source snapshot, pipeline version, and artifact digest. A versioned candidate still needs review.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const tones = theme === 'dark'
        ? ['#93c5fd', '#c4b5fd', '#67e8f9']
        : ['#1d4ed8', '#6d28d9', '#0e7490']
    const splits = [
        { name: 'TRAIN', conversation: 'build-001', tickets: '301 + 315' },
        { name: 'VALIDATION', conversation: 'build-005', tickets: '303' },
        { name: 'TEST', conversation: 'build-006', tickets: '304' },
    ]
    return Scene({ c, background: c.bg, padding: 50, gap: 0,
        children: <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 20 }}>
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 750, color: c.textPrimary }}>
                Dataset Pipelines and Data Quality
            </div>
            <div style={{ display: 'flex', fontSize: 28, color: c.textSecondary }}>
                Keep every conversation in one split.
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                {splits.map((split, index) => <div key={split.name} style={{
                    display: 'flex', flexDirection: 'column', width: 350, height: 224,
                    border: `2px solid ${tones[index]}`, borderRadius: 10, padding: 24, gap: 16,
                }}>
                    <div style={{ display: 'flex', color: tones[index], fontSize: 23, fontWeight: 700 }}>{split.name}</div>
                    <div style={{ display: 'flex', color: c.textPrimary, fontSize: 35, fontWeight: 700 }}>{split.conversation}</div>
                    <div style={{ display: 'flex', color: c.textSecondary, fontSize: 25 }}>Tickets {split.tickets}</div>
                </div>)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${c.textSecondary}`, paddingTop: 20, gap: 12 }}>
                <div style={{ display: 'flex', fontSize: 26, color: c.textPrimary }}>
                    Provenance: source snapshot · pipeline version · artifact digest
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: c.textSecondary }}>
                    <span>Versioned candidate. Reviews still pending.</span>
                    <span style={{ color: tones[1], fontWeight: 700 }}>LeetLLM</span>
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
