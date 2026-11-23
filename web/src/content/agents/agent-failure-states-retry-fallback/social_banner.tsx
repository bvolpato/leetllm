import React from 'react'
import { CalloutCard, FlowArrow, Row, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Agent Failure and Recovery. The controller commits job-1, its reply is lost, and recovery finds the same job using the original operation key. After a timeout, check the stored effect before retrying.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const text = (value: string, top: number, size: number, color = c.textPrimary) => React.createElement('div', {key: value, style: {position: 'absolute', display: 'flex', top, left: 0, width: 1092, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2, color}}, value)
    return Scene({c, padding: 54, contentWidth: 1092, gap: 0, background: c.bg,
        children: React.createElement('div', {style: {position: 'relative', display: 'flex', width: 1092, height: 522}},
            text('Agent Failure & Recovery', 0, 49),
            text("A timeout doesn't tell you what committed.", 80, 29, c.textSecondary),
            React.createElement('div', {style: {position: 'absolute', display: 'flex', top: 206, left: 0, width: 1092}},
                Row({gap: 16, align: 'center', children: [
                    CalloutCard({c, title: 'Controller commits', detail: 'job-1 is queued', tone: 'purple', filled: false, width: 314, minHeight: 125, titleFontSize: 24, detailFontSize: 19}),
                    FlowArrow({c, direction: 'right', length: 26}),
                    CalloutCard({c, title: 'Reply is lost', detail: 'client outcome: unknown', tone: 'warm', filled: false, width: 314, minHeight: 125, titleFontSize: 24, detailFontSize: 19}),
                    FlowArrow({c, direction: 'right', length: 26}),
                    CalloutCard({c, title: 'Recover job-1', detail: 'same operation key', tone: 'green', filled: false, width: 314, minHeight: 125, titleFontSize: 24, detailFontSize: 19}),
                ]}),
            ),
            text('One logical operation. Two sends. One queued job.', 375, 27),
            text('Check the effect before retrying.', 418, 23, c.textSecondary),
            React.createElement('div', {style: {position: 'absolute', display: 'flex', top: 498, right: 0, color: theme === 'light' ? c.primaryDark : c.primaryLight, fontSize: 24, fontWeight: 750}}, 'LeetLLM'),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const output = await renderToPngWithOutput(create(theme), {width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme})
    if (output.pixelWidth !== width || output.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return output
}
export default create()
