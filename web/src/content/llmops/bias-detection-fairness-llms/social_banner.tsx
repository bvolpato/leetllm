import { Column, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Bias Detection and Fairness in LLMs. Identical qualifications under a 0.70 cutoff score 0.78 on formal phrasing and auto-serve, versus 0.67 on conversational phrasing triggering review.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({
        c,
        background: c.bg,
        padding: 48,
        gap: 26,
        contentWidth: 1104,
        children: [
            TextLabel({ c, text: 'Bias Detection & Fairness in LLMs', fontSize: 44, fontWeight: 800 }),
            TextLabel({
                c,
                text: 'Same facts. Different wording. Different routing.',
                fontSize: 29,
                color: c.textSecondary,
            }),
            Row({
                gap: 28,
                children: [
                    Panel({
                        c,
                        title: 'Formal prompt · matched pair',
                        tone: 'cyan',
                        width: 538,
                        padding: 24,
                        children: Column({
                            gap: 16,
                            children: [
                                TextLabel({ c, text: 'cutoff = 0.70', fontSize: 25, mono: true }),
                                TextLabel({
                                    c,
                                    text: '0.78 score',
                                    fontSize: 44,
                                    fontWeight: 750,
                                    color: c.infoLight,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Auto-serve route selected',
                                    fontSize: 23,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Conversational prompt · same facts',
                        tone: 'purple',
                        width: 538,
                        padding: 24,
                        children: Column({
                            gap: 16,
                            children: [
                                TextLabel({ c, text: 'cutoff = 0.70', fontSize: 25, mono: true }),
                                TextLabel({
                                    c,
                                    text: '0.67 score',
                                    fontSize: 44,
                                    fontWeight: 750,
                                    color: c.warningLight,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Human review route triggered',
                                    fontSize: 23,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                    }),
                ],
            }),
            TextLabel({
                c,
                text: 'Audit counterfactual pairs, intersectional slices, and subgroup calibration.',
                fontSize: 29,
                fontWeight: 650,
            }),
            Row({
                justify: 'end',
                children: TextLabel({
                    c,
                    text: 'LeetLLM',
                    fontSize: 25,
                    fontWeight: 750,
                    color: c.primaryLight,
                }),
            }),
        ],
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error('Expected 1200x630 banner')
    }
    return result
}

export default create('dark')
