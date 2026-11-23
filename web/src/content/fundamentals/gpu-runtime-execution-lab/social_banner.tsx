import React from 'react'
import { Grid,Scene,getThemeColors,renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width=1200
export const height=630
export const autoSize=false
export function create(theme:ThemeMode='dark') {
    const c={...getThemeColors(theme),preset:'engineering' as const}
    return <Scene c={c} background={c.bg} padding={54} contentWidth={1092}>
        <div style={{display:'flex',flexDirection:'column',gap:32,width:1092,height:522,color:c.textPrimary}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:20,color:c.textSecondary}}><span>STREAMS · EVENTS · CUDA GRAPHS</span><span>LeetLLM</span></div>
            <div style={{display:'flex',fontSize:53,fontWeight:800}}>GPU Runtime Execution Lab</div>
            <div style={{display:'flex',fontSize:30}}>Submitted isn&apos;t completed.</div>
            <Grid c={c} cellWidth={350} cellHeight={72} gap={8} fontSize={23} headerRows={1} headerCols={0} rows={[
                ['Host returns', 'Device completes', 'Checked result'],
                ['Tick 4', 'Tick 10', '164'],
            ]}/>
            <div style={{display:'flex',fontSize:27,fontWeight:700}}>copy → affine → square → reduce</div>
            <div style={{display:'flex',fontSize:22,color:c.textSecondary}}>Logical simulation. CUDA timings require an actual GPU run.</div>
        </div>
    </Scene>
}
export async function renderBanner(outputPath:string) {
    const result=await renderToPngWithOutput(create('dark'),{width,height,outputPath,scale:1,crop:false,watermark:false,background:'theme',theme:'dark'})
    if(result.width!==width||result.height!==height)throw new Error('Expected 1200x630')
    return result
}
