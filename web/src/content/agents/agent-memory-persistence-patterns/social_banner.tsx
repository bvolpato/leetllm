import { BadgePill, Column, FlowArrow, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Agent Memory & Persistence. A retained source feeds a versioned projection and a bounded prompt, with current access checked before recall. A version change or revocation blocks stale recall.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering'), shadow: 'transparent' }
    return Scene({ c, background: c.bg, padding: 52, gap: 36, contentWidth: 1096, children: [
        TextLabel({ c, text: 'Agent Memory & Persistence', fontSize: 54, fontWeight: 750, color: c.textPrimary }),
        TextLabel({ c, text: 'Remember the record. Recheck the right to use it.', fontSize: 28 }),
        Row({ gap: 22, align: 'center', children: [
            Panel({ c, title: 'Retained source', width: 308, padding: 22, accentHeight: 0, children: Column({ gap: 16, children: [
                TextLabel({ c, text: 'command · version 2', fontSize: 22 }),
                BadgePill({ c, text: 'Current scope', tone: 'blue', width: 264, height: 48, fontSize: 23 }),
            ] }) }),
            FlowArrow({ c, direction: 'right', length: 42, tone: 'blue' }),
            Panel({ c, title: 'Recall gate', width: 308, padding: 22, accentHeight: 0, children: Column({ gap: 16, children: [
                TextLabel({ c, text: 'access · version · expiry', fontSize: 21 }),
                BadgePill({ c, text: 'Recheck now', tone: 'warm', width: 264, height: 48, fontSize: 23 }),
            ] }) }),
            FlowArrow({ c, direction: 'right', length: 42, tone: 'green' }),
            Panel({ c, title: 'Next prompt', width: 308, padding: 22, accentHeight: 0, children: Column({ gap: 16, children: [
                TextLabel({ c, text: 'Only eligible context', fontSize: 22 }),
                BadgePill({ c, text: 'Bounded evidence', tone: 'green', width: 264, height: 48, fontSize: 23 }),
            ] }) }),
        ] }),
        BadgePill({ c, text: 'Stale version or revoked access → no recalled record', tone: 'critical', width: 1096, height: 58, fontSize: 26 }),
        Row({ width: '100%', justify: 'end', children: TextLabel({ c, text: 'LeetLLM', fontSize: 25, fontWeight: 700, color: c.primaryLight }) }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
