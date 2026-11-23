import { Column, FlowArrow, Grid, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Mechanistic Interpretability. A dense activation is encoded into a sparse dictionary code and decoded back to an activation. Reconstruct first. Test what the features mean.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const vector = (title: string, tone: 'purple' | 'green') => Panel({ c, title, width: 275, padding: 22,
        children: Grid({ c, cellWidth: 65, cellHeight: 36, gap: 9,
            rows: [[1, 2, 3], [4, 5, 6], [7, 8, 9]].map(row => row.map(() => ({ label: '', tone }))),
        }),
    })
    return Scene({ c, background: c.bg, padding: 48, gap: 28, contentWidth: 1104,
        children: [
            TextLabel({ c, text: 'Mechanistic Interpretability', fontSize: 48, fontWeight: 800, color: c.textPrimary }),
            TextLabel({ c, text: 'Sparse autoencoders reveal candidate features.', fontSize: 29, color: c.textSecondary }),
            Row({ gap: 22, align: 'center', children: [
                vector('Dense activation', 'purple'),
                FlowArrow({ c, length: 50, tone: 'purple' }),
                Panel({ c, title: 'Sparse dictionary code', width: 330, padding: 22,
                    children: Grid({ c, cellWidth: 30, cellHeight: 30, gap: 8,
                        rows: Array.from({ length: 4 }, (_, row) => Array.from({ length: 7 }, (_, col) => ({ label: '', tone: [2, 9, 17, 24].includes(row * 7 + col) ? 'warm' : 'neutral' }))),
                    }),
                }),
                FlowArrow({ c, length: 50, tone: 'green' }),
                vector('Reconstruction', 'green'),
            ] }),
            Column({ gap: 12, children: [
                TextLabel({ c, text: 'Reconstruct first. Test what the features mean.', fontSize: 32, fontWeight: 650, color: c.textPrimary }),
                TextLabel({ c, text: 'Interpretability needs tests beyond reconstruction error.', fontSize: 25, color: c.textSecondary }),
            ] }),
            Row({ justify: 'end', children: TextLabel({ c, text: 'LeetLLM', fontSize: 25, fontWeight: 750, color: c.primaryLight }) }),
        ],
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
}
export default create('dark')
