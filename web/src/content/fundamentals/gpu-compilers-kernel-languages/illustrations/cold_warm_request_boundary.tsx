import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 920
export const height = 490
export const alt =
    'A log10-scale horizontal latency bar chart spanning 1 microsecond to 1 second compares four GPU kernel execution paths: cold PTX or Triton JIT compilation takes roughly 300 ms (300,000 us), cold compatible cubin lazy loading takes roughly 15 ms (15,000 us), warm cache-hit kernel launch takes roughly 40 us, and CUDA Graph replay takes roughly 12 us. A dimension bracket highlights the 7,500x to 25,000x latency gap between cold JIT compilation and steady-state warm execution.'

const illustration = defineIllustration((c) => {
    const red = getReadableToneColor('red', c)
    const purple = getReadableToneColor('purple', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)

    // Log10 domain: 1 us (10^0) to 1 s (10^6 us) -> 6 decades across x = [242, 872] (width 630px -> 105px/decade)
    const plotLeft = 242
    const plotW = 630
    const xOfUs = (us: number) => plotLeft + (Math.log10(us) / 6) * plotW

    const bars = [
        {
            title: 'Cold PTX / Triton JIT',
            sub: 'Compile + cache write + launch',
            us: 300_000,
            label: '~300 ms',
            color: red,
            fill: withColorAlpha(red, 0.25),
            y: 112,
        },
        {
            title: 'Cold Compatible Cubin',
            sub: 'Lazy module load (skips JIT)',
            us: 15_000,
            label: '~15 ms',
            color: purple,
            fill: withColorAlpha(purple, 0.25),
            y: 192,
        },
        {
            title: 'Warm Cache Hit',
            sub: 'Compiled cubin, steady state',
            us: 40,
            label: '~40 µs',
            color: blue,
            fill: withColorAlpha(blue, 0.25),
            y: 294,
        },
        {
            title: 'CUDA Graph Replay',
            sub: 'Pre-captured launch dispatch',
            us: 12,
            label: '~12 µs',
            color: green,
            fill: withColorAlpha(green, 0.25),
            y: 374,
        },
    ]

    const decades = [
        { exp: 0, label: '1 µs' },
        { exp: 1, label: '10 µs' },
        { exp: 2, label: '100 µs' },
        { exp: 3, label: '1 ms' },
        { exp: 4, label: '10 ms' },
        { exp: 5, label: '100 ms' },
        { exp: 6, label: '1 s' },
    ]

    const barH = 46
    const xWarm = xOfUs(40)
    const xCold = xOfUs(300_000)
    const dividerY = 264

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Outer card */}
                        <rect
                            x={16}
                            y={14}
                            width={888}
                            height={462}
                            rx={14}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />

                        {/* Plot area subtle surface */}
                        <rect
                            x={plotLeft}
                            y={96}
                            width={plotW}
                            height={340}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={c.border}
                            strokeWidth={1}
                        />

                        {/* Major decade gridlines + subtle minor log ticks (2x, 5x) */}
                        {decades.map((d) => {
                            const gx = plotLeft + (d.exp / 6) * plotW
                            return (
                                <g key={`dec-${d.exp}`}>
                                    <line
                                        x1={gx}
                                        y1={96}
                                        x2={gx}
                                        y2={436}
                                        stroke={c.borderLight}
                                        strokeWidth={d.exp === 3 ? 1.5 : 1}
                                        strokeDasharray={d.exp === 0 || d.exp === 6 ? undefined : '4 4'}
                                    />
                                    {d.exp < 6 &&
                                        [2, 5].map((m) => {
                                            const mx = plotLeft + ((d.exp + Math.log10(m)) / 6) * plotW
                                            return (
                                                <line
                                                    key={`min-${d.exp}-${m}`}
                                                    x1={mx}
                                                    y1={96}
                                                    x2={mx}
                                                    y2={436}
                                                    stroke={c.border}
                                                    strokeWidth={0.75}
                                                    opacity={0.45}
                                                />
                                            )
                                        })}
                                </g>
                            )
                        })}

                        {/* Cold vs Warm horizontal separator */}
                        <line
                            x1={32}
                            y1={dividerY}
                            x2={884}
                            y2={dividerY}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                            strokeDasharray="6 4"
                        />

                        {/* Latency bars */}
                        {bars.map((b, i) => {
                            const bw = Math.max(8, xOfUs(b.us) - plotLeft)
                            return (
                                <rect
                                    key={`lbar-${i}`}
                                    x={plotLeft}
                                    y={b.y}
                                    width={bw}
                                    height={barH}
                                    rx={7}
                                    fill={b.fill}
                                    stroke={b.color}
                                    strokeWidth={2.5}
                                />
                            )
                        })}

                        {/* 7,500x-25,000x gap bracket between Warm (40 us) and Cold JIT (300 ms) */}
                        <line
                            x1={xWarm}
                            y1={317}
                            x2={xCold}
                            y2={317}
                            stroke={red}
                            strokeWidth={2}
                            strokeDasharray="5 4"
                        />
                        <line x1={xCold} y1={160} x2={xCold} y2={324} stroke={red} strokeWidth={1.5} strokeDasharray="3 3" />
                        <polygon points={`${xWarm + 6},317 ${xWarm + 15},312 ${xWarm + 15},322`} fill={red} />
                        <polygon points={`${xCold - 2},317 ${xCold - 11},312 ${xCold - 11},322`} fill={red} />
                    </svg>
                </CanvasItem>

                {/* Header */}
                <CanvasItem x={34} y={24} width={852} height={26}>
                    <TextLabel
                        c={c}
                        text="Cold Compilation vs Warm Kernel Latency (log₁₀ scale)"
                        fontSize={19}
                        fontWeight={800}
                        color={c.textPrimary}
                    />
                </CanvasItem>
                <CanvasItem x={34} y={50} width={852} height={20}>
                    <TextLabel
                        c={c}
                        text="Warmup moves millisecond JIT & lazy loads off the request path; steady-state dispatch runs in microseconds"
                        fontSize={13}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Top log10 axis labels */}
                {decades.map((d) => {
                    const gx = plotLeft + (d.exp / 6) * plotW
                    return (
                        <CanvasItem key={`dlbl-${d.exp}`} x={gx - 30} y={76} width={60} height={18}>
                            <TextLabel
                                c={c}
                                text={d.label}
                                fontSize={12}
                                fontWeight={d.exp === 3 ? 800 : 600}
                                mono
                                color={d.exp === 3 ? c.textPrimary : c.textMuted}
                                align="center"
                            />
                        </CanvasItem>
                    )
                })}

                {/* Zone tags */}
                <CanvasItem x={34} y={80} width={196} height={20}>
                    <TextLabel c={c} text="COLD STARTUP (ms)" fontSize={12} fontWeight={800} color={red} />
                </CanvasItem>
                <CanvasItem x={34} y={270} width={196} height={20}>
                    <TextLabel c={c} text="WARM WINDOW (µs)" fontSize={12} fontWeight={800} color={green} />
                </CanvasItem>

                {/* Bar row labels & values */}
                {bars.map((b, i) => {
                    const endX = xOfUs(b.us)
                    const putInside = endX - plotLeft > 120
                    return (
                        <React.Fragment key={`blbl-${i}`}>
                            <CanvasItem x={34} y={b.y + 4} width={200} height={22}>
                                <TextLabel
                                    c={c}
                                    text={b.title}
                                    fontSize={15}
                                    fontWeight={800}
                                    color={b.color}
                                />
                            </CanvasItem>
                            <CanvasItem x={34} y={b.y + 26} width={200} height={18}>
                                <TextLabel c={c} text={b.sub} fontSize={12} color={c.textSecondary} />
                            </CanvasItem>

                            <CanvasItem
                                x={putInside ? endX - 96 : endX + 10}
                                y={b.y + 13}
                                width={88}
                                height={22}
                            >
                                <TextLabel
                                    c={c}
                                    text={b.label}
                                    fontSize={15}
                                    fontWeight={800}
                                    mono
                                    color={b.color}
                                    align={putInside ? 'right' : 'left'}
                                />
                            </CanvasItem>
                        </React.Fragment>
                    )
                })}

                {/* Gap annotation */}
                <CanvasItem x={500} y={288} width={310} height={24}>
                    <TextLabel
                        c={c}
                        text="~7,500× – 25,000× latency gap"
                        fontSize={15}
                        fontWeight={800}
                        color={red}
                        align="center"
                    />
                </CanvasItem>
                <CanvasItem x={500} y={324} width={310} height={20}>
                    <TextLabel
                        c={c}
                        text="4+ orders of magnitude · warm before timing"
                        fontSize={12}
                        fontWeight={600}
                        color={c.textSecondary}
                        align="center"
                    />
                </CanvasItem>

                {/* Bottom axis label */}
                <CanvasItem x={242} y={444} width={630} height={20}>
                    <TextLabel
                        c={c}
                        text="Wall-clock request latency (logarithmic scale, µs -> ms -> s)"
                        fontSize={13}
                        fontWeight={600}
                        color={c.textMuted}
                        align="center"
                    />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
