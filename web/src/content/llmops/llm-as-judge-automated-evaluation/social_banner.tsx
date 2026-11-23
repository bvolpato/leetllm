import { GraphDiagram, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'LLM-as-a-Judge Evaluation. An illustrative order swap maps verdict B and verdict A to the same stepwise answer. Validate stable judge preferences against human labels.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({ c, padding: 42, gap: 18, contentWidth: 1116, background: c.bg,
        children: [
            TextLabel({ c, text: 'LLM-as-a-Judge Evaluation', fontSize: 56, fontWeight: 800, color: c.textPrimary }),
            TextLabel({ c, text: 'Swap the slots. Track the answer. Validate the judge.', fontSize: 27 }),
            GraphDiagram({ c, width: 1116, height: 325, layout: 'manual',
                nodeWidth: 305, nodeHeight: 104, labelFontSize: 27, detailFontSize: 20,
                nodes: [
                    { id: 'original', label: 'Original order: B', detail: 'A compact · B stepwise', x: 0.16, y: 0.23, tone: 'blue' },
                    { id: 'swapped', label: 'Swapped order: A', detail: 'A stepwise · B compact', x: 0.16, y: 0.78, tone: 'cyan' },
                    { id: 'identity', label: 'Same answer', detail: 'stepwise', x: 0.58, y: 0.5, tone: 'green' },
                    { id: 'check', label: 'Human check', detail: 'Is the preference sound?', x: 0.88, y: 0.5, width: 240, tone: 'warm' },
                ],
                edges: [
                    { from: 'original', to: 'identity', tone: 'blue' },
                    { from: 'swapped', to: 'identity', tone: 'cyan' },
                    { from: 'identity', to: 'check', tone: 'warm' },
                ],
            }),
            Row({ width: 1116, justify: 'space-between', children: [
                TextLabel({ c, text: 'ILLUSTRATIVE PAIR  •  STABILITY ≠ CORRECTNESS', fontSize: 20 }),
                TextLabel({ c, text: 'LeetLLM', fontSize: 28, fontWeight: 800, color: c.textPrimary }),
            ] }),
        ] })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false,
        watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Expected ${width}x${height}; got ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create()
