import { BadgePill, Column, FlowArrow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'RLHF & DPO Alignment. PPO-style RLHF generates a fresh response, scores it with reward and reference models, then updates with a critic. Offline DPO scores a stored preference pair under policy and reference and directly updates the policy.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering'), shadow: 'transparent' }
    const lane = (title: string, labels: string[], tone: 'purple' | 'green') => Column({ gap: 17, children: [
        TextLabel({ c, text: title, fontSize: 26, fontWeight: 700, color: c.textPrimary }),
        Row({ gap: 16, align: 'center', children: labels.flatMap((text, i) => [
            ...(i ? [FlowArrow({ c, direction: 'right', tone, length: 40 })] : []),
            BadgePill({ c, text, tone, width: 300, height: 76, fontSize: 24 }),
        ]) }),
    ] })
    return Scene({ c, background: c.bg, padding: 52, gap: 40, contentWidth: 1096, children: [
        TextLabel({ c, text: 'RLHF & DPO Alignment', fontSize: 56, fontWeight: 750, color: c.textPrimary }),
        lane('PPO-style RLHF · fresh responses', ['Actor samples', 'Reward + reference', 'PPO + critic'], 'purple'),
        lane('Vanilla DPO · fixed preference pairs', ['Chosen / rejected', 'Policy + ref logp', 'Direct policy update'], 'green'),
        Row({ justify: 'end', width: '100%', children: TextLabel({ c, text: 'LeetLLM', fontSize: 25, fontWeight: 700, color: c.primaryLight }) }),
    ] })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected social banner dimensions')
    return result
}
export default create('dark')
