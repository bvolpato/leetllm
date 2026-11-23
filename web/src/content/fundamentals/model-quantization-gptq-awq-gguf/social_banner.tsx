import { Column, Flow, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Model Quantization: GPTQ, AWQ & GGUF. GPTQ and AWQ choose lower-precision weights; GGUF describes stored tensors. A weight 0.73 rounds to code 7 at scale 0.1 and reconstructs as 0.70. LeetLLM.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({ c, background: c.bg, padding: 40, gap: 22, contentWidth: 1120, children: [
        TextLabel({ c, text: 'Model Quantization', fontSize: 57, fontWeight: 800, color: c.textPrimary }),
        TextLabel({ c, text: 'GPTQ, AWQ & GGUF', fontSize: 40, fontWeight: 700, color: c.primaryLight }),
        Flow({ c, connectorLength: 26, gap: 10, stages: [
            { title: 'Weight 0.73', subtitle: 'Original value', tone: 'blue', width: 330 },
            { title: 'Code 7', subtitle: 'Round at scale 0.1', tone: 'purple', width: 330 },
            { title: 'Weight 0.70', subtitle: 'Reconstructed value', tone: 'cyan', width: 330 },
        ] }),
        Row({ gap: 24, children: [
            Panel({ c, title: '', width: 536, padding: 22, tone: 'blue', children: Column({ gap: 10, children: [
                TextLabel({ c, text: 'GPTQ / AWQ', fontSize: 30, fontWeight: 750, color: c.textPrimary }),
                TextLabel({ c, text: 'Algorithms choose the approximation', fontSize: 23 }),
            ] }) }),
            Panel({ c, title: '', width: 536, padding: 22, tone: 'purple', children: Column({ gap: 10, children: [
                TextLabel({ c, text: 'GGUF', fontSize: 30, fontWeight: 750, color: c.textPrimary }),
                TextLabel({ c, text: 'A container describes stored tensors', fontSize: 23 }),
            ] }) }),
        ] }),
        Row({ justify: 'end', children: TextLabel({ c, text: 'LeetLLM', fontSize: 25, fontWeight: 750, color: c.primaryLight }) }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
}
export default create('dark')
