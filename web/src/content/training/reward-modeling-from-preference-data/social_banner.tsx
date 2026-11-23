import {
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    renderToPngWithOutput,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Reward Modeling: learn an ordering, test the reason. A preferred technical answer scores 1.8, a rejected answer scores 0.7, and their margin implies a preference probability of 0.75.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const candidate = (title: string, answer: string, score: string, color: string) =>
        Panel({
            c,
            title,
            width: 538,
            padding: 24,
            children: Column({
                gap: 18,
                children: [
                    TextLabel({ c, text: answer, fontSize: 26, color: c.textPrimary }),
                    TextLabel({ c, text: score, fontSize: 44, fontWeight: 750, color }),
                ],
            }),
        })
    return Scene({
        c,
        background: c.bg,
        padding: 48,
        gap: 28,
        contentWidth: 1104,
        children: [
            TextLabel({
                c,
                text: 'Reward Modeling',
                fontSize: 54,
                fontWeight: 800,
                color: c.textPrimary,
            }),
            TextLabel({
                c,
                text: 'Learn an ordering. Test the reason.',
                fontSize: 32,
                color: c.textSecondary,
            }),
            Row({
                gap: 28,
                children: [
                    candidate(
                        'Preferred answer',
                        'Subtract max(z) before exp(z).',
                        'r = 1.8',
                        theme === 'dark' ? '#34d399' : c.positive,
                    ),
                    candidate(
                        'Rejected answer',
                        'Cast logits after exp(z).',
                        'r = 0.7',
                        theme === 'dark' ? '#fb7185' : c.critical,
                    ),
                ],
            }),
            TextLabel({
                c,
                text: 'Margin 1.1  →  σ(1.1) ≈ 0.75',
                fontSize: 36,
                fontWeight: 700,
                color: c.primaryLight,
            }),
            TextLabel({
                c,
                text: 'Test whether the scorer learned accuracy or length.',
                fontSize: 25,
                color: c.textSecondary,
            }),
            Row({
                justify: 'end',
                children: TextLabel({
                    c,
                    text: 'LeetLLM',
                    fontSize: 24,
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
