import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive: Ray. An actor records three items, its process dies, and a restarted actor has count zero. Restarting a process is not restoring its state; durable recovery needs an application checkpoint.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const accent = theme === 'light' ? c.primary : c.primaryLight
    const text = (s: string, x: number, y: number, size: number, color = c.textPrimary) => React.createElement('div', {key:s,style:{display:'flex',position:'absolute',left:x,top:y,fontFamily:'Inter',fontSize:size,fontWeight:600,color}},s)
    const box = (x: number, title: string, count: string) => React.createElement('div',{key:title,style:{display:'flex',position:'absolute',left:x,top:221,width:398,height:193,border:`2px solid ${accent}`,borderRadius:9}},text(title,27,24,26,c.textSecondary),text(count,27,82,46))
    return Scene({c,padding:54,contentWidth:1092,background:c.bg,children:React.createElement('div',{style:{display:'flex',position:'relative',width:1092,height:522}},
        text('Deep Dive: Ray',0,0,58),
        text('A process restart is not state recovery.',0,94,32,c.textSecondary),
        box(0,'ACTOR BEFORE FAILURE','completed = 3'),
        text('→',435,282,50,accent),
        text('restart',425,346,23,c.textSecondary),
        box(567,'NEW ACTOR PROCESS','completed = 0'),
        text('Checkpoint and restore state explicitly.',0,470,27,c.textSecondary),
        text('LeetLLM',955,526,23,accent),
    )})
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const output = await renderToPngWithOutput(create(theme), {width,height,outputPath,scale:1,crop:false,watermark:false,background:'theme',theme})
    if (output.pixelWidth !== width || output.pixelHeight !== height) throw new Error('Banner must be 1200x630')
    return output
}
export default create()
