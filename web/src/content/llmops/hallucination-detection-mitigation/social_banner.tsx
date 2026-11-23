import { Column, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Hallucination Detection and Mitigation. Retrieved PyTorch v2.6 docs state fullgraph=True raises an error on graph breaks, while the draft answer claims silent eager fallback. Prune the contradicted claim.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({
        c,
        background: c.bg,
        padding: 48,
        gap: 26,
        contentWidth: 1104,
        children: [
            TextLabel({ c, text: 'Hallucination Detection & Mitigation', fontSize: 44, fontWeight: 800 }),
            TextLabel({
                c,
                text: 'Verify every atomic claim against retrieved evidence.',
                fontSize: 29,
                color: c.textSecondary,
            }),
            Row({
                gap: 28,
                children: [
                    Panel({
                        c,
                        title: 'Retrieved chunk · PyTorch v2.6 docs',
                        tone: 'cyan',
                        width: 538,
                        padding: 24,
                        children: Column({
                            gap: 16,
                            children: [
                                TextLabel({ c, text: 'fullgraph=True', fontSize: 25, mono: true }),
                                TextLabel({
                                    c,
                                    text: 'Raises error',
                                    fontSize: 44,
                                    fontWeight: 750,
                                    color: c.infoLight,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Halts on any Python graph break',
                                    fontSize: 23,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Draft response claim',
                        tone: 'critical',
                        width: 538,
                        padding: 24,
                        children: Column({
                            gap: 16,
                            children: [
                                TextLabel({ c, text: 'fullgraph=True fallback', fontSize: 25, mono: true }),
                                TextLabel({
                                    c,
                                    text: 'Silent eager',
                                    fontSize: 44,
                                    fontWeight: 750,
                                    color: c.criticalLight,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Contradicted · prune or abstain',
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
                text: 'Calibrate NLI scores. Serve only what evidence supports.',
                fontSize: 30,
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
    return renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
}

export default create('dark')
