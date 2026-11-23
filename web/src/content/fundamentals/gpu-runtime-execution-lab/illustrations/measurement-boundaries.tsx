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
    'Context creation, buffer allocation, warmup, and timing-event initialization happen outside the measured run. On a shared logical axis, host submission spans ticks zero to four while device-event and end-to-end intervals span zero to ten; these intervals overlap and should not be added. A device-event span can include five idle ticks between a kernel ending at three and the next operation beginning at eight. Fresh zero and one inputs check sums N and 9N at unchanged addresses, then the completed result is compared with an FP64 CPU reference.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const warm = getReadableToneColor('warm', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const fills = {
        warm: getToneFill('warm', c),
        blue: getToneFill('blue', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
    }

    const setup = ['context', 'allocate', 'warm up', 'prime']
    const setupXs = [48, 272, 496, 720]
    const setupW = 192

    const x0 = 220
    const scale = 68
    const tx = (t: number) => x0 + t * scale
    const bars = [
        { lane: 'HOST', text: 'host 0–4', t0: 0, t1: 4, y: 274, tone: blue, fill: fills.blue },
        {
            lane: 'DEVICE',
            text: 'event 0–10',
            t0: 0,
            t1: 10,
            y: 326,
            tone: purple,
            fill: fills.purple,
        },
        { lane: 'WALL', text: 'wall 0–10', t0: 0, t1: 10, y: 378, tone: green, fill: fills.green },
    ]

    const ix0 = 100
    const iscale = 76
    const ix = (t: number) => ix0 + t * iscale
    const checks = [
        { label: '0 → N', x: 48, tone: blue, fill: fills.blue },
        { label: '1 → 9N', x: 272, tone: purple, fill: fills.purple },
        { label: 'same ptrs', x: 496, tone: green, fill: fills.green },
        { label: 'FP64 ref', x: 720, tone: warm, fill: fills.warm },
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
                        height={126}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {setupXs.map((sx, idx) => (
                        <React.Fragment key={sx}>
                            <SvgFrame
                                c={c}
                                x={sx}
                                y={130}
                                width={setupW}
                                height={50}
                                rx={10}
                                fill={fills.warm}
                                stroke={warm}
                            />
                            {idx < setupXs.length - 1 && (
                                <VectorArrow
                                    x1={sx + setupW}
                                    y1={155}
                                    x2={setupXs[idx + 1] - 2}
                                    y2={155}
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
                        y={214}
                        width={width - 56}
                        height={248}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {bars.map((b) => (
                        <SvgFrame
                            key={b.lane}
                            c={c}
                            x={tx(b.t0)}
                            y={b.y}
                            width={(b.t1 - b.t0) * scale}
                            height={42}
                            rx={8}
                            fill={b.fill}
                            stroke={b.tone}
                        />
                    ))}
                    <VectorSegment
                        x1={tx(0)}
                        y1={428}
                        x2={tx(10)}
                        y2={428}
                        color={c.borderLight}
                        strokeWidth={2}
                        showEndDot={false}
                    />
                    {[0, 4, 10].map((t) => (
                        <React.Fragment key={t}>
                            <VectorSegment
                                x1={tx(t)}
                                y1={422}
                                x2={tx(t)}
                                y2={434}
                                color={c.borderLight}
                                strokeWidth={2}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}

                    <SvgFrame
                        c={c}
                        x={28}
                        y={476}
                        width={width - 56}
                        height={144}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={ix(0)}
                        y={528}
                        width={3 * iscale}
                        height={46}
                        rx={8}
                        fill={fills.blue}
                        stroke={blue}
                    />
                    <SvgFrame
                        c={c}
                        x={ix(3)}
                        y={528}
                        width={5 * iscale}
                        height={46}
                        rx={8}
                        fill={c.bgCard}
                        stroke={c.borderLight}
                    />
                    <SvgFrame
                        c={c}
                        x={ix(8)}
                        y={528}
                        width={2 * iscale}
                        height={46}
                        rx={8}
                        fill={fills.green}
                        stroke={green}
                    />
                    <VectorSegment
                        x1={ix(0)}
                        y1={584}
                        x2={ix(10)}
                        y2={584}
                        color={c.borderLight}
                        strokeWidth={2}
                        showEndDot={false}
                    />

                    <SvgFrame
                        c={c}
                        x={28}
                        y={634}
                        width={width - 56}
                        height={130}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {checks.map((ch) => (
                        <SvgFrame
                            key={ch.label}
                            c={c}
                            x={ch.x}
                            y={688}
                            width={setupW}
                            height={52}
                            rx={10}
                            fill={ch.fill}
                            stroke={ch.tone}
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
                        Measure timing scopes and check buffer identity
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
                    KEEP OUTSIDE THE TIMED RUN
                </span>
            </CanvasItem>
            {setup.map((lbl, idx) => (
                <CanvasItem key={lbl} x={setupXs[idx]} y={130} width={setupW} height={50}>
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
                                color: warm,
                            }}
                        >
                            {lbl}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={48} y={224} width={width - 96} height={38}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    OVERLAPPING INTERVALS · ONE AXIS · DO NOT ADD
                </span>
            </CanvasItem>
            {bars.map((b) => (
                <React.Fragment key={b.lane}>
                    <CanvasItem x={46} y={b.y} width={150} height={42}>
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
                                {b.lane}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={tx(b.t0)} y={b.y} width={(b.t1 - b.t0) * scale} height={42}>
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
                </React.Fragment>
            ))}
            {[0, 4, 10].map((t) => (
                <CanvasItem key={t} x={tx(t) - 34} y={428} width={68} height={32}>
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

            <CanvasItem x={48} y={486} width={width - 96} height={36}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    EVENT SPAN CAN INCLUDE IDLE TIME
                </span>
            </CanvasItem>
            <CanvasItem x={ix(0)} y={528} width={3 * iscale} height={46}>
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
                        kernel
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={ix(3)} y={528} width={5 * iscale} height={46}>
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
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        5 idle ticks
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={ix(8)} y={528} width={2 * iscale} height={46}>
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
                        next
                    </span>
                </div>
            </CanvasItem>
            {[0, 3, 8, 10].map((t) => (
                <CanvasItem key={t} x={ix(t) - 34} y={584} width={68} height={34}>
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

            <CanvasItem x={48} y={644} width={width - 96} height={36}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    PREFLIGHT CHECKS + FP64 REFERENCE
                </span>
            </CanvasItem>
            {checks.map((ch) => (
                <CanvasItem key={ch.label} x={ch.x} y={688} width={setupW} height={52}>
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
                                color: ch.tone,
                            }}
                        >
                            {ch.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}
        </Board>
    )
}

export default create()
