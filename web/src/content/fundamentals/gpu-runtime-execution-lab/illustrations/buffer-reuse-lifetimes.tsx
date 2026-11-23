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
    'Pinned host staging buffers H1, H2, and H3 feed two disjoint device slots A and B. Transfer H2 into B can overlap compute reading A for H1. Slot A stays busy until its reader finishes, then H3 may reuse it. Reusing A early would race the active reader.'

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

    const hostBtns = [
        { label: 'H1', x: 52 },
        { label: 'H2', x: 184 },
        { label: 'H3', x: 316 },
    ]
    const slotBtns = [
        { label: 'slot A', x: 524, tone: warm, fill: fills.warm },
        { label: 'slot B', x: 716, tone: purple, fill: fills.purple },
    ]
    const copyBars = [
        { label: 'H1→A', x: 204, w: 150 },
        { label: 'H2→B', x: 386, w: 150 },
        { label: 'H3→A', x: 750, w: 150 },
    ]
    const computeBars = [
        { label: 'H1 reads A', x: 354, w: 222 },
        { label: 'H2 reads B', x: 590, w: 230 },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={76}
                        width={428}
                        height={140}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={484}
                        y={76}
                        width={448}
                        height={140}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {hostBtns.map((b) => (
                        <SvgFrame
                            key={b.label}
                            c={c}
                            x={b.x}
                            y={138}
                            width={116}
                            height={54}
                            rx={10}
                            fill={fills.blue}
                            stroke={blue}
                        />
                    ))}
                    {slotBtns.map((b) => (
                        <SvgFrame
                            key={b.label}
                            c={c}
                            x={b.x}
                            y={138}
                            width={174}
                            height={54}
                            rx={10}
                            fill={b.fill}
                            stroke={b.tone}
                        />
                    ))}

                    <SvgFrame
                        c={c}
                        x={28}
                        y={236}
                        width={width - 56}
                        height={418}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {copyBars.map((b) => (
                        <SvgFrame
                            key={b.label}
                            c={c}
                            x={b.x}
                            y={322}
                            width={b.w}
                            height={50}
                            rx={10}
                            fill={fills.purple}
                            stroke={purple}
                        />
                    ))}
                    {computeBars.map((b) => (
                        <SvgFrame
                            key={b.label}
                            c={c}
                            x={b.x}
                            y={404}
                            width={b.w}
                            height={50}
                            rx={10}
                            fill={fills.green}
                            stroke={green}
                        />
                    ))}
                    <SvgFrame
                        c={c}
                        x={204}
                        y={506}
                        width={372}
                        height={50}
                        rx={10}
                        fill={fills.warm}
                        stroke={warm}
                    />
                    <SvgFrame
                        c={c}
                        x={576}
                        y={506}
                        width={174}
                        height={50}
                        rx={10}
                        fill={c.bgCard}
                        stroke={c.borderLight}
                    />
                    <SvgFrame
                        c={c}
                        x={750}
                        y={506}
                        width={150}
                        height={50}
                        rx={10}
                        fill={fills.green}
                        stroke={green}
                    />
                    <SvgFrame
                        c={c}
                        x={386}
                        y={582}
                        width={434}
                        height={50}
                        rx={10}
                        fill={fills.purple}
                        stroke={purple}
                    />

                    <VectorArrow
                        x1={354}
                        y1={372}
                        x2={354}
                        y2={402}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={6}
                    />
                    <VectorArrow
                        x1={536}
                        y1={372}
                        x2={590}
                        y2={402}
                        color={c.textMuted}
                        strokeWidth={3}
                        arrowSize={6}
                    />
                    <VectorArrow
                        x1={576}
                        y1={454}
                        x2={576}
                        y2={504}
                        color={green}
                        strokeWidth={3}
                        arrowSize={6}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={14} width={width - 56} height={50}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 36,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Two slots permit transfer and compute overlap
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={88} width={428} height={38}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        PINNED HOST STAGING
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={484} y={88} width={448} height={38}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        ONE DEVICE ALLOCATION
                    </span>
                </div>
            </CanvasItem>

            {hostBtns.map((b) => (
                <CanvasItem key={b.label} x={b.x} y={138} width={116} height={54}>
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
                                fontSize: 32,
                                fontWeight: 800,
                                color: blue,
                            }}
                        >
                            {b.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {slotBtns.map((b) => (
                <CanvasItem key={b.label} x={b.x} y={138} width={174} height={54}>
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
                                fontSize: 31,
                                fontWeight: 800,
                                color: b.tone,
                            }}
                        >
                            {b.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={28} y={248} width={width - 56} height={60}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
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
                        LOGICAL ORDER · NO TIME SCALE
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        H2 COPY OVERLAPS H1 COMPUTE
                    </span>
                </div>
            </CanvasItem>

            {[
                { label: 'COPY', y: 326 },
                { label: 'COMPUTE', y: 408 },
                { label: 'SLOT A', y: 510 },
                { label: 'SLOT B', y: 586 },
            ].map((lane) => (
                <CanvasItem key={lane.label} x={44} y={lane.y} width={150} height={44}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        {lane.label}
                    </span>
                </CanvasItem>
            ))}

            {copyBars.map((b) => (
                <CanvasItem key={b.label} x={b.x} y={322} width={b.w} height={50}>
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
                                color: purple,
                            }}
                        >
                            {b.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {computeBars.map((b) => (
                <CanvasItem key={b.label} x={b.x} y={404} width={b.w} height={50}>
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
                            {b.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={204} y={506} width={372} height={50}>
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
                        H1 busy
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={576} y={506} width={174} height={50}>
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
                            color: c.textMuted,
                        }}
                    >
                        free
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={750} y={506} width={150} height={50}>
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
                        H3
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={386} y={582} width={434} height={50}>
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
                            color: purple,
                        }}
                    >
                        H2 busy
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={666} width={width - 56} height={80}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        width: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        Actual overlap depends on available resources.
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        Reuse A after its last reader finishes.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
