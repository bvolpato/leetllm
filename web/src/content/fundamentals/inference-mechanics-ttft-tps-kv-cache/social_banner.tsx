import React from 'react'
import { Grid, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width = 1200
export const height = 630
export const autoSize = false
export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), preset: 'engineering' as const }
    return <Scene c={c} background={c.bg} padding={54} contentWidth={1092}>
        <div style={{ display:'flex',flexDirection:'column',gap:28,width:1092,height:522,color:c.textPrimary }}>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:21,color:c.textSecondary }}><span>INFERENCE MECHANICS</span><span>LeetLLM</span></div>
            <div style={{ display:'flex',fontSize:51,fontWeight:800 }}>The first token has a different clock.</div>
            <div style={{ display:'flex',fontSize:25,color:c.textSecondary }}>One request. Four output tokens. Three decode gaps.</div>
            <Grid c={c} cellWidth={350} cellHeight={72} gap={8} fontSize={26} headerRows={1} headerCols={0} rows={[
                ['TTFT', 'Decode TPOT', 'Decode rate'],
                ['320 ms', '36 ms / gap', '27.8 tokens/s'],
            ]} />
            <div style={{ display:'flex',fontSize:29,fontWeight:700 }}>KV cache: retain the prefix, budget every active token.</div>
            <div style={{ display:'flex',fontSize:22,color:c.textSecondary }}>Example timings for one request; measure the target GPU, engine, and workload.</div>
        </div>
    </Scene>
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width,height,outputPath,scale:1,crop:false,watermark:false,background:'theme',theme })
    if (result.width !== width || result.height !== height) throw new Error('Expected 1200x630')
    return result
}
