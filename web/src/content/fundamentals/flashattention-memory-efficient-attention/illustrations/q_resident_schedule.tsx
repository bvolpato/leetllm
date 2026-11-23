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
    'Two query blocks and two key/value blocks reveal the loop-order change. FlashAttention-1 loops over K/V first, updates each Q block, and writes its normalized O, maximum m, and denominator ell to HBM between outer steps. FlashAttention-2 loops over Q first, keeps a query block and unnormalized numerator N on chip while streaming both K/V blocks, then normalizes and writes O once.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const red = getReadableToneColor('critical', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const fills = {
        red: getToneFill('critical', c),
        green: getToneFill('green', c),
        cyan: getToneFill('cyan', c),
        purple: getToneFill('purple', c),
    }

    const xs = [48, 344, 640]
    const bw = 264
    const rowsFA1 = [
        [
            { text: 'K/V blk 0', tone: cyan, fill: fills.cyan },
            { text: 'Q₀, Q₁ update', tone: red, fill: fills.red },
            { text: 'O,m,ℓ → HBM', tone: red, fill: fills.red },
        ],
        [
            { text: 'K/V blk 1', tone: cyan, fill: fills.cyan },
            { text: 'Reload Q state', tone: red, fill: fills.red },
            { text: 'Write O,m,ℓ', tone: purple, fill: fills.purple },
        ],
    ]
    const rowsFA2 = [
        [
            { text: 'Pin Q₀ (N,m,ℓ)', tone: green, fill: fills.green },
            { text: 'Stream K/V 0', tone: cyan, fill: fills.cyan },
            { text: 'Stream K/V 1', tone: cyan, fill: fills.cyan },
        ],
        [
            { text: 'Norm O=N/ℓ', tone: purple, fill: fills.purple },
            { text: 'Write O₀, LSE₀', tone: green, fill: fills.green },
            { text: 'Next: Pin Q₁', tone: green, fill: fills.green },
        ],
    ]

    const renderGroup = (rows: typeof rowsFA1, yStart: number) =>
        rows.map((row, ri) =>
            row.map((b, ci) => (
                <g key={`${ri}-${ci}`}>
                    <SvgFrame
                        c={c}
                        x={xs[ci]}
                        y={yStart + ri * 90}
                        width={bw}
                        height={64}
                        rx={10}
                        fill={b.fill}
                        stroke={b.tone}
                    />
                    {ci < 2 && (
                        <VectorArrow
                            x1={xs[ci] + bw}
                            y1={yStart + ri * 90 + 32}
                            x2={xs[ci + 1] - 2}
                            y2={yStart + ri * 90 + 32}
                            color={c.textMuted}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                    )}
                </g>
            )),
        )

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
                        stroke={red}
                    />
                    {renderGroup(rowsFA1, 134)}
                    <SvgFrame
                        c={c}
                        x={28}
                        y={400}
                        width={904}
                        height={322}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={green}
                    />
                    {renderGroup(rowsFA2, 468)}
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
                        FA1 outer K/V loop vs FA2 pinned-Q outer loop
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
                            color: red,
                        }}
                    >
                        FA1 · K/V OUTER LOOP
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Q state returns to HBM
                    </span>
                </div>
            </CanvasItem>
            {rowsFA1.map((row, ri) =>
                row.map((b, ci) => (
                    <CanvasItem
                        key={`1-${ri}-${ci}`}
                        x={xs[ci]}
                        y={134 + ri * 90}
                        width={bw}
                        height={64}
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
                                {b.text}
                            </span>
                        </div>
                    </CanvasItem>
                )),
            )}
            <CanvasItem x={48} y={328} width={864} height={38}>
                <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                    Normalized O, m, and ℓ spill and reload each K/V block.
                </span>
            </CanvasItem>

            <CanvasItem x={48} y={414} width={864} height={40}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: green,
                        }}
                    >
                        FA2 · Q OUTER LOOP
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        One Q tile pinned in SRAM
                    </span>
                </div>
            </CanvasItem>
            {rowsFA2.map((row, ri) =>
                row.map((b, ci) => (
                    <CanvasItem
                        key={`2-${ri}-${ci}`}
                        x={xs[ci]}
                        y={468 + ri * 90}
                        width={bw}
                        height={64}
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
                                {b.text}
                            </span>
                        </div>
                    </CanvasItem>
                )),
            )}
            <CanvasItem x={48} y={662} width={864} height={44}>
                <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                    Both schedules compute the exact same attention output.
                </span>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
