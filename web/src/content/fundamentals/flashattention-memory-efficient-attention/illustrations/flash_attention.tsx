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
export const height = 760
export const alt =
    'A 3 by 3 causal stencil contains 9 allocated score slots and 6 valid pairs. For a separate batch 8, 32-head, 8,192-token example, one full FP16 score or probability array is 32 GiB. Four directional transfers total 128 GiB of logical intermediates. The tiled path keeps Q and row state on chip, streams K/V tiles in, discards temporary score and probability tiles, and writes O plus an 8 MiB FP32 LSE array.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const red = getReadableToneColor('critical', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const fills = {
        red: getToneFill('critical', c),
        warm: getToneFill('warm', c),
        blue: getToneFill('blue', c),
        green: getToneFill('green', c),
        purple: getToneFill('purple', c),
    }
    const transfers = [
        { label: 'S write 32G', dir: 'right', y: 274, tone: red },
        { label: 'S read 32G', dir: 'left', y: 318, tone: red },
        { label: 'P write 32G', dir: 'right', y: 362, tone: warm },
        { label: 'P read 32G', dir: 'left', y: 406, tone: warm },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={width - 56}
                        height={110}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={190}
                        width={width - 56}
                        height={284}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={red}
                    />
                    <SvgFrame
                        c={c}
                        x={48}
                        y={258}
                        width={264}
                        height={162}
                        rx={12}
                        fill={c.bgCard}
                        stroke={red}
                    />
                    <SvgFrame
                        c={c}
                        x={680}
                        y={240}
                        width={232}
                        height={220}
                        rx={12}
                        fill={c.bgCard}
                        stroke={red}
                    />
                    {transfers.map((t) => (
                        <g key={t.label}>
                            <VectorArrow
                                x1={t.dir === 'right' ? 326 : 662}
                                y1={t.y + 18}
                                x2={t.dir === 'right' ? 662 : 326}
                                y2={t.y + 18}
                                color={t.tone}
                                strokeWidth={3}
                                arrowSize={6}
                            />
                        </g>
                    ))}

                    <SvgFrame
                        c={c}
                        x={28}
                        y={488}
                        width={width - 56}
                        height={254}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={green}
                    />
                    <SvgFrame
                        c={c}
                        x={48}
                        y={544}
                        width={472}
                        height={180}
                        rx={12}
                        fill={fills.blue}
                        stroke={blue}
                    />
                    <SvgFrame
                        c={c}
                        x={700}
                        y={544}
                        width={212}
                        height={180}
                        rx={12}
                        fill={fills.green}
                        stroke={green}
                    />
                    <VectorArrow
                        x1={686}
                        y1={598}
                        x2={532}
                        y2={598}
                        color={blue}
                        strokeWidth={4}
                        arrowSize={6}
                    />
                    <VectorArrow
                        x1={532}
                        y1={682}
                        x2={686}
                        y2={682}
                        color={green}
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
                        Keep tiles on chip; avoid HBM round trips
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={56} y={76} width={96} height={92}>
                <TiledMatrix
                    c={c}
                    rows={3}
                    cols={3}
                    cellSize={24}
                    gap={4}
                    tone="red"
                    muted={true}
                    ariaLabel="3x3 causal stencil with 6 valid slots"
                    regions={[
                        { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 1, tone: 'green' },
                        { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 2, tone: 'green' },
                        { rowStart: 2, rowEnd: 3, colStart: 0, colEnd: 3, tone: 'green' },
                    ]}
                />
            </CanvasItem>
            <CanvasItem x={166} y={82} width={740} height={76}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 800,
                            color: green,
                        }}
                    >
                        3×3 causal stencil: 9 slots, 6 valid pairs
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        B=8, H=32, N=8192 (FP16): S,P = 32 GiB each
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={202} width={width - 96} height={36}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: red,
                        }}
                    >
                        BASELINE · 128 GiB TRAFFIC
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        full n×n
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={56} y={272} width={248} height={140}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 10,
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
                        GPU COMPUTE
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        QKᵀ / √d
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        softmax → PV
                    </span>
                </div>
            </CanvasItem>
            {transfers.map((t) => (
                <CanvasItem key={t.label} x={332} y={t.y - 16} width={320} height={32}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 750,
                                color: t.tone,
                            }}
                        >
                            {t.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            <CanvasItem x={720} y={248} width={160} height={34}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: red,
                        }}
                    >
                        HBM
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={732} y={288} width={132} height={126}>
                <TiledMatrix
                    c={c}
                    rows={6}
                    cols={6}
                    cellSize={17}
                    gap={3}
                    tone="red"
                    ariaLabel="Full n by n matrix in HBM"
                    regions={[{ rowStart: 1, rowEnd: 3, colStart: 1, colEnd: 4, tone: 'warm' }]}
                />
            </CanvasItem>
            <CanvasItem x={688} y={418} width={216} height={36}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: red,
                        }}
                    >
                        32 GiB S,P
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={498} width={width - 96} height={36}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: green,
                        }}
                    >
                        FLASHATTENTION · ON-CHIP
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: purple,
                        }}
                    >
                        LSE 8 MiB
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={62} y={556} width={444} height={158}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: blue,
                        }}
                    >
                        ON-CHIP SRAM
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: c.textPrimary }}>
                        Qᵢ pinned · mᵢ, ℓᵢ, Nᵢ
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: warm }}>
                        Sᵢⱼ → Pᵢⱼ → PV
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Discard S/P tiles
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={524} y={554} width={170} height={36}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: blue,
                        }}
                    >
                        Kⱼ, Vⱼ
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={524} y={638} width={170} height={36}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: green,
                        }}
                    >
                        O + LSE
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={710} y={556} width={192} height={158}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        HBM
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: blue }}>
                        K, V tiles
                    </span>
                    <span style={{ fontFamily: c.fontMono, fontSize: 30, color: green }}>
                        O + 8 MiB
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
