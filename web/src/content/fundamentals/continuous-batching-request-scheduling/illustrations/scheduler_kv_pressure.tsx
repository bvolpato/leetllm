import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableColor,
    getReadableTextColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const alt =
    'Urgent priority 1 and background priority 0 each have a 16-token prompt and one KV block in a two-block budget. At 17 tokens each would need a second block, projecting four blocks. The scheduler preempts background and releases its block, reserves both blocks for urgent, then runs urgent. After urgent completes and releases KV, background resumes and completes. The trace uses one preemption and ends with zero of two blocks used.'

export const width = 900
export const height = 810

function text(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 500,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(40, fontSize + 8),
        children: TextLabel({
            c,
            text: value,
            fontSize,
            fontWeight: weight,
            color,
            align,
            width: w,
        }),
    })
}

function rect(
    c: ReturnType<typeof getThemeColors>,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke = c.borderSubtle,
    rx = 8,
) {
    return SvgFrame({ c, x, y, width: w, height: h, rx, fill, stroke, strokeWidth: 2 })
}

function blockText(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fill: string,
) {
    return text(c, value, x, y + 25, w, 35, getReadableTextColor(fill, c, c.bg), 'center', 700)
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const urgentFill = c.secondary
    const backgroundFill = c.positive
    const warning = getReadableColor('warning', c)
    const projectedCells = [
        { x: 64, fill: urgentFill, stroke: urgentFill, label: 'U current' },
        { x: 250, fill: c.bgCardAlt, stroke: urgentFill, label: 'U +1' },
        { x: 436, fill: backgroundFill, stroke: backgroundFill, label: 'B current' },
        { x: 622, fill: c.bgCardAlt, stroke: backgroundFill, label: 'B +1' },
    ]

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {rect(c, 170, 185, 250, 92, urgentFill, urgentFill)}
            {rect(c, 480, 185, 250, 92, backgroundFill, backgroundFill)}
            {projectedCells.map((item) => rect(c, item.x, 344, 170, 84, item.fill, item.stroke))}
            {rect(c, 116, 561, 254, 80, urgentFill, urgentFill)}
            {rect(c, 388, 561, 254, 80, urgentFill, urgentFill)}
            {rect(c, 694, 561, 150, 80, c.bgCardAlt, c.borderLight)}
        </svg>
    )

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        text(
            c,
            'Two-block pressure triggers preemption',
            20,
            12,
            860,
            35,
            c.textPrimary,
            'left',
            700,
        ),
        text(c, 'Each request owns one block at 16 tokens.', 20, 68, 860, 35, c.textSecondary),
        text(c, 'Current KV: 2 / 2 blocks', 20, 130, 860, 35, c.textPrimary, 'left', 700),
        blockText(c, 'Request U · p1', 170, 185, 250, urgentFill),
        blockText(c, 'Request B · p0', 480, 185, 250, backgroundFill),
        text(c, 'At token 17, both need block two.', 20, 288, 860, 35, c.textPrimary, 'left', 650),
        ...projectedCells.map((item, index) => {
            const fg =
                item.fill === c.bgCardAlt
                    ? getReadableColor(index === 1 ? 'secondary' : 'positive', c)
                    : getReadableTextColor(item.fill, c, c.bg)
            return text(c, item.label, item.x, 365, 170, 35, fg, 'center', 700)
        }),
        text(c, 'Projected need: 4 blocks · budget: 2', 20, 440, 860, 35, warning, 'center', 700),
        text(c, 'Pause B; release its block.', 20, 495, 860, 35, c.textPrimary, 'left', 700),
        blockText(c, 'U page 1', 116, 561, 254, urgentFill),
        blockText(c, 'U page 2', 388, 561, 254, urgentFill),
        text(c, 'Paused', 694, 583, 150, 35, c.textSecondary, 'center', 650),
        text(c, 'Urgent runs with both blocks.', 20, 653, 860, 35, c.textPrimary, 'left', 650),
        text(c, 'Then B resumes and finishes.', 20, 709, 860, 35, c.textSecondary),
        text(
            c,
            'Final KV: 0 / 2 · one preemption.',
            20,
            765,
            860,
            35,
            getReadableColor('positive', c),
            'left',
            700,
        ),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

export default create('dark')
