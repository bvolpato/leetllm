import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 760
export const alt =
    'Two aligned operation DAGs keep node IDs and edges while changing the affine parameter from 2x+1 to 2x+3. An update succeeds for future launches, while an in-flight launch keeps its original parameters. A candidate DAG with an added copy node changes IDs and topology, so update fails; inspect the error node and instantiate a compatible replacement.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const critical = getReadableToneColor('critical', c, c.bg)
    const fills = {
        blue: getToneFill('blue', c),
        green: getToneFill('green', c),
        purple: getToneFill('purple', c),
        warm: getToneFill('warm', c),
        critical: getToneFill('critical', c),
    }

    const leftNodes = [
        { x: 46, y: 176, w: 196, text: '0 · input', tone: blue, fill: fills.blue },
        { x: 256, y: 176, w: 196, text: '0 · input', tone: green, fill: fills.green },
        { x: 46, y: 244, w: 196, text: '1 · 2x + 1', tone: blue, fill: fills.blue },
        { x: 256, y: 244, w: 196, text: '1 · 2x + 3', tone: green, fill: fills.green },
        { x: 46, y: 312, w: 196, text: '2 · sum', tone: blue, fill: fills.blue },
        { x: 256, y: 312, w: 196, text: '2 · sum', tone: green, fill: fills.green },
    ]
    const leftOutcome = [
        { y: 406, text: 'Update parameters', tone: purple, fill: fills.purple },
        { y: 482, text: 'Result: success', tone: green, fill: fills.green },
        { y: 562, text: 'in-flight · 2x+1', tone: warm, fill: fills.warm },
        { y: 634, text: 'next launch · 2x+3', tone: green, fill: fills.green },
    ]
    const rightCaptured = [
        { y: 176, text: '0 · input' },
        { y: 254, text: '1 · 2x + 1' },
        { y: 332, text: '2 · sum' },
    ]
    const rightCandidate = [
        { y: 176, text: '0 · input', tone: purple, fill: fills.purple },
        { y: 240, text: '1 · copy', tone: critical, fill: fills.critical },
        { y: 304, text: '2 · 2x + 1', tone: purple, fill: fills.purple },
        { y: 368, text: '3 · sum', tone: purple, fill: fills.purple },
    ]
    const rightOutcome = [
        { y: 444, text: 'Update attempt → fails', tone: critical, fill: fills.critical },
        { y: 520, text: 'Inspect error node', tone: warm, fill: fills.warm },
        { y: 604, text: 'Instantiate new exec', tone: blue, fill: fills.blue },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={76}
                        width={440}
                        height={664}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={492}
                        y={76}
                        width={440}
                        height={664}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {leftNodes.map((n, i) => (
                        <SvgFrame
                            key={i}
                            c={c}
                            x={n.x}
                            y={n.y}
                            width={n.w}
                            height={46}
                            rx={8}
                            fill={n.fill}
                            stroke={n.tone}
                        />
                    ))}
                    {leftOutcome.map((o) => (
                        <SvgFrame
                            key={o.text}
                            c={c}
                            x={46}
                            y={o.y}
                            width={406}
                            height={52}
                            rx={10}
                            fill={o.fill}
                            stroke={o.tone}
                        />
                    ))}
                    <VectorArrow
                        x1={249}
                        y1={458}
                        x2={249}
                        y2={480}
                        color={green}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    {rightCaptured.map((n) => (
                        <SvgFrame
                            key={n.text}
                            c={c}
                            x={510}
                            y={n.y}
                            width={190}
                            height={46}
                            rx={8}
                            fill={fills.blue}
                            stroke={blue}
                        />
                    ))}
                    {rightCandidate.map((n) => (
                        <SvgFrame
                            key={n.text}
                            c={c}
                            x={724}
                            y={n.y}
                            width={190}
                            height={46}
                            rx={8}
                            fill={n.fill}
                            stroke={n.tone}
                        />
                    ))}
                    {rightOutcome.map((o) => (
                        <SvgFrame
                            key={o.text}
                            c={c}
                            x={510}
                            y={o.y}
                            width={404}
                            height={52}
                            rx={10}
                            fill={o.fill}
                            stroke={o.tone}
                        />
                    ))}
                    <VectorArrow
                        x1={712}
                        y1={496}
                        x2={712}
                        y2={518}
                        color={critical}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={712}
                        y1={572}
                        x2={712}
                        y2={602}
                        color={blue}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={14} width={width - 56} height={48}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 36,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Graph updates keep node matching visible
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={44} y={90} width={408} height={38}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: green,
                        }}
                    >
                        SAME IDs · UPDATE
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={508} y={90} width={408} height={38}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: critical,
                        }}
                    >
                        TOPOLOGY · REBUILD
                    </span>
                </div>
            </CanvasItem>
            {[
                { x: 46, w: 196, label: 'Active' },
                { x: 256, w: 196, label: 'Candidate' },
                { x: 510, w: 190, label: 'Captured' },
                { x: 724, w: 190, label: '+ Copy' },
            ].map((h) => (
                <CanvasItem key={h.label} x={h.x} y={136} width={h.w} height={34}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 700,
                                color: c.textSecondary,
                            }}
                        >
                            {h.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {leftNodes.map((n, i) => (
                <CanvasItem key={i} x={n.x} y={n.y} width={n.w} height={46}>
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
                                color: n.tone,
                            }}
                        >
                            {n.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {leftOutcome.map((o) => (
                <CanvasItem key={o.text} x={46} y={o.y} width={406} height={52}>
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
                                color: o.tone,
                            }}
                        >
                            {o.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {rightCaptured.map((n) => (
                <CanvasItem key={n.text} x={510} y={n.y} width={190} height={46}>
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
                                color: blue,
                            }}
                        >
                            {n.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {rightCandidate.map((n) => (
                <CanvasItem key={n.text} x={724} y={n.y} width={190} height={46}>
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
                                color: n.tone,
                            }}
                        >
                            {n.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {rightOutcome.map((o) => (
                <CanvasItem key={o.text} x={510} y={o.y} width={404} height={52}>
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
                                color: o.tone,
                            }}
                        >
                            {o.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
        </Board>
    )
}

export default create()
