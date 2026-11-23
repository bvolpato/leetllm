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
    'A captured stream runs copy, affine, square, and reduction between cudaStreamBeginCapture and cudaStreamEndCapture, producing a logical cudaGraph_t. Instantiation prepares a cudaGraphExec_t. The first cudaGraphLaunch may upload the graph; repeated launches run the prepared graph while retaining node dependencies. Ordinary CPU calls during capture run immediately and stay outside the replay graph.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const fills = {
        blue: getToneFill('blue', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
        warm: getToneFill('warm', c),
    }

    const boxes = [
        { x: 46, y: 126, w: 282, h: 48, text: 'BeginCapture()', tone: purple, fill: fills.purple },
        { x: 354, y: 126, w: 128, h: 48, text: 'copy', tone: blue, fill: fills.blue },
        { x: 506, y: 126, w: 132, h: 48, text: 'affine', tone: green, fill: fills.green },
        { x: 506, y: 204, w: 132, h: 48, text: 'square', tone: green, fill: fills.green },
        { x: 354, y: 204, w: 128, h: 48, text: 'reduce', tone: warm, fill: fills.warm },
        { x: 46, y: 204, w: 282, h: 48, text: 'EndCapture()', tone: purple, fill: fills.purple },
        { x: 46, y: 378, w: 236, h: 52, text: 'cudaGraph_t', tone: blue, fill: fills.blue },
        { x: 312, y: 378, w: 272, h: 52, text: 'Instantiate()', tone: purple, fill: fills.purple },
        { x: 614, y: 378, w: 300, h: 52, text: 'cudaGraphExec_t', tone: green, fill: fills.green },
        {
            x: 46,
            y: 540,
            w: 400,
            h: 50,
            text: 'cudaGraphLaunch(...)',
            tone: blue,
            fill: fills.blue,
        },
        { x: 492, y: 540, w: 422, h: 50, text: 'first upload', tone: warm, fill: fills.warm },
        { x: 46, y: 610, w: 400, h: 50, text: 'repeat launch', tone: blue, fill: fills.blue },
        { x: 492, y: 610, w: 422, h: 50, text: 'DAG order', tone: green, fill: fills.green },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={74}
                        width={width - 56}
                        height={224}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={662}
                        y={126}
                        width={252}
                        height={126}
                        rx={10}
                        fill={c.bgCard}
                        stroke={c.borderLight}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={316}
                        width={width - 56}
                        height={142}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={476}
                        width={width - 56}
                        height={264}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {boxes.map((b) => (
                        <SvgFrame
                            key={b.text}
                            c={c}
                            x={b.x}
                            y={b.y}
                            width={b.w}
                            height={b.h}
                            rx={10}
                            fill={b.fill}
                            stroke={b.tone}
                        />
                    ))}
                    <VectorArrow
                        x1={328}
                        y1={150}
                        x2={352}
                        y2={150}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={482}
                        y1={150}
                        x2={504}
                        y2={150}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={572}
                        y1={174}
                        x2={572}
                        y2={202}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={506}
                        y1={228}
                        x2={484}
                        y2={228}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={354}
                        y1={228}
                        x2={330}
                        y2={228}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={282}
                        y1={404}
                        x2={310}
                        y2={404}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={584}
                        y1={404}
                        x2={612}
                        y2={404}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={446}
                        y1={565}
                        x2={490}
                        y2={565}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={446}
                        y1={635}
                        x2={490}
                        y2={635}
                        color={c.textMuted}
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
                        Capture, prepare, and replay a CUDA Graph
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={84} width={width - 96} height={36}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    CAPTURE STREAM WORK
                </span>
            </CanvasItem>
            <CanvasItem x={48} y={328} width={width - 96} height={36}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    PREPARE LOGICAL DAG → EXECUTABLE
                </span>
            </CanvasItem>
            <CanvasItem x={48} y={490} width={width - 96} height={36}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    LAUNCH AND REPLAY
                </span>
            </CanvasItem>

            <CanvasItem x={662} y={126} width={252} height={126}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        CPU calls run
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        outside replay
                    </span>
                </div>
            </CanvasItem>

            {boxes.map((b) => (
                <CanvasItem key={b.text} x={b.x} y={b.y} width={b.w} height={b.h}>
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

            <CanvasItem x={48} y={680} width={width - 96} height={44}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        First launch uploads; replays follow recorded DAG.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
