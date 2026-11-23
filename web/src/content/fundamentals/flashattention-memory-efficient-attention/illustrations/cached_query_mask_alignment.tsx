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
    'One query at absolute position 3 sees four valid cached keys at positions 0, 1, 2, and 3. Their scores are all zero and values are 10, 20, 40, and 80. Correct weights are one quarter each, contributing 2.5, 5, 10, and 20 for output 37.5. An upper-left 1 by 4 causal mask keeps only key 0 and returns 10. Padding, unused cache slots, and future keys still need masking.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const red = getReadableToneColor('critical', c, c.bg)
    const fills = {
        blue: getToneFill('blue', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
        red: getToneFill('critical', c),
    }

    const xs = [264, 434, 604, 774]
    const cw = 152
    const rows = [
        { name: 'KV pos', vals: ['K0', 'K1', 'K2', 'K3'], y: 120, tone: blue, fill: fills.blue },
        {
            name: 'Value Vⱼ',
            vals: ['10', '20', '40', '80'],
            y: 176,
            tone: c.textPrimary,
            fill: c.bgCard,
        },
        { name: 'Score sⱼ', vals: ['0', '0', '0', '0'], y: 232, tone: purple, fill: fills.purple },
        { name: 'Valid (3)', vals: ['✓', '✓', '✓', '✓'], y: 288, tone: green, fill: fills.green },
        { name: 'Upper-L', vals: ['✓', '−∞', '−∞', '−∞'], y: 344, tone: red, fill: fills.red },
        { name: '¼ × Vⱼ', vals: ['2.5', '5', '10', '20'], y: 400, tone: green, fill: fills.green },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={904}
                        height={414}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {rows.map((r) =>
                        xs.map((x, i) => {
                            const okUpper = r.name === 'Upper-L' && i === 0
                            return (
                                <g key={`${r.name}-${i}`}>
                                    <SvgFrame
                                        c={c}
                                        x={x}
                                        y={r.y}
                                        width={cw}
                                        height={46}
                                        rx={8}
                                        fill={okUpper ? fills.green : r.fill}
                                        stroke={
                                            okUpper
                                                ? green
                                                : r.name === 'Value Vⱼ'
                                                  ? c.borderLight
                                                  : r.tone
                                        }
                                    />
                                </g>
                            )
                        }),
                    )}

                    <SvgFrame
                        c={c}
                        x={28}
                        y={498}
                        width={904}
                        height={112}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={498}
                        width={904}
                        height={112}
                        rx={14}
                        fill={fills.green}
                        stroke={green}
                    />
                    <VectorArrow
                        x1={520}
                        y1={554}
                        x2={590}
                        y2={554}
                        color={green}
                        strokeWidth={4}
                        arrowSize={6}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={626}
                        width={904}
                        height={116}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={626}
                        width={904}
                        height={116}
                        rx={14}
                        fill={fills.red}
                        stroke={red}
                    />
                    <VectorArrow
                        x1={520}
                        y1={684}
                        x2={590}
                        y2={684}
                        color={red}
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
                        Query at pos 3 vs upper-left 1 × 4 causal mask
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={74} width={864} height={34}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textPrimary,
                    }}
                >
                    Q AT POSITION 3 · CACHED KEYS 0–3
                </span>
            </CanvasItem>
            {rows.map((r) => (
                <React.Fragment key={r.name}>
                    <CanvasItem x={48} y={r.y} width={202} height={46}>
                        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 750,
                                    color: c.textSecondary,
                                }}
                            >
                                {r.name}
                            </span>
                        </div>
                    </CanvasItem>
                    {r.vals.map((v, i) => {
                        const okUpper = r.name === 'Upper-L' && i === 0
                        return (
                            <CanvasItem
                                key={`${r.name}-${i}`}
                                x={xs[i]}
                                y={r.y}
                                width={cw}
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
                                            fontFamily: c.fontMono,
                                            fontSize: 30,
                                            fontWeight: 800,
                                            color: okUpper ? green : r.tone,
                                        }}
                                    >
                                        {v}
                                    </span>
                                </div>
                            </CanvasItem>
                        )
                    })}
                </React.Fragment>
            ))}

            <CanvasItem x={48} y={512} width={460} height={84}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%',
                        width: '100%',
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
                        ALL 4 VALID (w = ¼)
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        2.5 + 5 + 10 + 20
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={612} y={512} width={300} height={84}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 34,
                            fontWeight: 850,
                            color: green,
                        }}
                    >
                        O₃ = 37.5
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={640} width={460} height={84}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: red,
                        }}
                    >
                        UPPER-LEFT MASK
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        K0 only; excludes K1–3
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={612} y={640} width={300} height={84}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 34,
                            fontWeight: 850,
                            color: red,
                        }}
                    >
                        O₃ = 10
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
