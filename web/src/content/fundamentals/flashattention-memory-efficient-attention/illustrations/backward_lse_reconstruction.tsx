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
    'The materializing backward path saves and rereads one 32 GiB FP16 probability matrix, 64 GiB total logical transfers; FlashAttention saves an 8 MiB FP32 LSE row vector and reconstructs local tiles. For the article’s seeded CPU check, query row 1 and key 0 have score S_10 = -0.385025137 and LSE L_1 = 2.434266205, giving P_10 = exp(S_10 - L_1) = 0.059648198. A 5 by 7 mask shows row 0 fully masked and rows 1 through 4 admitting 4, 5, 6, and 7 keys. The reconstructed probabilities combine with dP and row correction D to form dS, which gives dQ and dK; P and dO independently give dV = P^T dO.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const red = getReadableToneColor('critical', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const fills = {
        red: getToneFill('critical', c),
        cyan: getToneFill('cyan', c),
        green: getToneFill('green', c),
        purple: getToneFill('purple', c),
        warm: getToneFill('warm', c),
    }

    const maskRows = [0, 4, 5, 6, 7]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={416}
                        height={154}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={416}
                        height={154}
                        rx={14}
                        fill={fills.red}
                        stroke={red}
                    />
                    <SvgFrame
                        c={c}
                        x={516}
                        y={66}
                        width={416}
                        height={154}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={516}
                        y={66}
                        width={416}
                        height={154}
                        rx={14}
                        fill={fills.cyan}
                        stroke={cyan}
                    />
                    <VectorArrow
                        x1={448}
                        y1={143}
                        x2={512}
                        y2={143}
                        color={c.textMuted}
                        strokeWidth={4}
                        arrowSize={6}
                    />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i}>
                            <SvgFrame
                                c={c}
                                x={534 + i * 76}
                                y={134}
                                width={66}
                                height={42}
                                rx={8}
                                fill={c.bgCard}
                                stroke={cyan}
                            />
                        </g>
                    ))}

                    <SvgFrame
                        c={c}
                        x={28}
                        y={234}
                        width={904}
                        height={156}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={purple}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={404}
                        width={400}
                        height={360}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {maskRows.map((cnt, r) =>
                        Array.from({ length: 7 }, (_, col) => (
                            <g key={`${r}-${col}`}>
                                <SvgFrame
                                    c={c}
                                    x={56 + col * 48}
                                    y={468 + r * 44}
                                    width={42}
                                    height={38}
                                    rx={6}
                                    fill={col < cnt ? fills.green : fills.red}
                                    stroke={col < cnt ? green : red}
                                />
                            </g>
                        )),
                    )}

                    <SvgFrame
                        c={c}
                        x={444}
                        y={404}
                        width={488}
                        height={360}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={464}
                        y={456}
                        width={448}
                        height={48}
                        rx={10}
                        fill={fills.cyan}
                        stroke={cyan}
                    />
                    <SvgFrame
                        c={c}
                        x={464}
                        y={516}
                        width={448}
                        height={48}
                        rx={10}
                        fill={fills.purple}
                        stroke={purple}
                    />
                    <SvgFrame
                        c={c}
                        x={464}
                        y={576}
                        width={218}
                        height={48}
                        rx={10}
                        fill={fills.purple}
                        stroke={purple}
                    />
                    <SvgFrame
                        c={c}
                        x={694}
                        y={576}
                        width={218}
                        height={48}
                        rx={10}
                        fill={fills.purple}
                        stroke={purple}
                    />
                    <SvgFrame
                        c={c}
                        x={464}
                        y={636}
                        width={448}
                        height={48}
                        rx={10}
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
                        Backward reconstructs local probability tiles
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={80} width={250} height={126}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: red,
                        }}
                    >
                        Save full P
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 32,
                            fontWeight: 800,
                            color: red,
                        }}
                    >
                        32 GiB
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textSecondary }}>
                        W+R: 64 GiB
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={312} y={96} width={116} height={116}>
                <TiledMatrix
                    c={c}
                    rows={3}
                    cols={3}
                    cellSize={28}
                    gap={4}
                    tone="red"
                    ariaLabel="Saved probability matrix P"
                />
            </CanvasItem>
            <CanvasItem x={534} y={76} width={380} height={46}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 27,
                        fontWeight: 800,
                        color: cyan,
                        whiteSpace: 'nowrap',
                    }}
                >
                    Keep Lᵢ · 8 MiB FP32
                </span>
            </CanvasItem>
            {[0, 1, 2, 3, 4].map((i) => (
                <CanvasItem key={i} x={534 + i * 76} y={134} width={66} height={42}>
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
                                fontSize: 26,
                                fontWeight: 800,
                                color: cyan,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            L{i}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            <CanvasItem x={534} y={180} width={380} height={36}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 26,
                        color: c.textSecondary,
                        whiteSpace: 'nowrap',
                    }}
                >
                    Q, K, V, O + row stats
                </span>
            </CanvasItem>

            <CanvasItem x={48} y={248} width={864} height={44}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 27,
                            fontWeight: 800,
                            color: c.textPrimary,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Sᵢⱼ = QᵢKⱼᵀ/√d → Pᵢⱼ = exp(Sᵢⱼ − Lᵢ)
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={48} y={304} width={864} height={70}>
                <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 27,
                            fontWeight: 750,
                            color: purple,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        S₁₀ −0.385025
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 27,
                            fontWeight: 750,
                            color: cyan,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        L₁ 2.434266
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 27,
                            fontWeight: 800,
                            color: green,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        P₁₀ 0.059648
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={414} width={360} height={40}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 27,
                        fontWeight: 800,
                        color: c.textPrimary,
                        whiteSpace: 'nowrap',
                    }}
                >
                    5×7 CAUSAL MASK
                </span>
            </CanvasItem>
            {maskRows.map((cnt, r) =>
                Array.from({ length: 7 }, (_, col) => (
                    <CanvasItem
                        key={`${r}-${col}`}
                        x={56 + col * 48}
                        y={468 + r * 44}
                        width={42}
                        height={38}
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
                                    color: col < cnt ? green : red,
                                }}
                            >
                                {col < cnt ? '✓' : '−'}
                            </span>
                        </div>
                    </CanvasItem>
                )),
            )}
            <CanvasItem x={48} y={702} width={360} height={46}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 27,
                        fontWeight: 700,
                        color: warm,
                        whiteSpace: 'nowrap',
                    }}
                >
                    Q0 masked → zero grad
                </span>
            </CanvasItem>

            <CanvasItem x={464} y={414} width={448} height={36}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 27,
                        fontWeight: 800,
                        color: c.textPrimary,
                        whiteSpace: 'nowrap',
                    }}
                >
                    GRADIENT PATHS
                </span>
            </CanvasItem>
            <CanvasItem x={464} y={456} width={448} height={48}>
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
                            fontSize: 27,
                            fontWeight: 800,
                            color: cyan,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        dP = dO · Vᵀ
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={464} y={516} width={448} height={48}>
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
                            fontSize: 27,
                            fontWeight: 800,
                            color: purple,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        dS = P ⊙ (dP − D)
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={464} y={576} width={218} height={48}>
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
                            fontSize: 25,
                            fontWeight: 800,
                            color: purple,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        dQ=dSK/√d
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={694} y={576} width={218} height={48}>
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
                            fontSize: 25,
                            fontWeight: 800,
                            color: purple,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        dK=dSᵀQ/√d
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={464} y={636} width={448} height={48}>
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
                            fontSize: 27,
                            fontWeight: 800,
                            color: green,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        dV = Pᵀ · dO
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={464} y={702} width={448} height={46}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 27,
                        fontWeight: 750,
                        color: warm,
                        whiteSpace: 'nowrap',
                    }}
                >
                    Dᵢ = dOᵢ · Oᵢ (row dot)
                </span>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
