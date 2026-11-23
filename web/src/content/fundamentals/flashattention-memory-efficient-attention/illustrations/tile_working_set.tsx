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
export const height = 780
export const alt =
    'A three-level memory map separates host CPU DRAM, H100 SXM GPU HBM, and SM-local shared memory and registers. Host transfers use a separate system link. HBM holds Q, K, V, output, weights, and activations; H100 SXM lists 80 GB HBM and 3.35 TB per second rated bandwidth. Arrows show input tiles entering SMs and output plus row statistics returning to HBM. Each SM has 228 KiB shared memory, at most 227 KiB per block, and a separate 256 KiB register file; shared memory shares physical capacity with L1, and launch settings and resident blocks affect budgets. A proportional band shows an illustrative logical set: Q, K, and V are 16 KiB each, output is 32 KiB, and one FP32 score tile is 64 KiB, for 144 KiB total. The kernels distribute and reuse these arrays across resource pools.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const fills = {
        purple: getToneFill('purple', c),
        blue: getToneFill('blue', c),
        cyan: getToneFill('cyan', c),
        warm: getToneFill('warm', c),
        green: getToneFill('green', c),
    }

    const totalW = 864
    const segs = [
        { key: 'Q 16K', w: Math.round((16 / 144) * totalW), tone: blue, fill: fills.blue },
        { key: 'K 16K', w: Math.round((16 / 144) * totalW), tone: blue, fill: fills.blue },
        { key: 'V 16K', w: Math.round((16 / 144) * totalW), tone: blue, fill: fills.blue },
        { key: 'O 32K', w: Math.round((32 / 144) * totalW), tone: green, fill: fills.green },
        {
            key: 'S FP32 · 64 KiB',
            w: totalW - Math.round((80 / 144) * totalW),
            tone: warm,
            fill: fills.warm,
        },
    ]
    let curX = 48
    const placedSegs = segs.map((s) => {
        const out = { ...s, x: curX }
        curX += s.w
        return out
    })

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={904}
                        height={92}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={904}
                        height={92}
                        rx={14}
                        fill={fills.purple}
                        stroke={purple}
                    />
                    <VectorArrow
                        x1={280}
                        y1={160}
                        x2={280}
                        y2={208}
                        color={purple}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={320}
                        y1={208}
                        x2={320}
                        y2={160}
                        color={purple}
                        strokeWidth={3}
                        arrowSize={5}
                    />

                    <SvgFrame
                        c={c}
                        x={28}
                        y={212}
                        width={904}
                        height={116}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={212}
                        width={904}
                        height={116}
                        rx={14}
                        fill={fills.blue}
                        stroke={blue}
                    />
                    <VectorArrow
                        x1={280}
                        y1={330}
                        x2={280}
                        y2={378}
                        color={blue}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={320}
                        y1={378}
                        x2={320}
                        y2={330}
                        color={green}
                        strokeWidth={3}
                        arrowSize={5}
                    />

                    <SvgFrame
                        c={c}
                        x={28}
                        y={382}
                        width={442}
                        height={166}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={382}
                        width={442}
                        height={166}
                        rx={14}
                        fill={fills.cyan}
                        stroke={cyan}
                    />
                    <SvgFrame
                        c={c}
                        x={490}
                        y={382}
                        width={442}
                        height={166}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke="none"
                    />
                    <SvgFrame
                        c={c}
                        x={490}
                        y={382}
                        width={442}
                        height={166}
                        rx={14}
                        fill={fills.warm}
                        stroke={warm}
                    />

                    <SvgFrame
                        c={c}
                        x={28}
                        y={564}
                        width={904}
                        height={198}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    {placedSegs.map((s) => (
                        <g key={s.key}>
                            <SvgFrame
                                c={c}
                                x={s.x}
                                y={626}
                                width={s.w}
                                height={54}
                                rx={6}
                                fill={s.fill}
                                stroke={s.tone}
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
                        GPU memory hierarchy and a 144 KiB working set
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={76} width={864} height={72}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: purple,
                        }}
                    >
                        HOST · CPU DRAM
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Host inputs and offloaded model state
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={346} y={168} width={580} height={34}>
                <span style={{ fontFamily: c.fontSans, fontSize: 30, color: purple }}>
                    Separate host-to-GPU system link
                </span>
            </CanvasItem>

            <CanvasItem x={48} y={222} width={864} height={96}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                    >
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 800,
                                color: blue,
                            }}
                        >
                            HBM · H100 SXM
                        </span>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 800,
                                color: c.textPrimary,
                            }}
                        >
                            80 GB · 3.35 TB/s
                        </span>
                    </div>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Holds Q, K, V, O, weights, and activations
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={346} y={338} width={580} height={34}>
                <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textPrimary }}>
                    Q/K/V tiles in; O + row stats out
                </span>
            </CanvasItem>

            <CanvasItem x={48} y={394} width={402} height={144}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: cyan,
                        }}
                    >
                        SHARED MEMORY
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        228 KiB/SM (227 max)
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Shares capacity with L1
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={510} y={394} width={402} height={144}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: warm,
                        }}
                    >
                        REGISTERS
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        256 KiB / SM
                    </span>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Separate per-SM pool
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={576} width={864} height={36}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 750,
                        color: c.textPrimary,
                    }}
                >
                    WORKING SET: QKV 48 + O 32 + S 64 = 144 KiB
                </span>
            </CanvasItem>
            {placedSegs.map((s) => (
                <CanvasItem key={s.key} x={s.x} y={626} width={s.w} height={54}>
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
                                color: s.tone,
                            }}
                        >
                            {s.key}
                        </span>
                    </div>
                </CanvasItem>
            ))}
            <CanvasItem x={48} y={698} width={864} height={52}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        Budgets depend on launch settings and resident blocks.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
