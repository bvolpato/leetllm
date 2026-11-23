import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    getToneFill,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 640
export const height = 665
export const alt =
    'Two-chunk dependency-preserving pipeline finishes in six abstract slots, versus eight serial slots. Dispatch B overlaps compute A; combine A overlaps compute B.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    size = 24,
    color = c.textPrimary,
    weight = 500,
    align: 'left' | 'center' | 'right' = 'center',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * 1.6,
        children: (
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={size}
                fontWeight={weight}
                color={color}
                align={align}
            />
        ),
    })
}

type Stage = 'D' | 'F' | 'C'
type Event = { chunk: string; stage: Stage; start: number; end: number }
const duration = { D: 1, F: 2, C: 1 }
export function makeSchedule(overlap: boolean): Event[] {
    let commFree = 0
    let computeFree = 0
    let allFree = 0
    const events: Event[] = []
    // Dispatch both chunks first when pipelining, with one communication resource.
    if (overlap) {
        for (const chunk of ['A', 'B']) {
            events.push({ chunk, stage: 'D', start: commFree, end: commFree + duration.D })
            commFree += duration.D
        }
        for (const chunk of ['A', 'B']) {
            const dispatched = events.find((e) => e.chunk === chunk && e.stage === 'D')!
            const start = Math.max(dispatched.end, computeFree)
            events.push({ chunk, stage: 'F', start, end: start + duration.F })
            computeFree = start + duration.F
            const combineStart = Math.max(computeFree, commFree)
            events.push({ chunk, stage: 'C', start: combineStart, end: combineStart + duration.C })
            commFree = combineStart + duration.C
        }
    } else {
        for (const chunk of ['A', 'B']) {
            for (const stage of ['D', 'F', 'C'] as const) {
                events.push({ chunk, stage, start: allFree, end: allFree + duration[stage] })
                allFree += duration[stage]
            }
        }
    }
    return events
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)
    const pipeline = makeSchedule(true)
    const serial = makeSchedule(false)
    const lanes = [
        { name: 'EP link', events: pipeline.filter((e) => e.stage !== 'F') },
        { name: 'Compute', events: pipeline.filter((e) => e.stage === 'F') },
        { name: 'Serial', events: serial },
    ]
    const x = (slot: number) => 130 + slot * 60
    const eventTone = { D: 'cyan', F: 'purple', C: 'green' } as const
    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
                            <line
                                key={t}
                                x1={x(t)}
                                x2={x(t)}
                                y1="185"
                                y2="475"
                                stroke={c.border}
                                strokeWidth="1"
                            />
                        ))}
                        {lanes.map((lane, i) =>
                            lane.events.map((e) => (
                                <rect
                                    key={i + e.chunk + e.stage}
                                    x={x(e.start) + 2}
                                    y={220 + i * 90}
                                    width={(e.end - e.start) * 60 - 4}
                                    height="55"
                                    rx="5"
                                    fill={fill(eventTone[e.stage])}
                                    stroke={tone(eventTone[e.stage])}
                                    strokeWidth="2"
                                />
                            )),
                        )}
                    </svg>
                ),
            }),
            label(
                c,
                'Two chunks finish in 6 slots with overlap',
                20,
                20,
                600,
                28,
                c.textPrimary,
                700,
            ),
            label(
                c,
                'Dispatch 1 · compute 2 · combine 1 · abstract slots',
                25,
                78,
                590,
                23,
                c.textSecondary,
            ),
            ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((t) =>
                label(c, String(t), x(t) - 20, 160, 40, 24, c.textSecondary),
            ),
            ...lanes.flatMap((lane, i) => [
                label(c, lane.name, 15, 232 + i * 90, 105, 24, c.textPrimary, 650, 'left'),
                ...lane.events.map((e) =>
                    label(
                        c,
                        `${e.stage} ${e.chunk}`,
                        x(e.start) + 3,
                        233 + i * 90,
                        (e.end - e.start) * 60 - 6,
                        24,
                        tone(eventTone[e.stage]),
                        650,
                    ),
                ),
            ]),
            label(c, 'D: dispatch · F: compute · C: combine', 25, 510, 590, 25, c.textSecondary),
            label(c, 'Pipeline 6 slots · serial 8 slots', 25, 565, 590, 28, tone('green'), 650),
            label(
                c,
                'Each chunk waits for its own dependencies',
                25,
                610,
                590,
                23,
                c.textSecondary,
            ),
        ],
    })
}

export default create()
