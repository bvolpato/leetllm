import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TiledMatrix,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 780
export const alt =
    'With an 8,192-key span, prefill has 8,192 causal query rows and 33,558,528 valid query-key pairs per head. One decode step has a single query row and 8,192 valid keys. Their exact pair-count ratio is 4,096.5; the full square contains 67,108,864 possible slots, and the ratio does not measure speed. A separate map sends eight logical allocator pages of 16 tokens each to scattered physical blocks. One 128-token kernel read spans all eight pages. The flash-attn paged interface separately requires page sizes divisible by 256.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const fills = {
        green: getToneFill('green', c),
        cyan: getToneFill('cyan', c),
        purple: getToneFill('purple', c),
        blue: getToneFill('blue', c),
    }
    const physical = [17, 4, 21, 6, 9, 2, 15, 11]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={438}
                        height={352}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={green}
                    />
                    <SvgFrame
                        c={c}
                        x={494}
                        y={66}
                        width={438}
                        height={352}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={cyan}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={432}
                        width={904}
                        height={60}
                        rx={12}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={432}
                        width={904}
                        height={60}
                        rx={12}
                        fill={fills.purple}
                        stroke={purple}
                    />

                    <SvgFrame
                        c={c}
                        x={28}
                        y={506}
                        width={904}
                        height={258}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={blue}
                    />
                    {physical.map((p, i) => (
                        <g key={p}>
                            <SvgFrame
                                c={c}
                                x={52 + i * 108}
                                y={558}
                                width={96}
                                height={46}
                                rx={8}
                                fill={fills.blue}
                                stroke={blue}
                            />
                            <SvgFrame
                                c={c}
                                x={52 + i * 108}
                                y={644}
                                width={96}
                                height={46}
                                rx={8}
                                fill={fills.purple}
                                stroke={purple}
                            />
                            <VectorArrow
                                x1={100 + i * 108}
                                y1={604}
                                x2={100 + i * 108}
                                y2={642}
                                color={blue}
                                strokeWidth={3}
                                arrowSize={5}
                            />
                        </g>
                    ))}
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
                        Prefill vs decode pair geometry (8,192 keys)
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={78} width={398} height={40}>
                <span
                    style={{ fontFamily: c.fontMono, fontSize: 30, fontWeight: 800, color: green }}
                >
                    PREFILL · 8,192 ROWS
                </span>
            </CanvasItem>
            <CanvasItem x={156} y={130} width={180} height={160}>
                <TiledMatrix
                    c={c}
                    rows={6}
                    cols={6}
                    cellSize={22}
                    gap={4}
                    tone="neutral"
                    ariaLabel="Lower-triangular causal prefill attention matrix"
                    regions={Array.from({ length: 6 }, (_, r) => ({
                        rowStart: r,
                        rowEnd: r + 1,
                        colStart: 0,
                        colEnd: r + 1,
                        tone: 'green',
                    }))}
                />
            </CanvasItem>
            <CanvasItem x={48} y={306} width={398} height={96}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
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
                        33,558,528 pairs
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textSecondary }}>
                        67,108,864 full sq
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={514} y={78} width={398} height={40}>
                <span
                    style={{ fontFamily: c.fontMono, fontSize: 30, fontWeight: 800, color: cyan }}
                >
                    DECODE · 1 QUERY ROW
                </span>
            </CanvasItem>
            <CanvasItem x={556} y={196} width={320} height={42}>
                <TiledMatrix
                    c={c}
                    rows={1}
                    cols={8}
                    cellSize={32}
                    gap={5}
                    tone="green"
                    ariaLabel="Single decode query row across 8 key blocks"
                />
            </CanvasItem>
            <CanvasItem x={514} y={306} width={398} height={96}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
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
                        8,192 pairs/step
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textSecondary }}>
                        1 query vector
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={444} width={864} height={40}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 800,
                            color: purple,
                        }}
                    >
                        Ratio: 33,558,528 ÷ 8,192 = 4,096.5× (shape only)
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={516} width={864} height={36}>
                <span
                    style={{ fontFamily: c.fontMono, fontSize: 30, fontWeight: 800, color: blue }}
                >
                    PAGED (16 tok/pg) → KERNEL 128-tok TILE
                </span>
            </CanvasItem>
            {physical.map((p, i) => (
                <React.Fragment key={p}>
                    <CanvasItem x={52 + i * 108} y={558} width={96} height={46}>
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
                                L{i}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={52 + i * 108} y={644} width={96} height={46}>
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
                                P{p}
                            </span>
                        </div>
                    </CanvasItem>
                </React.Fragment>
            ))}
            <CanvasItem x={48} y={708} width={864} height={42}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        flash-attn paged API: pages must be divisible by 256.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
