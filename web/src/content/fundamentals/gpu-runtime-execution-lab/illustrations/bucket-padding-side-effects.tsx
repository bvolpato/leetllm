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
    'A complete runtime descriptor routes six requests to bucket eight, while a six-request descriptor with an uncaptured LoRA key takes standard eager dispatch. Sixteen requests match bucket sixteen, and seventeen requests take the eager path. In bucket eight, two dummy zeros become ones after 2x+1 and remain ones after squaring. Summing all eight gives 456; masking padded slots seven and eight first gives the correct 454. A dummy cache write can still affect a live request even when the final reduction is masked.'

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

    const routes = [
        { req: '6 reqs', mid: 'bucket 8', path: 'graph replay', ok: true, y: 120 },
        { req: '6 reqs', mid: 'LoRA miss', path: 'eager path', ok: false, y: 166 },
        { req: '16 reqs', mid: 'bucket 16', path: 'graph replay', ok: true, y: 212 },
        { req: '17 reqs', mid: 'no match', path: 'eager path', ok: false, y: 258 },
    ]
    const cellsX = 200
    const cellW = 84
    const cellStep = 90
    const cellRows = [
        {
            name: 'input',
            y: 372,
            vals: ['1', '2', '3', '4', '5', '6', '0', '0'],
            tone: blue,
            fill: fills.blue,
        },
        {
            name: '2x + 1',
            y: 426,
            vals: ['3', '5', '7', '9', '11', '13', '1', '1'],
            tone: green,
            fill: fills.green,
        },
        {
            name: 'square',
            y: 480,
            vals: ['9', '25', '49', '81', '121', '169', '1', '1'],
            tone: purple,
            fill: fills.purple,
        },
    ]
    const cacheNodes = [
        { label: 'dummy slot', x: 60, w: 220, tone: warm, fill: fills.warm },
        { label: 'cache write', x: 350, w: 260, tone: critical, fill: fills.critical },
        { label: 'live request', x: 680, w: 220, tone: blue, fill: fills.blue },
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
                        height={238}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {routes.map((r) => (
                        <React.Fragment key={`${r.req}-${r.mid}`}>
                            <SvgFrame
                                c={c}
                                x={56}
                                y={r.y}
                                width={240}
                                height={38}
                                rx={8}
                                fill={fills.blue}
                                stroke={blue}
                            />
                            <SvgFrame
                                c={c}
                                x={360}
                                y={r.y}
                                width={240}
                                height={38}
                                rx={8}
                                fill={r.ok ? fills.warm : c.bgCard}
                                stroke={r.ok ? warm : c.borderLight}
                            />
                            <SvgFrame
                                c={c}
                                x={664}
                                y={r.y}
                                width={240}
                                height={38}
                                rx={8}
                                fill={r.ok ? fills.green : c.bgCard}
                                stroke={r.ok ? green : c.borderLight}
                            />
                            <VectorArrow
                                x1={296}
                                y1={r.y + 19}
                                x2={358}
                                y2={r.y + 19}
                                color={c.textMuted}
                                strokeWidth={3}
                                arrowSize={5}
                            />
                            <VectorArrow
                                x1={600}
                                y1={r.y + 19}
                                x2={662}
                                y2={r.y + 19}
                                color={c.textMuted}
                                strokeWidth={3}
                                arrowSize={5}
                            />
                        </React.Fragment>
                    ))}
                    <SvgFrame
                        c={c}
                        x={28}
                        y={324}
                        width={width - 56}
                        height={272}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {cellRows.map((row) =>
                        row.vals.map((_, idx) => (
                            <SvgFrame
                                key={`${row.name}-${idx}`}
                                c={c}
                                x={cellsX + idx * cellStep}
                                y={row.y}
                                width={cellW}
                                height={42}
                                rx={7}
                                fill={idx < 6 ? row.fill : fills.warm}
                                stroke={idx < 6 ? row.tone : warm}
                            />
                        )),
                    )}
                    <VectorSegment
                        x1={cellsX + 6 * cellStep - 3}
                        y1={364}
                        x2={cellsX + 6 * cellStep - 3}
                        y2={528}
                        color={warm}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    <SvgFrame
                        c={c}
                        x={92}
                        y={536}
                        width={360}
                        height={46}
                        rx={10}
                        fill={fills.critical}
                        stroke={critical}
                    />
                    <SvgFrame
                        c={c}
                        x={508}
                        y={536}
                        width={360}
                        height={46}
                        rx={10}
                        fill={fills.green}
                        stroke={green}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={610}
                        width={width - 56}
                        height={154}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {cacheNodes.map((b) => (
                        <SvgFrame
                            key={b.label}
                            c={c}
                            x={b.x}
                            y={666}
                            width={b.w}
                            height={50}
                            rx={10}
                            fill={b.fill}
                            stroke={b.tone}
                        />
                    ))}
                    <VectorArrow
                        x1={280}
                        y1={691}
                        x2={348}
                        y2={691}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={610}
                        y1={691}
                        x2={678}
                        y2={691}
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
                        Padding changes arithmetic and side effects
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={80} width={width - 96} height={34}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    DISPATCH KEY (tokens · reqs · LoRA)
                </span>
            </CanvasItem>
            {routes.map((r) => (
                <React.Fragment key={`${r.req}-${r.mid}`}>
                    <CanvasItem x={56} y={r.y} width={240} height={38}>
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
                                {r.req}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={360} y={r.y} width={240} height={38}>
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
                                    color: r.ok ? warm : c.textSecondary,
                                }}
                            >
                                {r.mid}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={664} y={r.y} width={240} height={38}>
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
                                    color: r.ok ? green : c.textSecondary,
                                }}
                            >
                                {r.path}
                            </span>
                        </div>
                    </CanvasItem>
                </React.Fragment>
            ))}
            <CanvasItem x={48} y={332} width={width - 96} height={34}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        BUCKET 8 · 6 VALID
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: warm,
                        }}
                    >
                        SLOTS 7–8 PADDED
                    </span>
                </div>
            </CanvasItem>
            {cellRows.map((row) => (
                <React.Fragment key={row.name}>
                    <CanvasItem x={48} y={row.y} width={140} height={42}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 700,
                                color: c.textSecondary,
                            }}
                        >
                            {row.name}
                        </span>
                    </CanvasItem>
                    {row.vals.map((v, idx) => (
                        <CanvasItem
                            key={`${row.name}-${idx}`}
                            x={cellsX + idx * cellStep}
                            y={row.y}
                            width={cellW}
                            height={42}
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
                                        color: idx < 6 ? row.tone : warm,
                                    }}
                                >
                                    {v}
                                </span>
                            </div>
                        </CanvasItem>
                    ))}
                </React.Fragment>
            ))}
            <CanvasItem x={92} y={536} width={360} height={46}>
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
                            color: critical,
                        }}
                    >
                        all 8 → 456
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={508} y={536} width={360} height={46}>
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
                        mask 7–8 → 454
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={620} width={width - 96} height={36}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    Final mask cannot undo an earlier cache write
                </span>
            </CanvasItem>
            {cacheNodes.map((b) => (
                <CanvasItem key={b.label} x={b.x} y={666} width={b.w} height={50}>
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
            <CanvasItem x={48} y={722} width={width - 96} height={34}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        Mask or guard dummy writes inside the kernel itself.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
