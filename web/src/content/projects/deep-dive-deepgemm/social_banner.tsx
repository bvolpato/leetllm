import React from 'react'
import { Card, FlowArrow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return <Scene c={c} background={c.bg} padding={48} gap={0}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 1104, height: 534, gap: 28 }}>
            <TextLabel c={c} text="Deep Dive - DeepGEMM" variant="title" fontSize={52} />
            <TextLabel c={c} text="Follow one matrix tile through the GPU" fontSize={26} color={c.textSecondary} />
            <Row gap={18} align="center">
                <Card c={c} title="Global memory" width={310} height={188} padding={24} gap={18} tone="blue">
                    <TextLabel c={c} text="Operands + scales" fontSize={23} />
                    <TextLabel c={c} text="FP8 × FP4" fontSize={30} />
                </Card>
                <FlowArrow c={c} direction="right" length={48} label="TMA" tone="cyan" />
                <Card c={c} title="Shared memory" width={310} height={188} padding={24} gap={18} tone="cyan">
                    <TextLabel c={c} text="Stage each tile" fontSize={23} />
                    <TextLabel c={c} text="Reuse loaded data" fontSize={23} />
                </Card>
                <FlowArrow c={c} direction="right" length={48} tone="purple" />
                <Card c={c} title="SM100 compute" width={310} height={188} padding={24} gap={18} tone="purple">
                    <TextLabel c={c} text="Tensor cores + TMEM" fontSize={23} />
                    <TextLabel c={c} text="Accumulate → store" fontSize={23} />
                </Card>
            </Row>
            <TextLabel c={c} text="Layout • block scales • grouped experts • communication overlap" fontSize={23} color={c.textSecondary} />
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
