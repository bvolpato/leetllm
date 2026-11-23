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
    'One illustrative gamma-four cycle drafts x1 through x4. A target pass scores p1 through p5 together, while acceptance decisions inspect x1, x2, x3, then reject x4. The residual sample x4-prime replaces the rejection, so this cycle emits four tokens. Separately, iid alpha 0.8 with draft cost 0.1 and verify cost 1T gives expected 3.3616 tokens per 1.4T cycle and a 2.40x rate ratio; other assumed costs give 1.40x or 0.89x.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const draft = getReadableToneColor('purple', c, c.bg)
    const verify = getReadableToneColor('blue', c, c.bg)
    const accept = getReadableToneColor('green', c, c.bg)
    const reject = getReadableToneColor('critical', c, c.bg)
    const draftFill = getToneFill('purple', c)
    const verifyFill = getToneFill('blue', c)
    const acceptFill = getToneFill('green', c)
    const rejectFill = getToneFill('critical', c)

    const colXs = [212, 366, 520, 674]
    const boxW = 122
    const rows = [
        {
            input: 'α=.80 · c=.10 · v=1T',
            expected: '3.3616',
            cost: '1.40T',
            ratio: '2.40×',
            ok: true,
        },
        {
            input: 'α=.80 · c=.10 · v=2T',
            expected: '3.3616',
            cost: '2.40T',
            ratio: '1.40×',
            ok: true,
        },
        {
            input: 'α=.30 · c=.15 · v=1T',
            expected: '1.4251',
            cost: '1.60T',
            ratio: '0.89×',
            ok: false,
        },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {colXs.map((x, i) => (
                        <React.Fragment key={i}>
                            <SvgFrame
                                c={c}
                                x={x}
                                y={84}
                                width={boxW}
                                height={50}
                                rx={6}
                                fill={draftFill}
                                stroke={draft}
                            />
                            <SvgFrame
                                c={c}
                                x={x}
                                y={262}
                                width={boxW}
                                height={50}
                                rx={6}
                                fill={i === 3 ? rejectFill : acceptFill}
                                stroke={i === 3 ? reject : accept}
                            />
                            <SvgFrame
                                c={c}
                                x={x}
                                y={352}
                                width={boxW}
                                height={50}
                                rx={6}
                                fill={i === 3 ? acceptFill : draftFill}
                                stroke={i === 3 ? accept : draft}
                            />
                            <VectorArrow
                                x1={x + boxW / 2}
                                y1={134}
                                x2={x + boxW / 2}
                                y2={170}
                                color={c.textSecondary}
                                strokeWidth={3}
                                arrowSize={6}
                            />
                            <VectorArrow
                                x1={x + boxW / 2}
                                y1={312}
                                x2={x + boxW / 2}
                                y2={350}
                                color={i === 3 ? reject : accept}
                                strokeWidth={3}
                                arrowSize={6}
                            />
                        </React.Fragment>
                    ))}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <SvgFrame
                            key={i}
                            c={c}
                            x={212 + i * 144}
                            y={172}
                            width={120}
                            height={48}
                            rx={6}
                            fill={verifyFill}
                            stroke={verify}
                        />
                    ))}
                    <VectorSegment
                        x1={28}
                        y1={466}
                        x2={width - 28}
                        y2={466}
                        color={c.borderLight}
                        strokeWidth={2}
                        showEndDot={false}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={16} width={width - 56} height={54}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 38,
                        fontWeight: 800,
                        color: c.textPrimary,
                    }}
                >
                    One illustrative cycle · γ = 4
                </span>
            </CanvasItem>

            <CanvasItem x={28} y={88} width={170} height={46}>
                <span
                    style={{ fontFamily: c.fontSans, fontSize: 31, fontWeight: 800, color: draft }}
                >
                    Draft
                </span>
            </CanvasItem>
            <CanvasItem x={28} y={176} width={170} height={46}>
                <span
                    style={{ fontFamily: c.fontSans, fontSize: 31, fontWeight: 800, color: verify }}
                >
                    Verify (1 pass)
                </span>
            </CanvasItem>
            <CanvasItem x={28} y={266} width={170} height={46}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 31,
                        fontWeight: 800,
                        color: c.textSecondary,
                    }}
                >
                    Decision
                </span>
            </CanvasItem>
            <CanvasItem x={28} y={356} width={170} height={46}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 31,
                        fontWeight: 800,
                        color: c.textPrimary,
                    }}
                >
                    Output
                </span>
            </CanvasItem>

            {['x₁', 'x₂', 'x₃', 'x₄'].map((tok, i) => (
                <CanvasItem key={tok} x={colXs[i]} y={84} width={boxW} height={50}>
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
                                fontSize: 33,
                                fontWeight: 800,
                                color: draft,
                            }}
                        >
                            {tok}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            {['p₁', 'p₂', 'p₃', 'p₄', 'p₅'].map((tok, i) => (
                <CanvasItem key={tok} x={212 + i * 144} y={172} width={120} height={48}>
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
                                fontSize: 32,
                                fontWeight: 800,
                                color: verify,
                            }}
                        >
                            {tok}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            {['✓', '✓', '✓', '×'].map((d, i) => (
                <CanvasItem key={i} x={colXs[i]} y={262} width={boxW} height={50}>
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
                                fontSize: 34,
                                fontWeight: 800,
                                color: i === 3 ? reject : accept,
                            }}
                        >
                            {d}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            {['x₁', 'x₂', 'x₃', 'x₄′'].map((tok, i) => (
                <CanvasItem key={tok} x={colXs[i]} y={352} width={boxW} height={50}>
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
                                fontSize: 33,
                                fontWeight: 800,
                                color: i === 3 ? accept : draft,
                            }}
                        >
                            {tok}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={28} y={418} width={width - 56} height={40}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 600,
                        color: c.textSecondary,
                    }}
                >
                    Rejecting x₄ samples x₄′; p₅ bonus is unused.
                </span>
            </CanvasItem>

            <CanvasItem x={28} y={482} width={width - 56} height={278}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: c.bgCard,
                        border: `2px solid ${c.borderLight}`,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Expected cycle: E[N] = Σᵢ₌₀⁴ αⁱ, rate = E[N] / (4c + v)
                    </span>
                    <div
                        style={{
                            display: 'flex',
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        <span style={{ width: 410 }}>Assumed α, c, v</span>
                        <span style={{ width: 160, textAlign: 'center' }}>Tokens</span>
                        <span style={{ width: 160, textAlign: 'center' }}>Cost</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>Speedup</span>
                    </div>
                    {rows.map((r) => (
                        <div
                            key={r.input}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontFamily: c.fontSans,
                                fontSize: 31,
                                fontWeight: 750,
                            }}
                        >
                            <span style={{ width: 410, color: r.ok ? c.textPrimary : reject }}>
                                {r.input}
                            </span>
                            <span style={{ width: 160, textAlign: 'center', color: c.textPrimary }}>
                                {r.expected}
                            </span>
                            <span style={{ width: 160, textAlign: 'center', color: c.textPrimary }}>
                                {r.cost}
                            </span>
                            <span
                                style={{
                                    flex: 1,
                                    textAlign: 'right',
                                    color: r.ok ? accept : reject,
                                    fontWeight: 850,
                                }}
                            >
                                {r.ratio}
                            </span>
                        </div>
                    ))}
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
