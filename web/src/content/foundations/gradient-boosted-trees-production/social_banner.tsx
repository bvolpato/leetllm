import React from 'react'
import { FlowArrow, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/gradient-boosted-trees-production/social_banner.tsx'; renderBanner('./src/content/foundations/gradient-boosted-trees-production/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Gradient Boosted Trees in Production. Fit on January-March point-in-time data; select and freeze rounds, threshold, and costs in April; evaluate the frozen policy against cheap baselines and required slices in May. In the synthetic lab, metric checks pass but operational checks remain pending: bind the model and policy, validate serving, and test rollback.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const label = (text: string, size = 22, muted = false) => TextLabel({ c, text, fontSize: size, color: muted ? c.textSecondary : c.textPrimary, width: '100%', align: 'center' })
    return Scene({ c, background: c.bg, padding: 46, contentWidth: 1108, gap: 14, children: [
        TextLabel({ c, text: 'Gradient Boosted Trees in Production', fontSize: 43, fontWeight: 750, color: c.textPrimary, width: 1108 }),
        TextLabel({ c, text: 'Freeze selection before opening the final holdout.', fontSize: 26, color: c.textSecondary, width: 1108 }),
        Row({ gap: 12, align: 'stretch', justify: 'center', children: [
            Panel({ c, title: 'Jan-Mar: fit', titleFontSize: 27, tone: 'blue', width: 330, padding: 22, gap: 12, children: [
                label('Train the trees', 25),
                label('Point-in-time features', 20, true),
                label('Available labels only', 20, true),
            ] }),
            FlowArrow({ c, direction: 'right', length: 28, tone: 'purple' }),
            Panel({ c, title: 'April: select', titleFontSize: 27, tone: 'purple', width: 330, padding: 22, gap: 12, children: [
                label('Freeze the candidate', 25),
                label('Round count + threshold', 20, true),
                label('Declared error costs', 20, true),
            ] }),
            FlowArrow({ c, direction: 'right', length: 28, tone: 'cyan' }),
            Panel({ c, title: 'May: evaluate', titleFontSize: 27, tone: 'cyan', width: 330, padding: 22, gap: 12, children: [
                label('Score the frozen policy', 25),
                label('Compare cheap baselines', 20, true),
                label('Check required slices', 20, true),
            ] }),
        ] }),
        Panel({ c, title: 'Synthetic lab: operational checks pending', titleFontSize: 28, tone: 'warm', width: 1108, padding: 18, gap: 10, children: [
            TextLabel({ c, text: 'Bind model + policy    •    Validate serving    •    Test rollback', fontSize: 25, color: c.textPrimary, width: '100%', align: 'center' }),
            TextLabel({ c, text: 'Passing a metric gate does not authorize deployment.', fontSize: 23, color: c.textSecondary, width: '100%', align: 'center' }),
        ] }),
        TextLabel({ c, text: 'LeetLLM', fontSize: 24, fontWeight: 700, color: c.textPrimary, width: 1108, align: 'right' }),
    ] })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
