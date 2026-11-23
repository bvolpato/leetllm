import { Column, FlowArrow, Panel, Scene, TextLabel, Row, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Computer-Use Agents. A screenshot leads to a proposed click, which passes through host checks for current state and authority before dispatch. A correct click can still be unauthorized.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stage = (title: string, subtitle: string, detail: string) => Panel({ c, title: '', width: 315, padding: 20,
        children: Column({ gap: 14, children: [
            TextLabel({ c, text: title, fontSize: 29, fontWeight: 750, color: c.textPrimary }),
            TextLabel({ c, text: subtitle, fontSize: 20, color: c.textSecondary }),
            TextLabel({ c, text: detail, fontSize: 18, color: c.textSecondary }),
        ] }),
    })
    return Scene({ c, background: c.bg, padding: 48, gap: 32, contentWidth: 1104,
        children: [
            TextLabel({ c, text: 'Computer-Use Agents', fontSize: 52, fontWeight: 800, color: c.textPrimary }),
            TextLabel({ c, text: 'The model proposes. The host decides.', fontSize: 31, color: c.textSecondary }),
            Row({ gap: 22, align: 'center', children: [
                stage('Observe', 'eval-78432 / frame 3', 'Current screen and target'),
                FlowArrow({ c, length: 35 }),
                stage('Propose', 'Click Failed tests', 'Host policy checks authority'),
                FlowArrow({ c, length: 35 }),
                stage('Validate', 'State + scope + authority', 'Then dispatch or stop'),
            ] }),
            TextLabel({ c, text: 'A correct click can still be unauthorized.', fontSize: 34, fontWeight: 650, color: c.textPrimary }),
            TextLabel({ c, text: 'Read-only access limits what a mistaken click can change.', fontSize: 25, color: c.textSecondary }),
            Row({ justify: 'end', children: TextLabel({ c, text: 'LeetLLM', fontSize: 24, fontWeight: 750, color: c.primaryLight }) }),
        ],
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
}
export default create('dark')
