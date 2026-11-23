import React from 'react'
import { Scene, VectorArrow, getThemeColors, getReadableToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'GLM-5.3 Training Masterclass. One tool-call token moves from a versioned rollout through group-relative reward to a masked learner update, and a weight refresh closes the loop.'

export function create(theme: ThemeMode = 'dark') {
  const c = getThemeColors(theme)
  const colors = ['cyan', 'purple', 'green'].map((tone) => getReadableToneColor(tone as 'cyan' | 'purple' | 'green', c))
  const label = (text: string, left: number, top: number, size: number, color = c.textPrimary) =>
    <div key={text} style={{ position: 'absolute', left, top, display: 'flex', color,
      fontFamily: c.fontSans, fontSize: size, fontWeight: 650, letterSpacing: .3 }}>{text}</div>
  return Scene({ c, background: c.bg, padding: 48, gap: 0, contentWidth: 1104,
    children: <div style={{ position: 'relative', display: 'flex', width: 1104, height: 534 }}>
      {label('GLM-5.3 Training Masterclass', 0, 0, 48)}
      {label('Follow one policy token from a tool call to an update.', 0, 75, 25, c.textSecondary)}
      {[
        ['ROLLOUT', 'Tool-call token t*', 'IDs · mask · policy version'],
        ['GROUP COMPARISON', 'Reward → advantage', 'Eight attempts at one task'],
        ['LEARNER', 'Masked policy loss', 'Replay · backward · update'],
      ].map(([eyebrow, title, detail], i) => <div key={eyebrow} style={{
        position: 'absolute', display: 'flex', flexDirection: 'column', gap: 24,
        left: i * 378, top: 184, width: 348, height: 176, padding: 23,
        boxSizing: 'border-box', border: `2px solid ${colors[i]}`, borderRadius: 10,
        background: c.bgCard, color: c.textPrimary, fontFamily: c.fontSans,
      }}>
        <span style={{ color: colors[i], fontSize: 15, letterSpacing: 1.2 }}>{eyebrow}</span>
        <span style={{ fontSize: 26, fontWeight: 750 }}>{title}</span>
        <span style={{ fontSize: 18, color: c.textSecondary }}>{detail}</span>
      </div>)}
      <svg width={1104} height={270} viewBox="0 0 1104 270" style={{ position: 'absolute', top: 180, left: 0 }}>
        {VectorArrow({ x1: 350, y1: 90, x2: 375, y2: 90, color: colors[0], strokeWidth: 2, arrowSize: 3.5 })}
        {VectorArrow({ x1: 728, y1: 90, x2: 753, y2: 90, color: colors[1], strokeWidth: 2, arrowSize: 3.5 })}
        <path d="M 930 182 L 930 250 L 174 250 L 174 222" fill="none" stroke={colors[2]} strokeWidth={2} />
        {VectorArrow({ x1: 174, y1: 222, x2: 174, y2: 182, color: colors[2], strokeWidth: 2, arrowSize: 4 })}
      </svg>
      {label('Versioned weight refresh', 390, 391, 23, colors[2])}
      {label('SkyRL · vLLM · Megatron RL loop', 0, 507, 18, c.textSecondary)}
      {label('LeetLLM', 974, 503, 26, colors[1])}
    </div>,
  })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
  const result = await renderToPngWithOutput(create(theme), {
    width, height, outputPath, scale: 1, crop: false, watermark: false,
    background: 'theme', theme,
  })
  if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Incorrect banner dimensions')
  return result
}

export default create('dark')
