import { Column, Grid, Panel, Row, Scene, TextLabel, getThemeColors, getToneFill, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import {renderBanner} from './src/content/projects/deep-dive-pytorch/social_banner.tsx'; renderBanner('./src/content/projects/deep-dive-pytorch/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - PyTorch. Six int64 elements use one 48-byte allocation. A 2-by-3 tensor and its 3-by-2 transpose expose the same values using different strides. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const highlighted = { label: '3', backgroundColor: getToneFill('purple', c), color: c.textPrimary, borderColor: c.primaryLight }
    return Scene({ c, background: c.bg, padding: 44, gap: 24, contentWidth: 1112, children: [
        TextLabel({ c, text: 'Deep Dive - PyTorch', color: c.textPrimary, fontSize: 58, fontWeight: 800 }),
        TextLabel({ c, text: 'One allocation. Two index maps.', color: c.primaryLight, fontSize: 32, fontWeight: 650 }),
        Row({ gap: 24, children: [
            Panel({ c, title: 'x: shape [2, 3]', subtitle: 'strides (3, 1)', width: 544, padding: 22, tone: 'blue',
                children: Grid({ c, cellWidth: 130, cellHeight: 48, fontSize: 28, rows: [['0', '1', '2'], [highlighted, '4', '5']] }) }),
            Panel({ c, title: 'x.t(): shape [3, 2]', subtitle: 'strides (1, 3)', width: 544, padding: 22, tone: 'purple',
                children: Grid({ c, cellWidth: 150, cellHeight: 48, fontSize: 28, rows: [['0', highlighted], ['1', '4'], ['2', '5']] }) }),
        ] }),
        Column({ gap: 12, children: [
            TextLabel({ c, text: '6 int64 elements × 8 bytes = 48 shared bytes', color: c.textPrimary, fontSize: 28, fontWeight: 600 }),
            Row({ width: 1112, justify: 'end', children: TextLabel({ c, text: 'LeetLLM', color: c.primaryLight, fontSize: 27, fontWeight: 750 }) }),
        ] }),
    ] })
}
export function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
}
export default create('dark')
