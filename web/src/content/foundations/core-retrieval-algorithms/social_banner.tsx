import React from 'react'
import { Card, Column, FlowArrow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return <Scene c={c} background={c.bg} padding={48} gap={0}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 1104, height: 534, gap: 26 }}>
            <TextLabel c={c} text="Core Retrieval Algorithms" variant="title" fontSize={49} color={c.textPrimary} />
            <TextLabel c={c} text="Query: How do I rotate an API key?" fontSize={26} color={c.textSecondary} />
            <Row gap={16} align="center">
                <Column gap={18}>
                    <Card c={c} width={318} height={121} tone="blue" padding={20} gap={12}>
                        <TextLabel c={c} text="BM25" fontSize={29} color={c.textPrimary} />
                        <TextLabel c={c} text="Lexical candidates" fontSize={22} />
                    </Card>
                    <Card c={c} width={318} height={121} tone="cyan" padding={20} gap={12}>
                        <TextLabel c={c} text="Dense retrieval" fontSize={27} color={c.textPrimary} />
                        <TextLabel c={c} text="ANN search, e.g. HNSW" fontSize={21} />
                    </Card>
                </Column>
                <Column gap={110}>
                    <FlowArrow c={c} direction="right" length={44} tone="blue" />
                    <FlowArrow c={c} direction="right" length={44} tone="cyan" />
                </Column>
                <Card c={c} width={298} height={260} tone="purple" padding={24} gap={20}>
                    <TextLabel c={c} text="Rank fusion" fontSize={29} color={c.textPrimary} />
                    <TextLabel c={c} text="RRF combines ranks" fontSize={23} />
                    <TextLabel c={c} text="Keep a candidate shortlist" fontSize={23} />
                </Card>
                <FlowArrow c={c} direction="right" length={44} tone="purple" />
                <Card c={c} width={298} height={260} tone="green" padding={24} gap={20}>
                    <TextLabel c={c} text="Rerank" fontSize={29} color={c.textPrimary} />
                    <TextLabel c={c} text="Score query + passage" fontSize={23} />
                    <TextLabel c={c} text="Ordered evidence → prompt" fontSize={23} />
                </Card>
            </Row>
            <TextLabel c={c} text="A reranker can't recover a passage missing from the shortlist." fontSize={24} color={c.textSecondary} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', color: c.textMuted, fontSize: 23 }}>LeetLLM</div>
        </div>
    </Scene>
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, background: 'theme', scale: 1, crop: false, watermark: false })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner must be 1200 × 630')
    return result
}
export default create()
