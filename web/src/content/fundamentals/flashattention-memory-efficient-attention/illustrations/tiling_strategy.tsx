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
export { createFilm } from './_parts/flashattention-film'

export const width = 960
export const height = 780
export const alt =
    'Block A pairs scores 1 and 2 with values 10 and 20. When Block B adds score 3 and value 40, the maximum moves from 2 to 3, so alpha equals exp(-1), about 0.368. The same factor shrinks Block A denominator 1.368 to 0.503 and numerator 23.679 to 8.711. Block B adds 1 and 40, yielding denominator 1.503, numerator 48.711, and output 32.404513, equal to dense softmax.'

const barW = (v: number, total: number) => Math.max(12, Math.round((v / total) * 184))

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const fills = {
        blue: getToneFill('blue', c),
        warm: getToneFill('warm', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
    }

    const alpha = Math.exp(-1)
    const dOld = 1 + alpha
    const dScaled = alpha * dOld
    const dTotal = dScaled + 1
    const nOld = alpha * 10 + 20
    const nScaled = alpha * nOld
    const nTotal = nScaled + 40

    const rails = [
        {
            name: 'ℓ',
            y: 282,
            tone: green,
            fill: fills.green,
            vals: [dOld.toFixed(3), dScaled.toFixed(3), '1.000', dTotal.toFixed(3)],
            wOld: barW(dOld, dTotal),
            wScaled: barW(dScaled, dTotal),
            wTile: barW(1, dTotal),
        },
        {
            name: 'N',
            y: 458,
            tone: blue,
            fill: fills.blue,
            vals: [nOld.toFixed(3), nScaled.toFixed(3), '40.000', nTotal.toFixed(3)],
            wOld: barW(nOld, nTotal),
            wScaled: barW(nScaled, nTotal),
            wTile: barW(40, nTotal),
        },
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
                        height={198}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={48}
                        y={84}
                        width={276}
                        height={162}
                        rx={10}
                        fill={fills.blue}
                        stroke={blue}
                    />
                    <SvgFrame
                        c={c}
                        x={354}
                        y={84}
                        width={220}
                        height={162}
                        rx={10}
                        fill={fills.warm}
                        stroke={warm}
                    />
                    <SvgFrame
                        c={c}
                        x={604}
                        y={84}
                        width={308}
                        height={162}
                        rx={10}
                        fill={fills.purple}
                        stroke={purple}
                    />
                    <VectorArrow
                        x1={326}
                        y1={165}
                        x2={352}
                        y2={165}
                        color={warm}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={576}
                        y1={165}
                        x2={602}
                        y2={165}
                        color={purple}
                        strokeWidth={3}
                        arrowSize={5}
                    />

                    {rails.map((r) => (
                        <g key={r.name}>
                            <SvgFrame
                                c={c}
                                x={28}
                                y={r.y}
                                width={904}
                                height={158}
                                rx={14}
                                fill={c.bgSubtle}
                                stroke={r.tone}
                            />
                            <SvgFrame
                                c={c}
                                x={48}
                                y={r.y + 104}
                                width={r.wOld}
                                height={26}
                                rx={13}
                                fill={r.fill}
                                stroke={r.tone}
                            />
                            <VectorArrow
                                x1={250}
                                y1={r.y + 84}
                                x2={296}
                                y2={r.y + 84}
                                color={purple}
                                strokeWidth={3}
                                arrowSize={5}
                            />
                            <SvgFrame
                                c={c}
                                x={312}
                                y={r.y + 104}
                                width={r.wScaled}
                                height={26}
                                rx={13}
                                fill={r.fill}
                                stroke={r.tone}
                            />
                            <SvgFrame
                                c={c}
                                x={526}
                                y={r.y + 104}
                                width={r.wTile}
                                height={26}
                                rx={13}
                                fill={fills.warm}
                                stroke={warm}
                            />
                            <SvgFrame
                                c={c}
                                x={730}
                                y={r.y + 104}
                                width={r.wScaled}
                                height={26}
                                rx={8}
                                fill={r.fill}
                                stroke={r.tone}
                            />
                            <SvgFrame
                                c={c}
                                x={730 + r.wScaled}
                                y={r.y + 104}
                                width={r.wTile}
                                height={26}
                                rx={8}
                                fill={fills.warm}
                                stroke={warm}
                            />
                        </g>
                    ))}
                    <SvgFrame
                        c={c}
                        x={28}
                        y={634}
                        width={904}
                        height={124}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={634}
                        width={904}
                        height={124}
                        rx={14}
                        fill={fills.green}
                        stroke={green}
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
                        Online softmax rescales both sums to one max
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={56} y={96} width={260} height={138}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
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
                        Block A
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        s = [1, 2]
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        v = [10, 20]
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={362} y={96} width={204} height={138}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
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
                        Block B
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        s = [3]
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        v = [40]
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={614} y={96} width={288} height={138}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
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
                        m: 2 → 3
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: purple,
                        }}
                    >
                        α=exp(−1)=0.368
                    </span>
                </div>
            </CanvasItem>

            {rails.map((r) => (
                <React.Fragment key={r.name}>
                    <CanvasItem x={48} y={r.y + 14} width={186} height={78}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: r.tone,
                                }}
                            >
                                {r.name}_A
                            </span>
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: c.textPrimary,
                                }}
                            >
                                {r.vals[0]}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={242} y={r.y + 18} width={66} height={40}>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: purple,
                                }}
                            >
                                ×α
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={312} y={r.y + 14} width={180} height={78}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    color: c.textSecondary,
                                }}
                            >
                                scaled
                            </span>
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: r.tone,
                                }}
                            >
                                {r.vals[1]}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={496} y={r.y + 42} width={30} height={40}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 32,
                                fontWeight: 800,
                                color: c.textSecondary,
                            }}
                        >
                            +
                        </span>
                    </CanvasItem>
                    <CanvasItem x={526} y={r.y + 14} width={166} height={78}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <span style={{ fontFamily: c.fontSans, fontSize: 30, color: warm }}>
                                Block B
                            </span>
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: warm,
                                }}
                            >
                                {r.vals[2]}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={696} y={r.y + 42} width={30} height={40}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 32,
                                fontWeight: 800,
                                color: c.textSecondary,
                            }}
                        >
                            =
                        </span>
                    </CanvasItem>
                    <CanvasItem x={730} y={r.y + 14} width={186} height={78}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: r.tone,
                                }}
                            >
                                {r.name}_new
                            </span>
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: c.textPrimary,
                                }}
                            >
                                {r.vals[3]}
                            </span>
                        </div>
                    </CanvasItem>
                </React.Fragment>
            ))}

            <CanvasItem x={48} y={648} width={864} height={96}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
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
                        Online: 48.711 / 1.503 = 32.404513
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        Dense softmax reference = 32.404513
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
