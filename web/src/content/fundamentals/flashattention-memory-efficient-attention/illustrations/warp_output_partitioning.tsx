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
export const height = 740
export const alt =
    'Split-K assigns different key blocks to warps, which produce partial outputs that must be combined with synchronization. Split-Q assigns different query rows to warps, so each warp owns separate output rows and avoids that output reduction. The rest of the kernel still has dependencies that may require synchronization.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const fills = {
        purple: getToneFill('purple', c),
        blue: getToneFill('blue', c),
        cyan: getToneFill('cyan', c),
        green: getToneFill('green', c),
    }

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={904}
                        height={316}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={purple}
                    />
                    <SvgFrame
                        c={c}
                        x={48}
                        y={132}
                        width={392}
                        height={86}
                        rx={12}
                        fill={fills.blue}
                        stroke={blue}
                    />
                    <SvgFrame
                        c={c}
                        x={520}
                        y={132}
                        width={392}
                        height={86}
                        rx={12}
                        fill={fills.cyan}
                        stroke={cyan}
                    />
                    <VectorArrow
                        x1={244}
                        y1={218}
                        x2={340}
                        y2={266}
                        color={purple}
                        strokeWidth={4}
                        arrowSize={6}
                    />
                    <VectorArrow
                        x1={716}
                        y1={218}
                        x2={620}
                        y2={266}
                        color={purple}
                        strokeWidth={4}
                        arrowSize={6}
                    />
                    <SvgFrame
                        c={c}
                        x={140}
                        y={268}
                        width={680}
                        height={86}
                        rx={12}
                        fill={fills.purple}
                        stroke={purple}
                    />

                    <SvgFrame
                        c={c}
                        x={28}
                        y={400}
                        width={904}
                        height={322}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={blue}
                    />
                    <SvgFrame
                        c={c}
                        x={48}
                        y={472}
                        width={380}
                        height={76}
                        rx={12}
                        fill={fills.blue}
                        stroke={blue}
                    />
                    <SvgFrame
                        c={c}
                        x={532}
                        y={472}
                        width={380}
                        height={76}
                        rx={12}
                        fill={fills.green}
                        stroke={green}
                    />
                    <VectorArrow
                        x1={430}
                        y1={510}
                        x2={528}
                        y2={510}
                        color={blue}
                        strokeWidth={4}
                        arrowSize={6}
                    />

                    <SvgFrame
                        c={c}
                        x={48}
                        y={572}
                        width={380}
                        height={76}
                        rx={12}
                        fill={fills.cyan}
                        stroke={cyan}
                    />
                    <SvgFrame
                        c={c}
                        x={532}
                        y={572}
                        width={380}
                        height={76}
                        rx={12}
                        fill={fills.green}
                        stroke={green}
                    />
                    <VectorArrow
                        x1={430}
                        y1={610}
                        x2={528}
                        y2={610}
                        color={cyan}
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
                        Warp work partitioning sets output ownership
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={80} width={864} height={40}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: purple,
                        }}
                    >
                        SPLIT K · PARTITION KEYS
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Shared-memory reduction
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={136} width={392} height={78}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        Warp 0
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        partial O from K₀
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={520} y={136} width={392} height={78}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                            color: cyan,
                        }}
                    >
                        Warp 1
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        partial O from K₁
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={140} y={268} width={680} height={86}>
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
                        Merge partial O + sync barriers
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={414} width={864} height={40}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: blue,
                        }}
                    >
                        SPLIT Q · PARTITION QUERIES
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: green }}>
                        Disjoint output rows
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={472} width={380} height={76}>
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
                        Warp 0 · Q rows 0–1
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={532} y={472} width={380} height={76}>
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
                        Own O rows 0–1
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={572} width={380} height={76}>
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
                        Warp 1 · Q rows 2–3
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={532} y={572} width={380} height={76}>
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
                        Own O rows 2–3
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={662} width={864} height={46}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        No cross-warp O merge; other kernel barriers remain.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
