import React from 'react'
import { Arrow, Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'
import { patches, pixels } from './illustrations/vit_patch_encoder'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/fundamentals/vision-transformers-image-encoders/social_banner'; renderBanner('./src/content/fundamentals/vision-transformers-image-encoders/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Vision Transformers and Image Encoders. A numbered 4 by 4 pixel crop splits into four colored patches and then four corresponding rows. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const colors = theme === 'dark' ? [c.primaryLight, c.secondaryLight, c.positiveLight, c.warningLight] : [c.primary, c.secondary, c.positive, c.warning]
    const box = (v: number, color: string) => React.createElement('div', { key: v, style: { display: 'flex', width: 54, height: 50, alignItems: 'center', justifyContent: 'center', color: c.textPrimary, background: c.bgCard, border: `2px solid ${color}`, fontFamily: 'JetBrains Mono', fontSize: 22 } }, v)
    return Scene({ c, background: c.bg, padding: 48, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: 1104, height: 534 } },
            React.createElement('div', { style: { display: 'flex', fontSize: 48, fontWeight: 650, lineHeight: 1.12, color: c.textPrimary, width: 1060 } }, 'Vision Transformers and Image Encoders'),
            React.createElement('div', { style: { display: 'flex', marginTop: 25, fontSize: 24, color: c.textSecondary } }, 'Pixels become ordered patch vectors'),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginTop: 36 } },
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } }, ...pixels.map((row, r) => React.createElement('div', { key: r, style: { display: 'flex', gap: 6, marginTop: r === 2 ? 8 : 0 } }, ...row.map((v, col) => box(v, colors[2 * Math.floor(r / 2) + Math.floor(col / 2)]))))),
                Arrow({ c, direction: 'right' }),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, ...patches.map((row, r) => React.createElement('div', { key: r, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                    React.createElement('div', { style: { display: 'flex', width: 100, fontSize: 21, color: colors[r] } }, `patch ${r}`), ...row.map(v => box(v, colors[r]))))),
            ),
            React.createElement('div', { style: { display: 'flex', marginTop: 'auto', justifyContent: 'space-between', color: c.textSecondary, fontSize: 20 } },
                React.createElement('div', { style: { display: 'flex' } }, '4 × 4 pixel crop · four 2 × 2 patches'),
                React.createElement('div', { style: { display: 'flex', color: colors[1], fontSize: 25, fontWeight: 650 } }, 'LeetLLM'),
            ),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
