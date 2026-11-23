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
export const height = 740
export const alt =
    'A labeled 4 by 4 tile schedule shows six fully allowed past pairs, four diagonal pairs, and six future pairs skipped. A diagonal tile applies a lower-triangular element mask, setting its upper triangle to negative infinity before softmax.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const red = getReadableToneColor('critical', c, c.bg)
    const fills = {
        green: getToneFill('green', c),
        purple: getToneFill('purple', c),
        red: getToneFill('critical', c),
    }

    const cellKind = (r: number, col: number) =>
        col < r
            ? { label: 'P', tone: green, fill: fills.green }
            : col === r
              ? { label: 'D', tone: purple, fill: fills.purple }
              : { label: 'F', tone: red, fill: fills.red }

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={452}
                        height={656}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={498}
                        y={66}
                        width={434}
                        height={656}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={purple}
                    />
                    {[0, 1, 2, 3].map((r) =>
                        [0, 1, 2, 3].map((col) => {
                            const k = cellKind(r, col)
                            return (
                                <SvgFrame
                                    key={`${r}-${col}`}
                                    c={c}
                                    x={116 + col * 86}
                                    y={182 + r * 86}
                                    width={76}
                                    height={76}
                                    rx={10}
                                    fill={k.fill}
                                    stroke={k.tone}
                                />
                            )
                        }),
                    )}
                    <VectorArrow
                        x1={715}
                        y1={436}
                        x2={715}
                        y2={504}
                        color={purple}
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
                        Causal block skipping on a 4 × 4 tile grid
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={80} width={412} height={38}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 800,
                        color: c.textPrimary,
                    }}
                >
                    4×4 TILE SCHEDULE
                </span>
            </CanvasItem>
            {['K0', 'K1', 'K2', 'K3'].map((k, col) => (
                <CanvasItem key={k} x={116 + col * 86} y={136} width={76} height={38}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 700,
                                color: c.textSecondary,
                            }}
                        >
                            {k}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {['Q0', 'Q1', 'Q2', 'Q3'].map((q, r) => (
                <CanvasItem key={q} x={46} y={182 + r * 86} width={60} height={76}>
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
                            {q}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            {[0, 1, 2, 3].map((r) =>
                [0, 1, 2, 3].map((col) => {
                    const k = cellKind(r, col)
                    return (
                        <CanvasItem
                            key={`${r}-${col}`}
                            x={116 + col * 86}
                            y={182 + r * 86}
                            width={76}
                            height={76}
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
                                        fontSize: 34,
                                        fontWeight: 850,
                                        color: k.tone,
                                    }}
                                >
                                    {k.label}
                                </span>
                            </div>
                        </CanvasItem>
                    )
                }),
            )}
            <CanvasItem x={48} y={544} width={412} height={156}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: green,
                        }}
                    >
                        P Past: 6 tiles
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: purple,
                        }}
                    >
                        D Diag: 4 tiles
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: red,
                        }}
                    >
                        F Skip: 6 (37.5%)
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        10 / 16 run
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={518} y={80} width={394} height={46}>
                <span
                    style={{ fontFamily: c.fontMono, fontSize: 30, fontWeight: 800, color: purple }}
                >
                    ZOOM: DIAGONAL Sᵢⱼ
                </span>
            </CanvasItem>
            <CanvasItem x={596} y={160} width={256} height={256}>
                <TiledMatrix
                    c={c}
                    rows={4}
                    cols={4}
                    cellSize={54}
                    gap={8}
                    tone="red"
                    ariaLabel="Diagonal 4x4 tile element mask: lower triangle kept, upper triangle -infinity"
                    regions={[
                        { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 1, tone: 'green' },
                        { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 2, tone: 'green' },
                        { rowStart: 2, rowEnd: 3, colStart: 0, colEnd: 3, tone: 'green' },
                        { rowStart: 3, rowEnd: 4, colStart: 0, colEnd: 4, tone: 'green' },
                    ]}
                />
            </CanvasItem>
            <CanvasItem x={518} y={520} width={394} height={180}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
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
                        Green ✓ allowed
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: red,
                        }}
                    >
                        Red −∞ masked
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textPrimary }}>
                        Mask before softmax
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
