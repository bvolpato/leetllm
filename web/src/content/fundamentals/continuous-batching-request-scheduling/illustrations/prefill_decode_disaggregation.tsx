import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableColor,
    getReadableTextColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const alt =
    'On one assumed 0 to 145 millisecond timeline, prefill queueing takes 20 ms, prefill 60 ms, state handoff 40 ms, decode queueing 15 ms, and the next decode step 10 ms. Early delivery sends token one at 80 ms and token two at 145 ms: TTFT 80 ms passes a 90 ms target, while the 65 ms first gap misses a 30 ms target. Buffered delivery sends token one at 135 ms and token two at 145 ms: TTFT misses, while the 10 ms gap passes. Both policies miss the combined target. Attention KV alone is 0.25 GiB for 4,096 positions; recurrent state and transfer overhead are additional.'

export const width = 900
export const height = 780

const axisStart = 180
const axisWidth = 680
const timeX = (ms: number) => axisStart + (axisWidth * ms) / 145

function label(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 500,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(38, fontSize + 8),
        children: TextLabel({ c, text: value, fontSize, fontWeight, color, align, width: w }),
    })
}

function tokenTrack(c: ReturnType<typeof getThemeColors>, y: number, t1: number, t2: number) {
    const x1 = timeX(t1)
    const x2 = timeX(t2)
    return [
        VectorSegment({
            x1: axisStart,
            y1: y,
            x2: axisStart + axisWidth,
            y2: y,
            color: c.borderLight,
            strokeWidth: 3,
            showEndDot: false,
        }),
        VectorSegment({
            x1,
            y1: y - 18,
            x2: x1,
            y2: y + 18,
            color: c.primaryLight,
            strokeWidth: 4,
            showStartDot: false,
            showEndDot: false,
        }),
        VectorSegment({
            x1: x2,
            y1: y - 18,
            x2: x2,
            y2: y + 18,
            color: c.positiveLight,
            strokeWidth: 4,
            showStartDot: false,
            showEndDot: false,
        }),
        SvgPoint({ cx: x1, cy: y, r: 10, fill: c.primaryLight, stroke: c.bg, strokeWidth: 3 }),
        SvgPoint({ cx: x2, cy: y, r: 10, fill: c.positiveLight, stroke: c.bg, strokeWidth: 3 }),
    ]
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const stageFills = [c.bgCardAlt, c.primary, c.info, c.warning, c.positive]
    const stageStops = [0, 20, 80, 120, 135, 145]
    const stageValues = ['20', '60', '40', '15', '10']
    const legend = [
        { x: 20, y: 228, fill: stageFills[0], text: 'Prompt queue' },
        { x: 310, y: 228, fill: stageFills[1], text: 'Prefill' },
        { x: 520, y: 228, fill: stageFills[2], text: 'KV handoff' },
        { x: 20, y: 274, fill: stageFills[3], text: 'Decode queue' },
        { x: 310, y: 274, fill: stageFills[4], text: 'Next decode' },
    ]
    const positiveText = getReadableColor('positive', c)
    const criticalText = getReadableColor('critical', c)
    const primaryText = getReadableColor('primary', c)

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {stageStops.map((ms) =>
                VectorSegment({
                    x1: timeX(ms),
                    y1: 140,
                    x2: timeX(ms),
                    y2: 212,
                    color: ms === 0 || ms === 145 ? c.borderLight : c.borderSubtle,
                    strokeWidth: ms === 0 || ms === 145 ? 2 : 1,
                    showEndDot: false,
                }),
            )}
            {stageStops.slice(0, -1).map((from, i) =>
                SvgFrame({
                    c,
                    x: timeX(from),
                    y: 150,
                    width: timeX(stageStops[i + 1]) - timeX(from),
                    height: 62,
                    rx: 0,
                    fill: stageFills[i],
                    stroke: c.bg,
                    strokeWidth: 2,
                }),
            )}
            {legend.map((item) =>
                SvgFrame({
                    c,
                    x: item.x,
                    y: item.y + 8,
                    width: 20,
                    height: 20,
                    rx: 4,
                    fill: item.fill,
                    stroke: item.fill,
                    strokeWidth: 1,
                }),
            )}
            {tokenTrack(c, 358, 80, 145)}
            {tokenTrack(c, 464, 135, 145)}
        </svg>
    )

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Token timing depends on delivery policy',
            20,
            12,
            860,
            34,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, 'Assumed 0 to 145 ms split-pool path.', 20, 56, 860, 31, c.textSecondary),
        label(c, 'Shared stage path (ms)', 20, 102, 860, 31, c.textPrimary, 'left', 650),
        ...stageStops.slice(0, -1).map((from, i) => {
            const x1 = timeX(from)
            const x2 = timeX(stageStops[i + 1])
            return label(
                c,
                stageValues[i],
                x1,
                164,
                x2 - x1,
                31,
                getReadableTextColor(stageFills[i], c, c.bg),
                'center',
                700,
            )
        }),
        ...legend.map((item) =>
            label(c, item.text, item.x + 30, item.y, 260, 31, c.textPrimary, 'left', 600),
        ),
        label(c, 'Early', 20, 336, 140, 31, c.textPrimary, 'left', 700),
        label(c, 'Token 1 · 80 ms', 180, 382, 300, 31, primaryText, 'left', 650),
        label(c, 'Token 2 · 145 ms', 510, 382, 350, 31, positiveText, 'left', 650),
        label(c, 'Buffered', 20, 442, 140, 31, c.textPrimary, 'left', 700),
        label(c, 'Token 1 · 135 ms', 180, 488, 300, 31, primaryText, 'left', 650),
        label(c, 'Token 2 · 145 ms', 510, 488, 350, 31, positiveText, 'left', 650),
        label(
            c,
            'Targets: TTFT <= 90 ms  |  first gap <= 30 ms',
            20,
            548,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, 'Early delivery', 20, 598, 400, 31, c.textPrimary, 'left', 700),
        label(c, 'TTFT 80 ms · pass', 20, 640, 400, 31, positiveText, 'left', 600),
        label(c, 'Gap 65 ms · miss', 20, 682, 400, 31, criticalText, 'left', 600),
        label(c, 'Buffered delivery', 460, 598, 420, 31, c.textPrimary, 'left', 700),
        label(c, 'TTFT 135 ms · miss', 460, 640, 420, 31, criticalText, 'left', 600),
        label(c, 'Gap 10 ms · pass', 460, 682, 420, 31, positiveText, 'left', 600),
        label(
            c,
            'Each misses one target · KV: 0.25 GiB / 4,096 tokens',
            20,
            732,
            860,
            31,
            c.textSecondary,
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
