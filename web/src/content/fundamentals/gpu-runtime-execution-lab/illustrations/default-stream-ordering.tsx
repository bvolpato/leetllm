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
export const height = 780
export const alt =
    'Three same-context timelines compare CUDA stream rules. Blocking stream A work finishes before a legacy default-stream operation, and later blocking stream B work waits for it. A non-blocking stream has no implicit edge to legacy work, so overlap is permitted when resources allow. Per-thread default work synchronizes with legacy work when both are used.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const fills = {
        blue: getToneFill('blue', c),
        warm: getToneFill('warm', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
    }

    const x0 = 200
    const scale = 68
    const tx = (t: number) => x0 + t * scale
    const bars = [
        { k: 'bA', t0: 0, t1: 2, y: 146, h: 34, label: 'work', tone: blue, fill: fills.blue },
        { k: 'l1', t0: 2, t1: 4, y: 186, h: 36, label: 'op', tone: warm, fill: fills.warm },
        { k: 'bB', t0: 4, t1: 6, y: 228, h: 34, label: 'work', tone: blue, fill: fills.blue },
        { k: 'nb', t0: 1, t1: 6, y: 360, h: 34, label: 'work', tone: purple, fill: fills.purple },
        { k: 'l2', t0: 2, t1: 4, y: 404, h: 36, label: 'op', tone: warm, fill: fills.warm },
        { k: 'p1', t0: 0, t1: 2, y: 534, h: 34, label: 'work', tone: green, fill: fills.green },
        { k: 'l3', t0: 2, t1: 4, y: 574, h: 36, label: 'op', tone: warm, fill: fills.warm },
        { k: 'p2', t0: 4, t1: 6, y: 616, h: 34, label: 'work', tone: green, fill: fills.green },
    ]
    const panels = [
        { y: 74, h: 196, head: 'BLOCKING STREAMS · A finishes before legacy; later B waits.' },
        { y: 284, h: 168, head: 'NON-BLOCKING · Overlap permitted when resources allow.' },
        { y: 466, h: 248, head: 'PER-THREAD DEFAULT · Syncs with legacy stream here.' },
    ]
    const lanes = [
        { label: 'A', y: 146 },
        { label: '0', y: 186 },
        { label: 'B', y: 228 },
        { label: 'NB', y: 360 },
        { label: '0', y: 404 },
        { label: 'PTDS', y: 534 },
        { label: '0', y: 574 },
        { label: 'PTDS', y: 616 },
    ]
    const ticks = [0, 2, 4, 6, 8, 10]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {panels.map((p) => (
                        <SvgFrame
                            key={p.head}
                            c={c}
                            x={28}
                            y={p.y}
                            width={width - 56}
                            height={p.h}
                            rx={14}
                            fill={c.bgSubtle}
                            stroke={c.borderSubtle}
                        />
                    ))}
                    {bars.map((b) => (
                        <SvgFrame
                            key={b.k}
                            c={c}
                            x={tx(b.t0)}
                            y={b.y}
                            width={(b.t1 - b.t0) * scale}
                            height={b.h}
                            rx={8}
                            fill={b.fill}
                            stroke={b.tone}
                        />
                    ))}
                    <VectorArrow
                        x1={tx(2)}
                        y1={164}
                        x2={tx(2)}
                        y2={185}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={tx(4)}
                        y1={204}
                        x2={tx(4)}
                        y2={227}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={tx(2)}
                        y1={552}
                        x2={tx(2)}
                        y2={573}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={tx(4)}
                        y1={592}
                        x2={tx(4)}
                        y2={615}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorSegment
                        x1={tx(0)}
                        y1={666}
                        x2={tx(10)}
                        y2={666}
                        color={c.borderLight}
                        strokeWidth={2}
                        showEndDot={false}
                    />
                    {ticks.map((t) => (
                        <React.Fragment key={t}>
                            <VectorSegment
                                x1={tx(t)}
                                y1={660}
                                x2={tx(t)}
                                y2={672}
                                color={c.borderLight}
                                strokeWidth={2}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}
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
                        Default-stream ordering edges
                    </span>
                </div>
            </CanvasItem>

            {panels.map((p) => (
                <CanvasItem key={p.head} x={48} y={p.y + 12} width={width - 96} height={42}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        {p.head}
                    </span>
                </CanvasItem>
            ))}

            {lanes.map((ln, idx) => (
                <CanvasItem key={`${ln.label}-${idx}`} x={44} y={ln.y} width={132} height={36}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 700,
                                color: c.textSecondary,
                            }}
                        >
                            {ln.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            {bars.map((b) => (
                <CanvasItem
                    key={b.k}
                    x={tx(b.t0)}
                    y={b.y}
                    width={(b.t1 - b.t0) * scale}
                    height={b.h}
                >
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
                            {b.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={tx(4) + 28} y={404} width={320} height={36}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 650,
                        color: c.textSecondary,
                    }}
                >
                    no implicit edge
                </span>
            </CanvasItem>

            {ticks.map((t) => (
                <CanvasItem key={t} x={tx(t) - 34} y={676} width={68} height={34}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 650,
                                color: c.textSecondary,
                            }}
                        >
                            {t}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={28} y={726} width={width - 56} height={40}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        Same context · conceptual timing only
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
