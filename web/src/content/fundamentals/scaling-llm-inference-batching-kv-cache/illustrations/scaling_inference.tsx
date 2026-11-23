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

export const width = 980
export const height = 780
export const alt =
    'Two allocation snapshots hold the same eleven live blocks: A has two, B five, C three, and D one. Four maximum-length slabs reserve 32 blocks, leaving 21 unused. A separate 15-block paged pool holds the same blocks in interleaved physical order, with four available. Logical A0 and A1 map to nonadjacent physical slots.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const tones = {
        A: getReadableToneColor('blue', c, c.bg),
        B: getReadableToneColor('warm', c, c.bg),
        C: getReadableToneColor('green', c, c.bg),
        D: getReadableToneColor('purple', c, c.bg),
    }
    const fills = {
        A: getToneFill('blue', c),
        B: getToneFill('warm', c),
        C: getToneFill('green', c),
        D: getToneFill('purple', c),
    }
    const slabRows = [
        { req: 'A · 2 / 8', k: 'A' as const, used: ['A0', 'A1'] },
        { req: 'B · 5 / 8', k: 'B' as const, used: ['B0', 'B1', 'B2', 'B3', 'B4'] },
        { req: 'C · 3 / 8', k: 'C' as const, used: ['C0', 'C1', 'C2'] },
        { req: 'D · 1 / 8', k: 'D' as const, used: ['D0'] },
    ]
    const paged = [
        ['A0', 'B0', 'A1', 'C0', 'D0'],
        ['B1', 'C1', 'B2', 'C2', 'B3'],
        ['B4', 'free', 'free', 'free', 'free'],
    ]
    const slabX = 222
    const slabW = 84
    const pagedX = 222
    const pagedW = 136
    const pagedYs = [536, 594, 652]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {slabRows.map((row, r) =>
                        Array.from({ length: 8 }, (_, col) => {
                            const used = col < row.used.length
                            return (
                                <SvgFrame
                                    key={`s-${r}-${col}`}
                                    c={c}
                                    x={slabX + col * 90}
                                    y={156 + r * 52}
                                    width={slabW}
                                    height={42}
                                    rx={5}
                                    fill={used ? fills[row.k] : c.bgSubtle}
                                    stroke={used ? tones[row.k] : c.borderLight}
                                />
                            )
                        }),
                    )}
                    <VectorSegment
                        x1={28}
                        y1={372}
                        x2={width - 28}
                        y2={372}
                        color={c.borderLight}
                        strokeWidth={2}
                        showEndDot={false}
                    />
                    <SvgFrame
                        c={c}
                        x={pagedX}
                        y={448}
                        width={pagedW}
                        height={44}
                        rx={5}
                        fill={fills.A}
                        stroke={tones.A}
                    />
                    <SvgFrame
                        c={c}
                        x={pagedX + 2 * 146}
                        y={448}
                        width={pagedW}
                        height={44}
                        rx={5}
                        fill={fills.A}
                        stroke={tones.A}
                    />
                    <VectorArrow
                        x1={pagedX + pagedW / 2}
                        y1={492}
                        x2={pagedX + pagedW / 2}
                        y2={534}
                        color={tones.A}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={pagedX + 2 * 146 + pagedW / 2}
                        y1={492}
                        x2={pagedX + 2 * 146 + pagedW / 2}
                        y2={534}
                        color={tones.A}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    {paged.map((row, r) =>
                        row.map((tok, col) => {
                            const free = tok === 'free'
                            const k = tok[0] as keyof typeof tones
                            return (
                                <SvgFrame
                                    key={`p-${r}-${col}`}
                                    c={c}
                                    x={pagedX + col * 146}
                                    y={pagedYs[r]}
                                    width={pagedW}
                                    height={46}
                                    rx={5}
                                    fill={free ? c.bgSubtle : fills[k]}
                                    stroke={free ? c.borderLight : tones[k]}
                                />
                            )
                        }),
                    )}
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={16} width={width - 56} height={116}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 36,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Same 11 live blocks: slab vs. paged
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        Slab: 8 slots/req (32 total, 21 unused)
                    </span>
                </div>
            </CanvasItem>

            {slabRows.map((row, r) => (
                <React.Fragment key={row.req}>
                    <CanvasItem x={28} y={156 + r * 52} width={182} height={44}>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 31,
                                fontWeight: 800,
                                color: tones[row.k],
                            }}
                        >
                            {row.req}
                        </span>
                    </CanvasItem>
                    {row.used.map((tok, col) => (
                        <CanvasItem
                            key={tok}
                            x={slabX + col * 90}
                            y={156 + r * 52}
                            width={slabW}
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
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 800,
                                        color: tones[row.k],
                                    }}
                                >
                                    {tok}
                                </span>
                            </div>
                        </CanvasItem>
                    ))}
                </React.Fragment>
            ))}

            <CanvasItem x={28} y={388} width={width - 56} height={44}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    Paged: 15-block pool (11 used, 4 free)
                </span>
            </CanvasItem>

            <CanvasItem x={28} y={448} width={182} height={46}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 800,
                        color: tones.A,
                    }}
                >
                    A logical
                </span>
            </CanvasItem>
            <CanvasItem x={pagedX} y={448} width={pagedW} height={44}>
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
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 800,
                            color: tones.A,
                        }}
                    >
                        A0
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={pagedX + 2 * 146} y={448} width={pagedW} height={44}>
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
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 800,
                            color: tones.A,
                        }}
                    >
                        A1
                    </span>
                </div>
            </CanvasItem>

            {paged.map((row, r) =>
                row.map((tok, col) => {
                    const free = tok === 'free'
                    const colColor = free ? c.textMuted : tones[tok[0] as keyof typeof tones]
                    return (
                        <CanvasItem
                            key={`${r}-${col}`}
                            x={pagedX + col * 146}
                            y={pagedYs[r]}
                            width={pagedW}
                            height={46}
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
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 800,
                                        color: colColor,
                                    }}
                                >
                                    {tok}
                                </span>
                            </div>
                        </CanvasItem>
                    )
                }),
            )}

            <CanvasItem x={28} y={718} width={width - 56} height={44}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 600,
                        color: c.textSecondary,
                    }}
                >
                    A0 and A1 map to nonadjacent physical blocks.
                </span>
            </CanvasItem>
        </Board>
    )
}

export default create()
