import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneColor,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 640
export const height = 620
export const alt =
    'A serial pipeline sums branch durations for diff analysis (2s), test suite (3s), and security scan (1s) into 6 seconds total. Running all three in parallel finishes in 3 seconds on the critical path while total work remains 6 seconds.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    const cDiff = getToneColor('blue', c)
    const cTest = getToneColor('purple', c)
    const cScan = getToneColor('cyan', c)
    const barW = 540
    const unit = barW / 6

    const track = (segments: { w: number; color: string; offset?: number }[]) => (
        <div
            style={{
                display: 'flex',
                width: barW,
                height: 22,
                borderRadius: 6,
                overflow: 'hidden',
                backgroundColor: c.border,
            }}
        >
            {segments.map((s, idx) => (
                <div
                    key={idx}
                    style={{
                        width: s.w,
                        height: 22,
                        backgroundColor: s.color,
                        marginLeft: s.offset ?? 0,
                    }}
                />
            ))}
        </div>
    )

    return Scene({
        c,
        title: 'Serial Pipeline vs. Parallel Fan-Out Latency',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Panel({
                c,
                title: 'Serial Agent Chain · 6.0s Wall Time (2s + 3s + 1s)',
                tone: 'warm',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        Row({
                            gap: 8,
                            justify: 'center',
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Diff 2s',
                                    fontSize: 19,
                                    color: getReadableToneColor('blue', c),
                                }),
                                FlowArrow({ c, direction: 'right', length: 18, tone: 'blue' }),
                                TextLabel({
                                    c,
                                    text: 'Tests 3s',
                                    fontSize: 19,
                                    color: getReadableToneColor('purple', c),
                                }),
                                FlowArrow({
                                    c,
                                    direction: 'right',
                                    length: 18,
                                    tone: 'purple',
                                }),
                                TextLabel({
                                    c,
                                    text: 'Scan 1s',
                                    fontSize: 19,
                                    color: getReadableToneColor('cyan', c),
                                }),
                            ],
                        }),
                        track([
                            { w: 2 * unit, color: cDiff },
                            { w: 3 * unit, color: cTest },
                            { w: 1 * unit, color: cScan },
                        ]),
                    ],
                }),
            }),
            Panel({
                c,
                title: 'Parallel DAG Fan-Out · 3.0s Critical Path',
                tone: 'green',
                width: 608,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        TextLabel({ c, text: 'Diff analyzer (2.0s)', fontSize: 19 }),
                        track([{ w: 2 * unit, color: cDiff }]),
                        TextLabel({
                            c,
                            text: 'Test runner (3.0s critical path)',
                            fontSize: 19,
                        }),
                        track([{ w: 3 * unit, color: cTest }]),
                        TextLabel({ c, text: 'Security scan (1.0s)', fontSize: 19 }),
                        track([{ w: 1 * unit, color: cScan }]),
                    ],
                }),
            }),
            Row({
                gap: 10,
                justify: 'center',
                align: 'center',
                children: [
                    BadgePill({
                        c,
                        text: 'Tradeoff',
                        tone: 'neutral',
                        fontSize: 19,
                    }),
                    TextLabel({
                        c,
                        text: 'Wall time halves to 3s; total worker compute stays 6s',
                        fontSize: 19,
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
