import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    defineIllustration,
    withColorAlpha,
    type ThemeColors,
} from 'vizmatic'

export const width = 840
export const height = 540
export const alt =
    'Five requests sit on a calibrated-confidence axis from 0 to 1 with a threshold at 0.80, sorted into three lanes. The grounded public FAQ lookup at 0.96 answers on device. The grounded public long-tail query at 0.43 falls back to the cloud. A restricted private note at 0.72, an ungrounded answer at 0.97, and an offline query at 0.30 all abstain locally.'

const PLOT_LEFT = 280
const PLOT_RIGHT = 806
const xOf = (p: number) => PLOT_LEFT + (PLOT_RIGHT - PLOT_LEFT) * p
const THRESHOLD_X = xOf(0.8)
const LANE_TOPS = [104, 206, 308]
const LANE_HEIGHT = 92
const AXIS_Y = 412

const L = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    opts: {
        size?: number
        weight?: number
        color?: string
        align?: 'left' | 'center' | 'right'
    } = {},
) => (
    <CanvasItem key={`${x}-${y}-${text}`} x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={opts.size ?? 25}
            fontWeight={opts.weight ?? 500}
            color={opts.color ?? c.textPrimary}
            align={opts.align ?? 'left'}
            math={false}
        />
    </CanvasItem>
)

function RouterLanes({ c }: { c: ThemeColors }) {
    const lanes = [
        { title: 'On device', sub: 'grounded, ≥ 0.80', color: c.positiveLight, base: c.positive },
        { title: 'Cloud', sub: 'public + online', color: c.infoLight, base: c.info },
        { title: 'Abstain', sub: 'every other case', color: c.warningLight, base: c.warning },
    ]
    const points = [
        { lane: 0, p: 0.959, label: 'FAQ 0.96', place: 'above-right' },
        { lane: 1, p: 0.426, label: 'long-tail 0.43', place: 'above' },
        { lane: 2, p: 0.304, label: 'offline 0.30', place: 'above' },
        { lane: 2, p: 0.715, label: 'private 0.72', place: 'below' },
        { lane: 2, p: 0.972, label: 'ungrounded 0.97', place: 'above-right' },
    ] as const
    const center = (lane: number) => LANE_TOPS[lane] + LANE_HEIGHT / 2
    const labelBox = (point: (typeof points)[number]) => {
        const x = xOf(point.p)
        const y = center(point.lane)
        if (point.place === 'above-right') return { x: x - 205, y: y - 44, w: 212 }
        return { x: x - 100, y: point.place === 'above' ? y - 44 : y + 12, w: 200 }
    }
    // The dashed threshold stops short of any label it would otherwise cross.
    const gaps = points
        .map(labelBox)
        .filter((box) => box.x < THRESHOLD_X && THRESHOLD_X < box.x + box.w)
        .map((box) => [box.y - 2, box.y + 32] as const)
        .sort((a, b) => a[0] - b[0])
    const thresholdSegments: [number, number][] = []
    let cursor = 98
    for (const [top, bottom] of gaps) {
        if (top > cursor) thresholdSegments.push([cursor, top])
        cursor = Math.max(cursor, bottom)
    }
    thresholdSegments.push([cursor, AXIS_Y])

    return (
        <Board c={c} width={width} height={height}>
            {L(c, 24, 16, 792, 38, 'Three checks pick where a request runs', {
                size: 28,
                weight: 700,
            })}
            {L(c, 24, 56, 792, 32, 'Dashed line: 0.80 threshold on calibrated P(correct)', {
                color: c.textMuted,
            })}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {lanes.map((lane, i) => (
                        <rect
                            key={`lane-${i}`}
                            x={PLOT_LEFT}
                            y={LANE_TOPS[i]}
                            width={PLOT_RIGHT - PLOT_LEFT}
                            height={LANE_HEIGHT}
                            rx={8}
                            fill={withColorAlpha(lane.base, 0.06)}
                            stroke={withColorAlpha(lane.base, 0.4)}
                            strokeWidth={1.4}
                        />
                    ))}
                    <rect
                        x={THRESHOLD_X}
                        y={LANE_TOPS[0]}
                        width={PLOT_RIGHT - THRESHOLD_X}
                        height={LANE_HEIGHT}
                        fill={withColorAlpha(c.positive, 0.18)}
                    />
                    <rect
                        x={PLOT_LEFT}
                        y={LANE_TOPS[1]}
                        width={THRESHOLD_X - PLOT_LEFT}
                        height={LANE_HEIGHT}
                        fill={withColorAlpha(c.info, 0.14)}
                    />
                    {thresholdSegments.map(([y1, y2]) => (
                        <line
                            key={`threshold-${y1}`}
                            x1={THRESHOLD_X}
                            y1={y1}
                            x2={THRESHOLD_X}
                            y2={y2}
                            stroke={c.textPrimary}
                            strokeWidth={2}
                            strokeDasharray="7 6"
                        />
                    ))}
                    <line
                        x1={PLOT_LEFT}
                        y1={AXIS_Y}
                        x2={PLOT_RIGHT}
                        y2={AXIS_Y}
                        stroke={c.borderLight}
                        strokeWidth={2}
                    />
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((tick) => (
                        <line
                            key={`tick-${tick}`}
                            x1={xOf(tick)}
                            y1={AXIS_Y}
                            x2={xOf(tick)}
                            y2={AXIS_Y + 7}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                    ))}
                    {points.map((point) => (
                        <circle
                            key={`dot-${point.label}`}
                            cx={xOf(point.p)}
                            cy={center(point.lane)}
                            r={9}
                            fill={lanes[point.lane].color}
                            stroke={c.bg}
                            strokeWidth={2}
                        />
                    ))}
                </svg>
            </CanvasItem>

            {lanes.map((lane, i) => (
                <React.Fragment key={`lane-label-${i}`}>
                    {L(c, 24, LANE_TOPS[i] + 10, 250, 34, lane.title, {
                        size: 26,
                        weight: 700,
                        color: lane.color,
                    })}
                    {L(c, 24, LANE_TOPS[i] + 48, 250, 32, lane.sub, { color: c.textMuted })}
                </React.Fragment>
            ))}

            {points.map((point) => {
                const box = labelBox(point)
                return L(c, box.x, box.y, box.w, 30, point.label, {
                    align: point.place === 'above-right' ? 'right' : 'center',
                    weight: 600,
                })
            })}

            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((tick) =>
                L(c, xOf(tick) - 30, AXIS_Y + 8, 60, 32, tick.toFixed(1), {
                    align: 'center',
                    color: c.textMuted,
                }),
            )}
            {L(c, PLOT_LEFT, AXIS_Y + 42, PLOT_RIGHT - PLOT_LEFT, 32, 'calibrated P(correct)', {
                align: 'center',
                color: c.textMuted,
            })}
            {L(c, 24, 492, 792, 32, 'A confident answer without evidence still abstains.', {
                color: c.textMuted,
            })}
        </Board>
    )
}

const illustration = defineIllustration((c) => <RouterLanes c={c} />)
export const create = illustration.create
export default illustration.default
