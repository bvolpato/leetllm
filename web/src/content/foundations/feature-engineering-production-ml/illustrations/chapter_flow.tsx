import React from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    SvgFrame,
    TextLabel,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 860
export const height = 540
export const alt =
    'Two-clock scatter plot for job J-204 at 09:00 UTC. In the 08:00 to 10:00 close-up, the 08:30 event available at 08:31 lies inside both cutoffs; the 08:50 event available at 09:15 crosses the availability boundary. Outside the close-up, 01:00 available at 01:01 is earlier eligible history and noon available at 12:01 is future on both clocks. Select 08:30 to produce heartbeat age 0.5 hours. The May 3 finish provides a separate later label.'

function leftClockBoard(c: ThemeColors) {
    const w = 410
    const h = 420
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)
    const warm = getReadableToneColor('warm', c)

    // Range: 480 (08:00) to 600 (10:00)
    const px = (minutes: number) => 60 + ((minutes - 480) / 120) * 310
    const py = (minutes: number) => 360 - ((minutes - 480) / 120) * 310

    const selected = { event: 510, available: 511 } // 08:30, 08:31
    const late = { event: 530, available: 555 } // 08:50, 09:15
    const cutoff = 540 // 09:00

    const label = (
        x: number,
        y: number,
        width: number,
        text: string,
        fontSize = 14,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'center',
    ) => (
        <CanvasItem x={x} y={y} width={width} height={24}>
            <TextLabel
                c={c}
                text={text}
                width={width}
                fontSize={fontSize}
                color={color}
                mono
                align={align}
            />
        </CanvasItem>
    )

    return (
        <Board c={c} width={w} height={h}>
            <CanvasItem x={0} y={0} width={w} height={h}>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    {/* Shaded eligible quadrant (event <= 09:00 AND available <= 09:00) */}
                    <SvgFrame
                        c={c}
                        x={60}
                        y={py(cutoff)}
                        width={px(cutoff) - 60}
                        height={360 - py(cutoff)}
                        fill={c.bgSubtle}
                        stroke={green}
                        strokeWidth={1.5}
                        rx={0}
                    />
                    {/* Grid lines */}
                    {[480, 540, 600].map((t) => (
                        <React.Fragment key={t}>
                            <line
                                x1={px(t)}
                                y1={50}
                                x2={px(t)}
                                y2={360}
                                stroke={t === 540 ? warm : c.borderLight}
                                strokeWidth={t === 540 ? 2 : 1}
                                strokeDasharray={t === 540 ? '4 4' : undefined}
                            />
                            <line
                                x1={60}
                                y1={py(t)}
                                x2={370}
                                y2={py(t)}
                                stroke={t === 540 ? warm : c.borderLight}
                                strokeWidth={t === 540 ? 2 : 1}
                                strokeDasharray={t === 540 ? '4 4' : undefined}
                            />
                        </React.Fragment>
                    ))}
                    {/* Event 1: 08:30 event, available 08:31 (Eligible) */}
                    <circle
                        cx={px(selected.event)}
                        cy={py(selected.available)}
                        r={7}
                        fill={green}
                    />
                    {/* Event 2: 08:50 event, available 09:15 (Leaked) */}
                    <circle cx={px(late.event)} cy={py(late.available)} r={7} fill={red} />
                </svg>
            </CanvasItem>
            {/* Axis labels */}
            {label(10, py(480) - 10, 45, '08:00', 13, c.textSecondary, 'right')}
            {label(10, py(540) - 10, 45, '09:00', 13, warm, 'right')}
            {label(10, py(600) - 10, 45, '10:00', 13, c.textSecondary, 'right')}
            {label(px(480) - 25, 366, 50, '08:00', 13, c.textSecondary)}
            {label(px(540) - 25, 366, 50, '09:00', 13, warm)}
            {label(px(600) - 25, 366, 50, '10:00', 13, c.textSecondary)}
            {label(100, 16, 260, 'Y: Availability Time (UTC)', 14, c.textSecondary)}
            {label(100, 392, 260, 'X: Event Occurrence Time (UTC)', 14, c.textSecondary)}
            {/* Markers */}
            {label(
                px(selected.event) - 10,
                py(selected.available) - 22,
                110,
                '08:30 (Valid)',
                13,
                green,
                'left',
            )}
            {label(
                px(late.event) - 10,
                py(late.available) - 22,
                120,
                '08:50 (Leaked!)',
                13,
                red,
                'left',
            )}
        </Board>
    )
}

function eventCard(
    c: ThemeColors,
    time: string,
    avail: string,
    status: string,
    note: string,
    tone: 'green' | 'critical' | 'neutral',
) {
    return Panel({
        c,
        width: 360,
        padding: 8,
        gap: 4,
        tone,
        title: `${time} · Avail ${avail}`,
        titleFontSize: 16,
        children: Column({
            gap: 4,
            align: 'stretch',
            children: [
                BadgePill({ c, text: status, tone, fontSize: 13, height: 23 }),
                TextLabel({
                    c,
                    text: note,
                    width: 340,
                    fontSize: 13,
                    color: c.textSecondary,
                }),
            ],
        }),
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 824,
        title: 'Point-in-Time Correctness Enforces Dual-Clock Constraints',
        subtitle:
            'Features at prediction cutoff 09:00 UTC must satisfy both event and availability boundaries.',
        children: Row({
            width: 824,
            gap: 16,
            align: 'center',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    width: 430,
                    padding: 8,
                    gap: 4,
                    tone: 'neutral',
                    title: 'Close-Up: 08:00 to 10:00 Window',
                    titleFontSize: 17,
                    children: leftClockBoard(c),
                }),
                Column({
                    width: 368,
                    gap: 8,
                    align: 'stretch',
                    children: [
                        eventCard(
                            c,
                            '08:30 Heartbeat',
                            '08:31 UTC',
                            'ELIGIBLE · 0.5h Heartbeat Age',
                            'Occurred and became available before the 09:00 prediction timestamp.',
                            'green',
                        ),
                        eventCard(
                            c,
                            '08:50 Heartbeat',
                            '09:15 UTC',
                            'FUTURE LEAKAGE · Disallowed',
                            'Occurred at 08:50 but ingestion delay meant it landed at 09:15, after scoring.',
                            'critical',
                        ),
                        Panel({
                            c,
                            width: 360,
                            padding: 8,
                            gap: 4,
                            tone: 'neutral',
                            title: 'Rule Summary',
                            titleFontSize: 15,
                            children: TextLabel({
                                c,
                                text: 'Every feature query must filter on availability_time <= prediction_time, not event_time alone.',
                                width: 340,
                                fontSize: 13,
                                color: c.textPrimary,
                            }),
                        }),
                    ],
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
