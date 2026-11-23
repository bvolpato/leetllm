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
    'A producer publishes a descriptor to a bounded queue with system-scope release semantics. The queue fans out to resident workers 0, 1, and N−1; each acquires a distinct slot and computes its task. Completion is published, the last reader finishes, and then the slot is recycled. A resource cycle appears when all resident workers wait for a child kernel that needs one of their slots. Bounded shutdown stops new work, drains or cancels queued tasks, finishes readers, and releases slots.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const critical = getReadableToneColor('critical', c, c.bg)
    const fills = {
        blue: getToneFill('blue', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
        warm: getToneFill('warm', c),
        critical: getToneFill('critical', c),
    }

    const xs = [46, 354, 662]
    const w = 252
    const producers = [
        { text: 'write desc', x: xs[0], tone: blue, fill: fills.blue },
        { text: 'release pub', x: xs[1], tone: purple, fill: fills.purple },
        { text: 'bounded Q', x: xs[2], tone: warm, fill: fills.warm },
    ]
    const workers = [
        { title: 'Worker 0', line: 'claim 0', x: xs[0] },
        { title: 'Worker 1', line: 'claim 1', x: xs[1] },
        { title: 'Worker N−1', line: 'claim N−1', x: xs[2] },
    ]
    const lifecycle = [
        { text: 'publish done', x: xs[0], tone: purple, fill: fills.purple },
        { text: 'readers done', x: xs[1], tone: green, fill: fills.green },
        { text: 'recycle slot', x: xs[2], tone: warm, fill: fills.warm },
    ]
    const cycleNodes = [
        { text: 'slots full', x: 42, y: 536, tone: critical, fill: fills.critical },
        { text: 'wait child', x: 254, y: 536, tone: warm, fill: fills.warm },
        { text: 'needs slot', x: 254, y: 638, tone: purple, fill: fills.purple },
        { text: 'no slot', x: 42, y: 638, tone: critical, fill: fills.critical },
    ]
    const shutdown = [
        { text: '1. stop input', y: 534, tone: blue, fill: fills.blue },
        { text: '2. drain / cancel', y: 590, tone: purple, fill: fills.purple },
        { text: '3. finish readers', y: 646, tone: green, fill: fills.green },
        { text: '4. exit & release', y: 702, tone: warm, fill: fills.warm },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={72}
                        width={width - 56}
                        height={386}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {producers.map((p, i) => (
                        <React.Fragment key={p.text}>
                            <SvgFrame
                                c={c}
                                x={p.x}
                                y={116}
                                width={w}
                                height={50}
                                rx={10}
                                fill={p.fill}
                                stroke={p.tone}
                            />
                            {i < producers.length - 1 && (
                                <VectorArrow
                                    x1={p.x + w}
                                    y1={141}
                                    x2={producers[i + 1].x - 2}
                                    y2={141}
                                    color={c.textMuted}
                                    strokeWidth={3}
                                    arrowSize={5}
                                />
                            )}
                        </React.Fragment>
                    ))}
                    <VectorSegment
                        x1={xs[2] + w / 2}
                        y1={166}
                        x2={xs[2] + w / 2}
                        y2={188}
                        color={c.textMuted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    <VectorSegment
                        x1={xs[0] + w / 2}
                        y1={188}
                        x2={xs[2] + w / 2}
                        y2={188}
                        color={c.textMuted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    {workers.map((wk) => (
                        <React.Fragment key={wk.title}>
                            <VectorArrow
                                x1={wk.x + w / 2}
                                y1={188}
                                x2={wk.x + w / 2}
                                y2={208}
                                color={c.textMuted}
                                strokeWidth={3}
                                arrowSize={5}
                            />
                            <SvgFrame
                                c={c}
                                x={wk.x}
                                y={212}
                                width={w}
                                height={118}
                                rx={12}
                                fill={fills.blue}
                                stroke={blue}
                            />
                        </React.Fragment>
                    ))}
                    {lifecycle.map((lc, i) => (
                        <React.Fragment key={lc.text}>
                            <SvgFrame
                                c={c}
                                x={lc.x}
                                y={352}
                                width={w}
                                height={50}
                                rx={10}
                                fill={lc.fill}
                                stroke={lc.tone}
                            />
                            {i < lifecycle.length - 1 && (
                                <VectorArrow
                                    x1={lc.x + w}
                                    y1={377}
                                    x2={lifecycle[i + 1].x - 2}
                                    y2={377}
                                    color={c.textMuted}
                                    strokeWidth={3}
                                    arrowSize={5}
                                />
                            )}
                        </React.Fragment>
                    ))}
                    <SvgFrame
                        c={c}
                        x={28}
                        y={472}
                        width={440}
                        height={294}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={492}
                        y={472}
                        width={440}
                        height={294}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {cycleNodes.map((n) => (
                        <SvgFrame
                            key={n.text}
                            c={c}
                            x={n.x}
                            y={n.y}
                            width={198}
                            height={52}
                            rx={10}
                            fill={n.fill}
                            stroke={n.tone}
                        />
                    ))}
                    <VectorArrow
                        x1={240}
                        y1={562}
                        x2={252}
                        y2={562}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={353}
                        y1={588}
                        x2={353}
                        y2={636}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={254}
                        y1={664}
                        x2={242}
                        y2={664}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={141}
                        y1={638}
                        x2={141}
                        y2={590}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    {shutdown.map((s) => (
                        <SvgFrame
                            key={s.text}
                            c={c}
                            x={516}
                            y={s.y}
                            width={392}
                            height={46}
                            rx={10}
                            fill={s.fill}
                            stroke={s.tone}
                        />
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
                        Persistent queue ownership and progress
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={80} width={width - 96} height={32}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    QUEUE FAN-OUT · DISTINCT SLOTS &amp; SAFE REUSE
                </span>
            </CanvasItem>
            {producers.map((b) => (
                <CanvasItem key={b.text} x={b.x} y={116} width={w} height={50}>
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
            {workers.map((wk) => (
                <CanvasItem key={wk.title} x={wk.x} y={212} width={w} height={118}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 2,
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
                            {wk.title}
                        </span>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 700,
                                color: blue,
                            }}
                        >
                            {wk.line}
                        </span>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 650,
                                color: c.textSecondary,
                            }}
                        >
                            compute
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {lifecycle.map((lc) => (
                <CanvasItem key={lc.text} x={lc.x} y={352} width={w} height={50}>
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
                                color: lc.tone,
                            }}
                        >
                            {lc.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            <CanvasItem x={48} y={412} width={width - 96} height={36}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        System-scope memory visible to CPU and GPU.
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={44} y={484} width={408} height={38}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: critical,
                        }}
                    >
                        STARVATION CYCLE
                    </span>
                </div>
            </CanvasItem>
            {cycleNodes.map((n) => (
                <CanvasItem key={n.text} x={n.x} y={n.y} width={198} height={52}>
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
            <CanvasItem x={40} y={710} width={416} height={42}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        Child needs a resident slot.
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={508} y={484} width={408} height={38}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: c.textPrimary,
                        }}
                    >
                        BOUNDED SHUTDOWN
                    </span>
                </div>
            </CanvasItem>
            {shutdown.map((s) => (
                <CanvasItem key={s.text} x={516} y={s.y} width={392} height={46}>
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
                                color: s.tone,
                            }}
                        >
                            {s.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}
        </Board>
    )
}

export default create()
