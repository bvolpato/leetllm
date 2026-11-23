import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
const x = [1, 2, 3, 4, 5]
const y = [118, 141, 162, 181, 198]
const meanX = x.reduce((a, b) => a + b, 0) / x.length
const meanY = y.reduce((a, b) => a + b, 0) / y.length
const slope = x.reduce((a, v, i) => a + (v - meanX) * (y[i] - meanY), 0) / x.reduce((a, v) => a + (v - meanX) ** 2, 0)
const intercept = meanY - slope * meanX
const residuals = x.map((v, i) => y[i] - (intercept + slope * v))
const mse = residuals.reduce((a, v) => a + v * v, 0) / x.length
if (intercept !== 100 || slope !== 20 || mse !== 2.8) throw new Error('Unexpected regression values')
export const alt = 'Linear Regression from Scratch. Five latency observations have x values 1 through 5 in hundreds of tokens and latency values 118, 141, 162, 181, and 198 milliseconds. Their least-squares line is y-hat equals 100 plus 20x. Residuals are minus 2, 1, 2, 1, minus 2 milliseconds, giving training MSE 2.8 squared milliseconds on these rows.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const accent = theme === 'light' ? c.primary : c.primaryLight
    const text = (s: string, left: number, top: number, size: number, color = c.textPrimary) => React.createElement('div', {key:`${s}-${top}-${left}`,style:{display:'flex',position:'absolute',left,top,fontFamily:'Inter',fontSize:size,fontWeight:600,color}},s)
    const rule = (top: number) => React.createElement('div',{key:top,style:{display:'flex',position:'absolute',left:0,top,width:571,height:1,background:c.border}})
    return Scene({c,padding:50,contentWidth:1100,background:c.bg,children:React.createElement('div',{style:{display:'flex',position:'relative',width:1100,height:530}},
        text('Linear Regression from Scratch',0,0,48),
        text('Five observations. Fit the line, then inspect its misses.',0,78,28,c.textSecondary),
        text('x (100 tokens)',0,161,24,accent),
        text('y (ms)',219,161,24,accent),
        text('Residual (ms)',359,161,24,accent),
        rule(202),
        ...x.flatMap((v,i)=>[text(String(v),73,219+i*47,26),text(String(y[i]),232,219+i*47,26),text(residuals[i]>0?`+${residuals[i]}`:String(residuals[i]),429,219+i*47,26)]),
        text('LEAST-SQUARES FIT',636,161,23,accent),
        text(`ŷ = ${intercept} + ${slope}x`,636,219,39),
        text('Residual = y − ŷ',636,291,27,c.textSecondary),
        text(`Training MSE = ${mse} ms²`,636,351,28),
        text('Test on new rows separately.',636,403,24,c.textSecondary),
        text('A small training error can still hide a residual pattern.',0,486,26,c.textSecondary),
        text('LeetLLM',967,535,23,accent),
    )})
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const output = await renderToPngWithOutput(create(theme), {width,height,outputPath,scale:1,crop:false,watermark:false,background:'theme',theme})
    if (output.pixelWidth !== width || output.pixelHeight !== height) throw new Error('Banner must be 1200x630')
    return output
}
export default create()
