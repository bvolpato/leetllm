import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
import { createHash } from 'node:crypto'

function digests(gate: 'blocked_requires_approval' | 'approved'): [string, string, string] {
    const events = [
        { event: 'tool_proposal', value: 'promote:v2.4-canary:prod-10pct' },
        { event: 'policy_gate', value: gate },
        { event: 'effect', value: 'none' },
    ]
    let previous = 'GENESIS'
    const hashes = events.map(({ event, value }) => {
        // Match Python's sorted-key encoding for these fixed ASCII examples only.
        const payload = `{"event": ${JSON.stringify(event)}, "previous": ${JSON.stringify(previous)}, "value": ${JSON.stringify(value)}}`
        previous = createHash('sha256').update(payload).digest('hex')
        return previous.slice(0, 12)
    })
    return hashes as [string, string, string]
}

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Responsible AI Governance. The original blocked promotion log for v2.4-canary has head prefix 656a7a026cf0. Rewriting the gate to approved changes the head prefix to a53d81e68bdd. The separately protected original anchor exposes the mismatch; verification compares full hashes.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = theme === 'dark' ? c.positiveLight : c.positive
    const red = theme === 'dark' ? c.criticalLight : c.critical
    const original = digests('blocked_requires_approval')[2]
    const changed = digests('approved')[2]
    const text = (value: string, x: number, y: number, size: number, color = c.textPrimary, boxWidth = 510) =>
        <div key={value} style={{position:'absolute',left:x,top:y,width:boxWidth,display:'flex',fontFamily:'Inter',fontSize:size,fontWeight:650,lineHeight:1.2,color}}>{value}</div>
    return Scene({c,background:c.bg,padding:54,contentWidth:1092,children:
        <div style={{position:'relative',display:'flex',width:1092,height:522}}>
            {text('Responsible AI Governance',0,0,48,c.textPrimary,1092)}
            {text('Can a reviewer detect a rewritten decision?',0,75,27,c.textSecondary,1092)}
            <svg width={1092} height={288} viewBox="0 0 1092 288" style={{position:'absolute',left:0,top:164}}>
                <rect width={638} height={110} rx={9} fill={c.bgCard} stroke={green} strokeWidth={2}/>
                <rect y={145} width={638} height={110} rx={9} fill={c.bgCard} stroke={red} strokeWidth={2}/>
                <rect x={736} width={354} height={255} rx={9} fill={c.bgCard} stroke={green} strokeWidth={2} strokeDasharray="7 5"/>
                <path d="M 643 54 H 731 M 722 47 L 731 54 L 722 61 M 643 199 H 731 M 722 192 L 731 199 L 722 206" fill="none" stroke={c.textSecondary} strokeWidth={2}/>
            </svg>
            {text('Original: gate blocked',22,183,25)}
            {text(original,22,223,27,green)}
            {text('Rewritten: gate approved',22,328,25)}
            {text(changed,22,368,27,red)}
            {text('Protected anchor',758,184,25,green,312)}
            {text(original,758,228,27,c.textPrimary,312)}
            {text("Rewrite doesn't match",758,358,22,red,312)}
            {text('Keep the anchor outside the log. Hash prefixes shown.',0,459,25,c.textSecondary,830)}
            {text('LeetLLM',936,491,26,theme === 'dark' ? c.primaryLight : c.primary,156)}
        </div>})
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {width,height,outputPath,scale:1,crop:false,watermark:false,background:'theme',theme})
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}

export default create()
