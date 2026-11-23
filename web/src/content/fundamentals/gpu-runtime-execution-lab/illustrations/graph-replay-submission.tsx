import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    SvgFrame,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 780
export const alt =
    'A cumulative-cost chart compares eager execution at 18 microseconds per iteration with graph replay at 12 milliseconds setup plus 12 microseconds per replay. The curves meet at 2,000 iterations and 36 milliseconds. A magnified view at iteration 2,001 compares the additional cost above that shared 36-millisecond base: 18 microseconds for eager and 12 microseconds for replay, a 6-microsecond modeled saving.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const eager = getReadableToneColor('purple', c, c.bg)
    const graph = getReadableToneColor('green', c, c.bg)
    const eagerFill = getToneFill('purple', c)
    const graphFill = getToneFill('green', c)

    const plotX = 116
    const plotY = 104
    const plotW = 804
    const plotH = 340
    const pad = 38
    const xMin = -250
    const xMax = 4350
    const yMin = 0
    const yMax = 76
    const innerW = plotW - 2 * pad
    const innerH = plotH - 2 * pad
    const px = (v: number) => plotX + pad + ((v - xMin) / (xMax - xMin)) * innerW
    const py = (v: number) => plotY + pad + innerH - ((v - yMin) / (yMax - yMin)) * innerH

    const xTicks = [0, 1000, 2000, 3000, 4000]
    const yTicks = [0, 24, 36, 48, 72]

    const paths = [
        ...xTicks.map((v) => ({
            points: [
                { x: v, y: 0 },
                { x: v, y: 72 },
            ],
            color: c.borderLight,
            strokeWidth: 1.5,
            opacity: 0.45,
        })),
        ...yTicks.map((v) => ({
            points: [
                { x: 0, y: v },
                { x: 4000, y: v },
            ],
            color: c.borderLight,
            strokeWidth: v === 36 ? 2 : 1.5,
            opacity: v === 36 ? 0.75 : 0.45,
        })),
        {
            points: [
                { x: 2000, y: 0 },
                { x: 2000, y: 36 },
            ],
            color: c.textSecondary,
            strokeWidth: 2,
            dashed: true,
        },
        { points: xTicks.map((n) => ({ x: n, y: (n * 18) / 1000 })), color: eager, strokeWidth: 6 },
        {
            points: xTicks.map((n) => ({ x: n, y: 12 + (n * 12) / 1000 })),
            color: graph,
            strokeWidth: 6,
        },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={550}
                        width={width - 56}
                        height={212}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={240}
                        y={644}
                        width={540}
                        height={36}
                        rx={6}
                        fill={eagerFill}
                        stroke={eager}
                    />
                    <SvgFrame
                        c={c}
                        x={240}
                        y={698}
                        width={360}
                        height={36}
                        rx={6}
                        fill={graphFill}
                        stroke={graph}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={14} width={width - 56} height={82}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 36,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        The curves meet at 2,000 replays (36 ms)
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        Eager 18 µs/step vs Replay 12 ms + 12 µs/step
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={plotX} y={plotY} width={plotW} height={plotH}>
                <AxisPlot
                    c={c}
                    width={plotW}
                    height={plotH}
                    padding={pad}
                    xMin={xMin}
                    xMax={xMax}
                    yMin={yMin}
                    yMax={yMax}
                    showFrame={false}
                    showAxes={true}
                    showGrid={false}
                    paths={paths}
                    points={[
                        { x: 0, y: 12, fill: c.bg, stroke: graph, strokeWidth: 4, r: 8 },
                        {
                            x: 2000,
                            y: 36,
                            fill: c.bg,
                            stroke: c.textPrimary,
                            strokeWidth: 5,
                            r: 10,
                        },
                        { x: 4000, y: 72, fill: eager, r: 7 },
                        { x: 4000, y: 60, fill: graph, r: 7 },
                    ]}
                />
            </CanvasItem>

            {yTicks.map((v) => (
                <CanvasItem key={v} x={28} y={py(v) - 18} width={116} height={36}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 650,
                                color: c.textSecondary,
                            }}
                        >
                            {v}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            {xTicks.map((v) => (
                <CanvasItem key={v} x={px(v) - 48} y={plotY + plotH - 30} width={96} height={36}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 650,
                                color: c.textSecondary,
                            }}
                        >
                            {v === 0 ? '0' : `${v / 1000}k`}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={48} y={488} width={width - 96} height={46}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 800,
                    }}
                >
                    <span style={{ color: eager }}>● Eager: 18 µs·N</span>
                    <span style={{ color: graph }}>● Replay: 12 ms + 12 µs·N</span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={564} width={width - 96} height={68}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        At N = 2,001 above 36 ms
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 800,
                            color: graph,
                        }}
                    >
                        Replay saves 6 µs/step
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={52} y={644} width={174} height={36}>
                <span
                    style={{ fontFamily: c.fontSans, fontSize: 30, fontWeight: 750, color: eager }}
                >
                    Eager
                </span>
            </CanvasItem>
            <CanvasItem x={796} y={644} width={120} height={36}>
                <span
                    style={{ fontFamily: c.fontMono, fontSize: 30, fontWeight: 800, color: eager }}
                >
                    +18 µs
                </span>
            </CanvasItem>

            <CanvasItem x={52} y={698} width={174} height={36}>
                <span
                    style={{ fontFamily: c.fontSans, fontSize: 30, fontWeight: 750, color: graph }}
                >
                    Replay
                </span>
            </CanvasItem>
            <CanvasItem x={616} y={698} width={120} height={36}>
                <span
                    style={{ fontFamily: c.fontMono, fontSize: 30, fontWeight: 800, color: graph }}
                >
                    +12 µs
                </span>
            </CanvasItem>
        </Board>
    )
}

export default create()
