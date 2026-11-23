import React from 'react'
import { Card, Column, FlowArrow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const bank = [0.8, 0.2]
export const examples = [
    { sentence: 'Deposit money at the city bank.', clue: 'deposit', vector: [0.2, 1.0] },
    { sentence: 'Walk along the grassy river bank.', clue: 'river', vector: [1.0, 0.1] },
]
export const mix = (clue: number[]) => bank.map((value, index) => (value + clue[index]) / 2)
const coordinates = (vector: number[]) => `[${vector.map(value => value.toFixed(2)).join(', ')}]`

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return <Scene c={c} background={c.bg} padding={48} gap={0}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 1104, height: 534, gap: 18 }}>
            <TextLabel c={c} text="Static to Contextual Embeddings" variant="title" fontSize={45} color={c.textPrimary} />
            <TextLabel c={c} text="The same word starts with one row. Visible context changes its state." fontSize={24} />
            <Column gap={14}>
                {examples.map((example, index) => <Card key={example.clue} c={c} width={1104} height={152} padding={22} tone={index === 0 ? 'purple' : 'cyan'}>
                    <Row gap={22} align="center">
                        <Column width={300} gap={12}>
                            <TextLabel c={c} text={index === 0 ? 'Financial context' : 'Geographic context'} fontSize={21} />
                            <TextLabel c={c} text={example.sentence} fontSize={25} color={c.textPrimary} />
                        </Column>
                        <Column width={230} gap={14}>
                            <TextLabel c={c} text="Static embedding" fontSize={22} />
                            <TextLabel c={c} text={`bank ${coordinates(bank)}`} fontSize={23} color={c.textPrimary} />
                        </Column>
                        <FlowArrow c={c} direction="right" length={36} tone={index === 0 ? 'purple' : 'cyan'} />
                        <Column width={400} gap={14}>
                            <TextLabel c={c} text={`Average with ${example.clue} ${coordinates(example.vector)}`} fontSize={22} />
                            <TextLabel c={c} text={`New state ${coordinates(mix(example.vector))}`} fontSize={28} color={c.textPrimary} />
                        </Column>
                    </Row>
                </Card>)}
            </Column>
            <TextLabel c={c} text="Bidirectional pooling: static lookup averaged with local context." fontSize={23} />
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
