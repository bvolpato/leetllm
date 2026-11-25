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
export const height = 560
export const alt =
    'Top number line shows IEEE-754 float32 spacing near 1e8, where ULP(1e8) = 8.0 and the rounding midpoint sits at 1e8 + 4.0. Adding 1.0 lands at 1e8 + 1.0, inside the snap-back zone, so it rounds back to 1e8 and loses 1.0 completely. Bottom left reduction tree evaluates (1e8 + 1.0) + (-1e8) = 0.0 (100% error). Bottom right tree evaluates (1e8 + -1e8) + 1.0 = 1.0 (exact), illustrating why pairwise or Kahan grouping preserves small terms.'

const illustration = defineIllustration((c) => {
    const red = getReadableToneColor('red', c)
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

    const panelFill = c.bgCard
    const redZone = withColorAlpha(red, 0.16)
    const greenFill = withColorAlpha(green, 0.18)
    const redFill = withColorAlpha(red, 0.18)
    const cyanFill = withColorAlpha(cyan, 0.18)
    const neutralFill = c.bgSubtle

    // Number-line geometry: domain [1e8 - 8, 1e8 + 8] mapped to x = [100, 820]
    // 16 units -> 720px => 45px per unit; 1e8 sits at x = 460
    const axisY = 148
    const xMinus8 = 100
    const xCenter = 460 // 1e8
    const xPlus1 = 505 // 1e8 + 1.0
    const xMid = 640 // 1e8 + 4.0
    const xPlus8 = 820 // 1e8 + 8.0

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Top Panel: FP32 ULP Number Line */}
                        <rect
                            x={16}
                            y={12}
                            width={888}
                            height={216}
                            rx={14}
                            fill={panelFill}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />

                        {/* Shaded snap-back zone [1e8, 1e8 + 4.0] */}
                        <rect
                            x={xCenter}
                            y={114}
                            width={xMid - xCenter}
                            height={68}
                            rx={6}
                            fill={redZone}
                        />

                        {/* Main horizontal number line */}
                        <line
                            x1={70}
                            y1={axisY}
                            x2={850}
                            y2={axisY}
                            stroke={c.borderLight}
                            strokeWidth={3}
                        />

                        {/* ULP = 8.0 dimension bracket between 1e8 and 1e8 + 8 */}
                        <line x1={xCenter} y1={196} x2={xPlus8} y2={196} stroke={blue} strokeWidth={2} />
                        <line x1={xCenter} y1={190} x2={xCenter} y2={202} stroke={blue} strokeWidth={2} />
                        <line x1={xPlus8} y1={190} x2={xPlus8} y2={202} stroke={blue} strokeWidth={2} />

                        {/* Midpoint dashed line at 1e8 + 4.0 */}
                        <line
                            x1={xMid}
                            y1={96}
                            x2={xMid}
                            y2={184}
                            stroke={warm}
                            strokeWidth={2}
                            strokeDasharray="5 4"
                        />

                        {/* Major FP32 representable ticks */}
                        {[xMinus8, xCenter, xPlus8].map((tx, idx) => (
                            <g key={`tick-${idx}`}>
                                <line
                                    x1={tx}
                                    y1={axisY - 14}
                                    x2={tx}
                                    y2={axisY + 14}
                                    stroke={idx === 1 ? blue : c.textSecondary}
                                    strokeWidth={idx === 1 ? 3.5 : 2.5}
                                />
                                <circle
                                    cx={tx}
                                    cy={axisY}
                                    r={idx === 1 ? 8 : 6}
                                    fill={idx === 1 ? blue : c.textSecondary}
                                />
                            </g>
                        ))}

                        {/* Exact sum dot at 1e8 + 1.0 */}
                        <circle
                            cx={xPlus1}
                            cy={axisY}
                            r={7}
                            fill={red}
                            stroke={panelFill}
                            strokeWidth={2}
                        />

                        {/* Curved snap-back arrow from 1e8 + 1.0 back to 1e8 */}
                        <path
                            d={`M ${xPlus1} ${axisY - 10} C ${xPlus1} ${axisY - 46}, ${xCenter + 4} ${axisY - 46}, ${xCenter + 4} ${axisY - 14}`}
                            fill="none"
                            stroke={red}
                            strokeWidth={2.5}
                        />
                        <polygon
                            points={`${xCenter + 4},${axisY - 9} ${xCenter - 2},${axisY - 19} ${xCenter + 10},${axisY - 19}`}
                            fill={red}
                        />

                        {/* Bottom Left Panel: Sequential Reduction Tree (Fails) */}
                        <rect
                            x={16}
                            y={244}
                            width={434}
                            height={302}
                            rx={14}
                            fill={panelFill}
                            stroke={red}
                            strokeWidth={2}
                        />

                        {/* Left tree edges */}
                        {/* Leaves: (96, 336), (222, 336), (366, 336) */}
                        {/* Mid node: (159, 418) */}
                        {/* Root node: (262, 496) */}
                        <line x1={96} y1={356} x2={159} y2={398} stroke={red} strokeWidth={2.5} />
                        <line x1={222} y1={356} x2={159} y2={398} stroke={red} strokeWidth={2.5} />
                        <line x1={159} y1={440} x2={262} y2={476} stroke={red} strokeWidth={2.5} />
                        <line x1={366} y1={356} x2={262} y2={476} stroke={c.borderLight} strokeWidth={2.5} />

                        {/* Left tree leaf boxes */}
                        {[
                            { cx: 96, fill: neutralFill, stroke: blue },
                            { cx: 222, fill: neutralFill, stroke: warm },
                            { cx: 366, fill: neutralFill, stroke: blue },
                        ].map((n, i) => (
                            <rect
                                key={`lt-leaf-${i}`}
                                x={n.cx - 44}
                                y={316}
                                width={88}
                                height={40}
                                rx={8}
                                fill={n.fill}
                                stroke={n.stroke}
                                strokeWidth={2}
                            />
                        ))}
                        {/* Left mid node: 1e8 (rounded!) */}
                        <rect
                            x={101}
                            y={398}
                            width={116}
                            height={42}
                            rx={9}
                            fill={redFill}
                            stroke={red}
                            strokeWidth={2}
                        />
                        {/* Left root node: 0.0 */}
                        <rect
                            x={196}
                            y={476}
                            width={132}
                            height={44}
                            rx={10}
                            fill={redFill}
                            stroke={red}
                            strokeWidth={2.5}
                        />

                        {/* Bottom Right Panel: Pairwise / Kahan Reduction Tree (Exact) */}
                        <rect
                            x={470}
                            y={244}
                            width={434}
                            height={302}
                            rx={14}
                            fill={panelFill}
                            stroke={green}
                            strokeWidth={2}
                        />

                        {/* Right tree edges */}
                        {/* Leaves: (550, 336), (676, 336), (820, 336) */}
                        {/* Mid node: (613, 418) */}
                        {/* Root node: (716, 496) */}
                        <line x1={550} y1={356} x2={613} y2={398} stroke={cyan} strokeWidth={2.5} />
                        <line x1={676} y1={356} x2={613} y2={398} stroke={cyan} strokeWidth={2.5} />
                        <line x1={613} y1={440} x2={716} y2={476} stroke={green} strokeWidth={2.5} />
                        <line x1={820} y1={356} x2={716} y2={476} stroke={green} strokeWidth={2.5} />

                        {/* Right tree leaf boxes */}
                        {[
                            { cx: 550, fill: neutralFill, stroke: blue },
                            { cx: 676, fill: neutralFill, stroke: blue },
                            { cx: 820, fill: neutralFill, stroke: warm },
                        ].map((n, i) => (
                            <rect
                                key={`rt-leaf-${i}`}
                                x={n.cx - 44}
                                y={316}
                                width={88}
                                height={40}
                                rx={8}
                                fill={n.fill}
                                stroke={n.stroke}
                                strokeWidth={2}
                            />
                        ))}
                        {/* Right mid node: 0.0 (cancels cleanly) */}
                        <rect
                            x={555}
                            y={398}
                            width={116}
                            height={42}
                            rx={9}
                            fill={cyanFill}
                            stroke={cyan}
                            strokeWidth={2}
                        />
                        {/* Right root node: 1.0 (exact) */}
                        <rect
                            x={650}
                            y={476}
                            width={132}
                            height={44}
                            rx={10}
                            fill={greenFill}
                            stroke={green}
                            strokeWidth={2.5}
                        />
                    </svg>
                </CanvasItem>

                {/* Top panel title */}
                <CanvasItem x={34} y={22} width={852} height={26}>
                    <TextLabel
                        c={c}
                        text="FP32 Representable Grid Near 1e8 · ULP(1e8) = 8.0"
                        fontSize={19}
                        fontWeight={800}
                        color={c.textPrimary}
                    />
                </CanvasItem>
                <CanvasItem x={34} y={48} width={852} height={22}>
                    <TextLabel
                        c={c}
                        text="Any step smaller than half an ULP (4.0) rounds right back onto 1e8"
                        fontSize={14}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Snap-back annotation */}
                <CanvasItem x={286} y={76} width={272} height={24}>
                    <TextLabel
                        c={c}
                        text="1.0 < 4.0 -> snaps back to 1e8"
                        fontSize={14}
                        fontWeight={700}
                        color={red}
                        align="right"
                    />
                </CanvasItem>
                <CanvasItem x={574} y={76} width={144} height={22}>
                    <TextLabel
                        c={c}
                        text="midpoint (+4.0)"
                        fontSize={13}
                        fontWeight={700}
                        color={warm}
                        align="center"
                    />
                </CanvasItem>
                <CanvasItem x={464} y={118} width={172} height={20}>
                    <TextLabel
                        c={c}
                        text="rounds to 1e8"
                        fontSize={12}
                        fontWeight={700}
                        color={red}
                        align="center"
                    />
                </CanvasItem>

                {/* Number-line tick labels */}
                <CanvasItem x={48} y={165} width={104} height={22}>
                    <TextLabel c={c} text="1e8 − 8" fontSize={14} mono color={c.textSecondary} align="center" />
                </CanvasItem>
                <CanvasItem x={410} y={165} width={100} height={22}>
                    <TextLabel c={c} text="1e8" fontSize={15} fontWeight={800} mono color={blue} align="center" />
                </CanvasItem>
                <CanvasItem x={468} y={165} width={96} height={22}>
                    <TextLabel c={c} text="1e8 + 1" fontSize={13} fontWeight={700} mono color={red} align="center" />
                </CanvasItem>
                <CanvasItem x={768} y={165} width={104} height={22}>
                    <TextLabel c={c} text="1e8 + 8" fontSize={14} mono color={c.textSecondary} align="center" />
                </CanvasItem>
                <CanvasItem x={560} y={200} width={160} height={20}>
                    <TextLabel c={c} text="ULP(1e8) = 8.0" fontSize={13} fontWeight={700} mono color={blue} align="center" />
                </CanvasItem>

                {/* Left tree header & node labels */}
                <CanvasItem x={34} y={256} width={398} height={24}>
                    <TextLabel
                        c={c}
                        text="Left-to-Right Grouping: (1e8 + 1.0) − 1e8"
                        fontSize={17}
                        fontWeight={800}
                        color={red}
                    />
                </CanvasItem>
                <CanvasItem x={34} y={280} width={398} height={20}>
                    <TextLabel
                        c={c}
                        text="Small term absorbed before large terms cancel"
                        fontSize={13}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                <CanvasItem x={52} y={325} width={88} height={24}>
                    <TextLabel c={c} text="1e8" fontSize={16} fontWeight={800} mono color={blue} align="center" />
                </CanvasItem>
                <CanvasItem x={178} y={325} width={88} height={24}>
                    <TextLabel c={c} text="+1.0" fontSize={16} fontWeight={800} mono color={warm} align="center" />
                </CanvasItem>
                <CanvasItem x={322} y={325} width={88} height={24}>
                    <TextLabel c={c} text="−1e8" fontSize={16} fontWeight={800} mono color={blue} align="center" />
                </CanvasItem>

                <CanvasItem x={101} y={401} width={116} height={20}>
                    <TextLabel c={c} text="1e8" fontSize={16} fontWeight={800} mono color={red} align="center" />
                </CanvasItem>
                <CanvasItem x={101} y={420} width={116} height={18}>
                    <TextLabel c={c} text="+1.0 dropped" fontSize={11} fontWeight={700} color={red} align="center" />
                </CanvasItem>

                <CanvasItem x={196} y={481} width={132} height={20}>
                    <TextLabel c={c} text="0.0" fontSize={18} fontWeight={800} mono color={red} align="center" />
                </CanvasItem>
                <CanvasItem x={196} y={501} width={132} height={18}>
                    <TextLabel c={c} text="100% error" fontSize={11} fontWeight={700} color={red} align="center" />
                </CanvasItem>

                {/* Right tree header & node labels */}
                <CanvasItem x={488} y={256} width={398} height={24}>
                    <TextLabel
                        c={c}
                        text="Pairwise / Kahan Grouping: (1e8 − 1e8) + 1.0"
                        fontSize={17}
                        fontWeight={800}
                        color={green}
                    />
                </CanvasItem>
                <CanvasItem x={488} y={280} width={398} height={20}>
                    <TextLabel
                        c={c}
                        text="Large terms cancel first; compensated sum keeps 1.0"
                        fontSize={13}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                <CanvasItem x={506} y={325} width={88} height={24}>
                    <TextLabel c={c} text="1e8" fontSize={16} fontWeight={800} mono color={blue} align="center" />
                </CanvasItem>
                <CanvasItem x={632} y={325} width={88} height={24}>
                    <TextLabel c={c} text="−1e8" fontSize={16} fontWeight={800} mono color={blue} align="center" />
                </CanvasItem>
                <CanvasItem x={776} y={325} width={88} height={24}>
                    <TextLabel c={c} text="+1.0" fontSize={16} fontWeight={800} mono color={warm} align="center" />
                </CanvasItem>

                <CanvasItem x={555} y={401} width={116} height={20}>
                    <TextLabel c={c} text="0.0" fontSize={16} fontWeight={800} mono color={cyan} align="center" />
                </CanvasItem>
                <CanvasItem x={555} y={420} width={116} height={18}>
                    <TextLabel c={c} text="cancels cleanly" fontSize={11} fontWeight={700} color={cyan} align="center" />
                </CanvasItem>

                <CanvasItem x={650} y={481} width={132} height={20}>
                    <TextLabel c={c} text="1.0" fontSize={18} fontWeight={800} mono color={green} align="center" />
                </CanvasItem>
                <CanvasItem x={650} y={501} width={132} height={18}>
                    <TextLabel c={c} text="exact sum" fontSize={11} fontWeight={700} color={green} align="center" />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
