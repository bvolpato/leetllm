import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 740
export const alt =
    'Two aligned lanes show producer and consumer states across a shared overlap window. Slot B starts free; while the consumer uses ready slot A for tile t, TMA copies tile t+1 into B. A copy-complete barrier marks B ready. The consumer applies the softmax update after the dependent matrix result arrives, then releases A so the producer can refill it. Overlap depends on independent work, synchronization, and available resources.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const fills = {
        blue: getToneFill('blue', c),
        cyan: getToneFill('cyan', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
        warm: getToneFill('warm', c),
    }

    const xs = [214, 456, 698]
    const w = 212
    const prod = [
        { text: 'B free', tone: blue, fill: fills.blue },
        { text: 'TMA → B', tone: cyan, fill: fills.cyan },
        { text: 'B ready', tone: purple, fill: fills.purple },
    ]
    const cons = [
        { text: 'A ready', tone: purple, fill: fills.purple },
        { text: 'WGMMA(A)', tone: green, fill: fills.green },
        { text: 'Softmax', tone: warm, fill: fills.warm },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={904}
                        height={416}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={442}
                        y={84}
                        width={240}
                        height={374}
                        rx={12}
                        fill={c.bgCard}
                        stroke={warm}
                    />
                    {prod.map((b, i) => (
                        <React.Fragment key={b.text}>
                            <SvgFrame
                                c={c}
                                x={xs[i]}
                                y={156}
                                width={w}
                                height={74}
                                rx={10}
                                fill={b.fill}
                                stroke={b.tone}
                            />
                            {i < 2 && (
                                <VectorArrow
                                    x1={xs[i] + w}
                                    y1={193}
                                    x2={xs[i + 1] - 2}
                                    y2={193}
                                    color={cyan}
                                    strokeWidth={3}
                                    arrowSize={5}
                                />
                            )}
                        </React.Fragment>
                    ))}
                    {cons.map((b, i) => (
                        <React.Fragment key={b.text}>
                            <SvgFrame
                                c={c}
                                x={xs[i]}
                                y={310}
                                width={w}
                                height={74}
                                rx={10}
                                fill={b.fill}
                                stroke={b.tone}
                            />
                            {i < 2 && (
                                <VectorArrow
                                    x1={xs[i] + w}
                                    y1={347}
                                    x2={xs[i + 1] - 2}
                                    y2={347}
                                    color={green}
                                    strokeWidth={3}
                                    arrowSize={5}
                                />
                            )}
                        </React.Fragment>
                    ))}
                    <VectorSegment
                        x1={442}
                        y1={418}
                        x2={682}
                        y2={418}
                        color={warm}
                        strokeWidth={2}
                        showEndDot={false}
                    />

                    <SvgFrame
                        c={c}
                        x={28}
                        y={500}
                        width={904}
                        height={222}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={86}
                        y={534}
                        width={332}
                        height={74}
                        rx={10}
                        fill={fills.green}
                        stroke={green}
                    />
                    <SvgFrame
                        c={c}
                        x={542}
                        y={534}
                        width={332}
                        height={74}
                        rx={10}
                        fill={fills.cyan}
                        stroke={cyan}
                    />
                    <VectorArrow
                        x1={420}
                        y1={571}
                        x2={538}
                        y2={571}
                        color={green}
                        strokeWidth={4}
                        arrowSize={6}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={12} width={width - 56} height={46}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 35,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Two-slot warp-specialized async tile pipeline
                    </span>
                </div>
            </CanvasItem>

            {[
                { label: 'START', x: xs[0], tone: c.textSecondary },
                { label: 'OVERLAP', x: xs[1], tone: warm },
                { label: 'BARRIER', x: xs[2], tone: c.textSecondary },
            ].map((h) => (
                <CanvasItem key={h.label} x={h.x} y={96} width={w} height={40}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 800,
                                color: h.tone,
                            }}
                        >
                            {h.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={42} y={156} width={164} height={74}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: cyan,
                        }}
                    >
                        PRODUCER
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        fills B
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={42} y={310} width={164} height={74}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: green,
                        }}
                    >
                        CONSUMER
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        uses A
                    </span>
                </div>
            </CanvasItem>

            {prod.map((b, i) => (
                <CanvasItem key={b.text} x={xs[i]} y={156} width={w} height={74}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 800,
                                color: b.tone,
                            }}
                        >
                            {b.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {cons.map((b, i) => (
                <CanvasItem key={b.text} x={xs[i]} y={310} width={w} height={74}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 800,
                                color: b.tone,
                            }}
                        >
                            {b.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            <CanvasItem x={442} y={422} width={240} height={36}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: warm }}>
                        parallel window
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={86} y={534} width={332} height={74}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: green,
                        }}
                    >
                        Release slot A
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={542} y={534} width={332} height={74}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: cyan,
                        }}
                    >
                        Refill A (t+2)
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={626} width={864} height={76}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Copy barrier gates reads; WGMMA output gates softmax.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
