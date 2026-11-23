import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Sentence Embeddings & Contrastive Loss. A two-by-two cosine matrix highlights positive pairs on its diagonal: 0.90 and 0.85, against non-matches 0.20 and 0.15. Each query ranks its matching passage.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const green = theme === 'dark' ? '#6ee7b7' : '#047857'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary) =>
        <div key={text} style={{ position: 'absolute', left, top, width: boxWidth, display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.15, color }}>{text}</div>
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: <div style={{ position: 'relative', width: 1092, height: 522, display: 'flex' }}>
            {label('Sentence Embeddings', 0, 0, 1092, 51)}
            {label('& Contrastive Loss', 0, 61, 1092, 51)}
            {label('ONE VECTOR PER TEXT', 0, 181, 530, 18, purple)}
            {label('Rank the matching passage', 0, 220, 510, 32)}
            {label('above the other candidates.', 0, 260, 510, 32)}
            {label('Cosine → temperature → row loss', 0, 349, 560, 24, c.textSecondary)}
            {label('Two-pair similarity batch', 640, 167, 400, 18, c.textSecondary)}
            {label('p₁', 743, 206, 110, 25, purple)}
            {label('p₂', 913, 206, 110, 25, purple)}
            {[['0.90', '0.20'], ['0.15', '0.85']].map((row, i) =>
                <React.Fragment key={i}>
                    {label(`q${i === 0 ? '₁' : '₂'}`, 645, 271 + i * 100, 65, 25, purple)}
                    {row.map((value, j) => <div key={value} style={{ position: 'absolute', left: 706 + j * 170, top: 247 + i * 100, width: 151, height: 83, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, border: `2px solid ${i === j ? green : c.borderLight}`, backgroundColor: c.bgCard, color: i === j ? green : c.textSecondary, fontFamily: 'JetBrains Mono', fontSize: 35, fontWeight: 700 }}>{value}</div>)}
                </React.Fragment>)}
            {label('Positive pairs on the diagonal', 706, 451, 390, 18, green)}
            {label('LeetLLM', 935, 493, 157, 25, purple)}
        </div>,
    })
}

// From web/: pnpm exec tsx -e "import {renderBanner} from './src/content/fundamentals/sentence-embeddings-contrastive-learning/social_banner.tsx'; renderBanner('./src/content/fundamentals/sentence-embeddings-contrastive-learning/social_banner.png')"
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}

export default create('dark')
