import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width=1200
export const height=630
export const autoSize=false
export const alt='Deep Dive - Tinker. Updating the training adapter, publishing a sampler snapshot, and sampling from that snapshot are separate operations. All model weights stay hosted.'
export function create(theme:ThemeMode='dark') {
    const c=getThemeColors(theme,theme==='dark'?'default':'engineering')
    return <Scene c={c} background={c.bg} padding={54} gap={22} contentWidth={1092}>
        <div style={{display:'flex',fontSize:56,fontWeight:750,letterSpacing:.5,color:c.textPrimary}}>Deep Dive - Tinker</div>
        <div style={{display:'flex',fontSize:27,color:c.textSecondary}}>An optimizer step is not a sampler refresh.</div>
        <GraphDiagram c={c} width={1092} height={260} layout="manual" nodeWidth={250} nodeHeight={96}
            labelFontSize={23} detailFontSize={18} padding={30} arrowSize={6}
            nodes={[
                {id:'train',label:'Training adapter',detail:'step 42',x:.13,y:.5,tone:'purple'},
                {id:'snapshot',label:'Published snapshot',detail:'explicit save',x:.5,y:.5,tone:'green'},
                {id:'sample',label:'Sampler',detail:'uses selected snapshot',x:.87,y:.5,tone:'blue'},
            ]} edges={[
                {from:'train',to:'snapshot',label:'publish',tone:'green'},
                {from:'snapshot',to:'sample',label:'select',tone:'blue'},
            ]}/>
        <div style={{display:'flex',fontSize:25,color:c.textSecondary}}>Local loop. Hosted weights. Explicit version boundaries.</div>
        <div style={{display:'flex',width:'100%',justifyContent:'flex-end',fontSize:25,color:c.textSecondary}}>LeetLLM</div>
    </Scene>
}
export async function renderBanner(outputPath:string,theme:ThemeMode='dark') {
    const result=await renderToPngWithOutput(create(theme),{width,height,outputPath,scale:1,crop:false,watermark:false,background:'theme',theme})
    if(result.pixelWidth!==width||result.pixelHeight!==height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
