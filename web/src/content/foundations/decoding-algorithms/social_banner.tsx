import React from 'react'
import { Card, Column, Row, Scene, TextLabel, getThemeColors, getToneColor, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const tokens = ['create', 'revoke', 'rename', 'quota']
export const logits = [3, 2.5, 1, -1]
const weights = logits.map(z => Math.exp(z - Math.max(...logits)))
const total = weights.reduce((a, b) => a + b, 0)
export const probabilities = weights.map(w => w / total)
export const plotHeight = 196
export const baseline = 208
export const bars = probabilities.map((p, i) => ({ x: 77 + i * 102, y: baseline - p * plotHeight, width: 55, height: p * plotHeight }))

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return <Scene c={c} background={c.bg} padding={48} gap={0}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 1104, height: 534, gap: 23 }}>
            <TextLabel c={c} text="Decoding Algorithms" variant="title" fontSize={51} color={c.textPrimary} />
            <TextLabel c={c} text="Three strategies: choose the maximum, sample, or maintain beams." fontSize={25} />
            <Row gap={32} align="center">
                <Column gap={14}>
                    <TextLabel c={c} text="One illustrative next-token distribution" fontSize={22} color={c.textPrimary} />
                    <div style={{ display: 'flex', position: 'relative', width: 484, height: 255 }}>
                        <svg width={484} height={255} viewBox="0 0 484 255" role="img" aria-label="Discrete next-token probabilities on a zero-to-one scale">
                            {[0, 0.5, 1].map(tick => <line key={tick} x1={46} x2={472} y1={baseline - tick * plotHeight} y2={baseline - tick * plotHeight} stroke={c.textMuted} strokeOpacity={0.3} />)}
                            {bars.map((bar, i) => <rect key={tokens[i]} {...bar} fill={getToneColor(i === 0 ? 'cyan' : 'purple', c)} />)}
                        </svg>
                        {[0, 0.5, 1].map(tick => <div key={tick} style={{ display: 'flex', position: 'absolute', left: 0, top: baseline - tick * plotHeight - 11, width: 36, justifyContent: 'flex-end', color: c.textMuted, fontSize: 18 }}>{tick}</div>)}
                        {bars.map((bar, i) => <div key={`value-${tokens[i]}`} style={{ display: 'flex', position: 'absolute', left: bar.x - 15, top: bar.y - 34, width: 85, justifyContent: 'center', color: c.textPrimary, fontSize: 22 }}>{probabilities[i].toFixed(3)}</div>)}
                        {bars.map((bar, i) => <div key={`token-${tokens[i]}`} style={{ display: 'flex', position: 'absolute', left: bar.x - 20, top: 224, width: 95, justifyContent: 'center', color: c.textPrimary, fontSize: 20 }}>{tokens[i]}</div>)}
                    </div>
                </Column>
                <Column gap={12}>
                    <Card c={c} width={588} height={96} padding={17} gap={7} tone="cyan">
                        <TextLabel c={c} text="Greedy" fontSize={27} color={c.textPrimary} />
                        <TextLabel c={c} text="Pick the maximum: create at this step." fontSize={22} />
                    </Card>
                    <Card c={c} width={588} height={96} padding={17} gap={7} tone="purple">
                        <TextLabel c={c} text="Sampling" fontSize={27} color={c.textPrimary} />
                        <TextLabel c={c} text="Draw a token; filters may limit the candidates." fontSize={22} />
                    </Card>
                    <Card c={c} width={588} height={96} padding={17} gap={7} tone="green">
                        <TextLabel c={c} text="Beam search" fontSize={27} color={c.textPrimary} />
                        <TextLabel c={c} text="Keep, expand, and prune multiple prefixes." fontSize={22} />
                    </Card>
                </Column>
            </Row>
            <TextLabel c={c} text="A high-probability continuation can still be unsupported by the evidence." fontSize={23} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', fontSize: 23, color: c.textMuted }}>LeetLLM</div>
        </div>
    </Scene>
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, background: 'theme', scale: 1, crop: false, watermark: false })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner must be 1200 × 630')
    return result
}
export default create()
