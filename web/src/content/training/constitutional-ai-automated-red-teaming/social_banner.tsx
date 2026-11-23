import React from 'react'
import { CalloutCard, Column, FlowArrow, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Constitutional AI and Red Teaming. Constitutional AI uses principles to create training targets and update a model; red teaming sends probes to a target and collects judgments for independent review. Evaluate resulting behavior with separate safety tests.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const color = theme === 'light' ? c.primaryDark : c.primaryLight
    const text = (value: string, top: number, size: number, tone = c.textPrimary) => React.createElement('div', {
        key: value, style: { position: 'absolute', display: 'flex', top, left: 0, width: 1092, color: tone, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2 },
    }, value)
    const column = (title: string, left: number, stages: {title: string, subtitle: string}[], tone: 'purple' | 'warm') => React.createElement('div', {
        key: title, style: { position: 'absolute', display: 'flex', flexDirection: 'column', left, top: 185, width: 504, gap: 20 },
    }, React.createElement('div', { style: { display: 'flex', color: c.textPrimary, fontSize: 25, fontWeight: 750 } }, title),
        Column({ gap: 8, align: 'center', children: stages.flatMap((stage, i) => [
            ...(i ? [FlowArrow({c, direction: 'down', length: 13})] : []),
            CalloutCard({c, title: stage.title, detail: stage.subtitle, tone, filled: false, width: 504, minHeight: 68, padding: 10, titleFontSize: 20, detailFontSize: 13}),
        ]) }),
    )
    return Scene({ c, padding: 54, gap: 0, contentWidth: 1092, background: c.bg,
        children: React.createElement('div', { style: { display: 'flex', position: 'relative', width: 1092, height: 522 } },
            text('Constitutional AI & Red Teaming', 0, 48),
            text('Evaluate resulting behavior with safety tests.', 72, 29, c.textSecondary),
            column('Create supervision', 0, [
                {title: 'Written principles', subtitle: 'guide critique and comparison'},
                {title: 'Text targets + preference labels', subtitle: 'become training data'},
                {title: 'Model updates', subtitle: 'change response behavior'},
            ], 'purple'),
            column('Search for failures', 588, [
                {title: 'Adversarial probes', subtitle: 'with a defined threat model'},
                {title: 'Target responses + effects', subtitle: 'preserve the full context'},
                {title: 'Judgments + independent review', subtitle: 'find errors in model and evaluator'},
            ], 'warm'),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', left: 942, top: 500, fontSize: 24, fontWeight: 700, color } }, 'LeetLLM'),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme})
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return result
}
export default create()
