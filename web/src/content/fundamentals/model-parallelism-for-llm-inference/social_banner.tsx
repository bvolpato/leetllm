import React from 'react'
import { Scene, Grid, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'
export const width=1200
export const height=630
export const autoSize=false
export const alt='Model Parallelism for LLM Inference. A computed three-stage, four-microbatch pipeline occupies 12 of 18 stage-slots. Depth is split across devices; concurrency fills idle slots.'
const schedule=(stages:number,microbatches:number)=>Array.from({length:stages},(_,s)=>Array.from({length:stages+microbatches-1},(_,t)=>{const idx=t-s;return idx>=0&&idx<microbatches?idx:null}))
export function create(theme:ThemeMode='dark') {
 const c=getThemeColors(theme,theme==='light'?'engineering':'default')
 const tones=['blue','purple','green','warm'] as const
 const rows=[['Stage',...Array.from({length:6},(_,i)=>`t${i}`)],...schedule(3,4).map((row,s)=>[`GPU ${s}`,...row.map(v=>v===null?{label:'·',tone:'neutral' as const}:{label:String.fromCharCode(65+v),tone:tones[v]})])]
 return Scene({c,background:c.bg,padding:48,gap:0,children:React.createElement('div',{style:{display:'flex',flexDirection:'column',width:1104,height:534}},
  React.createElement('div',{style:{display:'flex',fontSize:47,fontWeight:650,color:c.textPrimary}},'Model Parallelism for LLM Inference'),
  React.createElement('div',{style:{display:'flex',fontSize:26,color:c.textSecondary,marginTop:20}},'Pipeline stages split depth. Concurrency fills idle slots.'),
  React.createElement('div',{style:{display:'flex',marginTop:40}},Grid({c,rows,headerRows:1,headerCols:1,cellWidth:149,cellHeight:62,gap:8,fontSize:25})),
  React.createElement('div',{style:{display:'flex',marginTop:'auto',justifyContent:'space-between',fontSize:22,color:c.textSecondary}},
   React.createElement('span',null,'3-stage, 4-microbatch schedule: 12 / 18 stage-slots active (66.7% occupancy)'),
   React.createElement('span',{style:{fontWeight:650,color:c.textPrimary}},'LeetLLM'))
 )})
}
export async function renderBanner(path:string,theme:ThemeMode='dark') {
 const result=await renderToPngWithOutput(create(theme),{width,height,outputPath:path,scale:1,crop:false,watermark:false,background:'theme',theme})
 if(result.pixelWidth!==width||result.pixelHeight!==height) throw new Error('Wrong banner size')
 return result
}
export default create()
