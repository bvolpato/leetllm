import React from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 920
export const height = 500
export const alt =
    'Left hardware residency diagram shows an ordinary launch of eight blocks on a 4-SM GPU: Blocks B0 through B3 occupy all four SM slots and stall at a grid.sync barrier waiting for Blocks B4 through B7, while B4 through B7 sit in the hardware queue waiting for a free SM slot, forming a circular deadlock. Right diagram shows a cooperative launch with eight co-resident SM slots holding B0 through B7 simultaneously so every block reaches grid.sync and resumes.'

const illustration = defineIllustration((c) => {
    const red = getReadableToneColor('red', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)

    const panelFill = c.bgCard
    const subtleFill = c.bgSubtle
    const warmFill = withColorAlpha(warm, 0.2)
    const redFill = withColorAlpha(red, 0.14)
    const blueFill = withColorAlpha(blue, 0.2)
    const greenFill = withColorAlpha(green, 0.16)
    const queueFill = withColorAlpha(c.border, 0.35)

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Left panel: Ordinary launch (4 SM slots -> deadlock) */}
                        <rect
                            x={16}
                            y={14}
                            width={434}
                            height={472}
                            rx={14}
                            fill={panelFill}
                            stroke={red}
                            strokeWidth={2}
                        />
                        {/* Top hardware container: 4 SM slots */}
                        <rect
                            x={34}
                            y={76}
                            width={398}
                            height={128}
                            rx={10}
                            fill={subtleFill}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                        {[0, 1, 2, 3].map((i) => {
                            const sx = 46 + i * 96
                            return (
                                <g key={`sm-left-${i}`}>
                                    <rect
                                        x={sx}
                                        y={104}
                                        width={86}
                                        height={68}
                                        rx={8}
                                        fill={warmFill}
                                        stroke={warm}
                                        strokeWidth={2}
                                    />
                                </g>
                            )
                        })}
                        {/* Stalled barrier line across SM0..SM3 */}
                        <line
                            x1={40}
                            y1={186}
                            x2={426}
                            y2={186}
                            stroke={red}
                            strokeWidth={3}
                            strokeDasharray="7 5"
                        />

                        {/* Circular deadlock arrows between SM slots and Queue */}
                        {/* Left arrow: B0..B3 wait on B4..B7 (down) */}
                        <path
                            d="M 162 206 L 162 282"
                            fill="none"
                            stroke={red}
                            strokeWidth={2.5}
                        />
                        <polygon points="162,290 156,279 168,279" fill={red} />

                        {/* Right arrow: B4..B7 wait for free SM slot (up, blocked by X) */}
                        <path
                            d="M 314 290 L 314 214"
                            fill="none"
                            stroke={c.textMuted}
                            strokeWidth={2.5}
                            strokeDasharray="5 4"
                        />
                        <polygon points="314,206 308,217 320,217" fill={c.textMuted} />
                        {/* Red X block symbol on the upward arrow */}
                        <circle
                            cx={314}
                            cy={248}
                            r={12}
                            fill={panelFill}
                            stroke={red}
                            strokeWidth={2}
                        />
                        <line x1={308} y1={242} x2={320} y2={254} stroke={red} strokeWidth={2.5} />
                        <line x1={320} y1={242} x2={308} y2={254} stroke={red} strokeWidth={2.5} />

                        {/* Bottom hardware container: Hardware block queue */}
                        <rect
                            x={34}
                            y={294}
                            width={398}
                            height={114}
                            rx={10}
                            fill={redFill}
                            stroke={withColorAlpha(red, 0.55)}
                            strokeWidth={1.5}
                            strokeDasharray="6 4"
                        />
                        {[4, 5, 6, 7].map((b, i) => {
                            const sx = 46 + i * 96
                            return (
                                <rect
                                    key={`q-left-${b}`}
                                    x={sx}
                                    y={326}
                                    width={86}
                                    height={64}
                                    rx={8}
                                    fill={queueFill}
                                    stroke={c.borderLight}
                                    strokeWidth={1.5}
                                />
                            )
                        })}

                        {/* Right panel: Cooperative launch (8 co-resident slots) */}
                        <rect
                            x={470}
                            y={14}
                            width={434}
                            height={472}
                            rx={14}
                            fill={panelFill}
                            stroke={green}
                            strokeWidth={2}
                        />
                        {/* Co-resident 8-slot SM grid */}
                        <rect
                            x={488}
                            y={76}
                            width={398}
                            height={196}
                            rx={10}
                            fill={subtleFill}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                            const col = i % 4
                            const row = Math.floor(i / 4)
                            const sx = 500 + col * 96
                            const sy = 104 + row * 78
                            return (
                                <rect
                                    key={`sm-right-${i}`}
                                    x={sx}
                                    y={sy}
                                    width={86}
                                    height={66}
                                    rx={8}
                                    fill={blueFill}
                                    stroke={blue}
                                    strokeWidth={2}
                                />
                            )
                        })}

                        {/* Green grid.sync() barrier line + pass-through arrows */}
                        {[0, 1, 2, 3].map((i) => {
                            const cx = 543 + i * 96
                            return (
                                <g key={`pass-${i}`}>
                                    <line
                                        x1={cx}
                                        y1={274}
                                        x2={cx}
                                        y2={342}
                                        stroke={green}
                                        strokeWidth={2.5}
                                    />
                                    <polygon
                                        points={`${cx},350 ${cx - 5},340 ${cx + 5},340`}
                                        fill={green}
                                    />
                                </g>
                            )
                        })}
                        <line
                            x1={496}
                            y1={308}
                            x2={878}
                            y2={308}
                            stroke={green}
                            strokeWidth={3}
                        />
                        {/* Clean pill backing for grid.sync() label so arrows do not cut through text */}
                        <rect
                            x={586}
                            y={294}
                            width={202}
                            height={28}
                            rx={14}
                            fill={panelFill}
                            stroke={green}
                            strokeWidth={2}
                        />

                        {/* Post-barrier resume box */}
                        <rect
                            x={488}
                            y={352}
                            width={398}
                            height={56}
                            rx={10}
                            fill={greenFill}
                            stroke={green}
                            strokeWidth={2}
                        />

                        {/* Crisp red DEADLOCK footer pill */}
                        <rect
                            x={78}
                            y={426}
                            width={310}
                            height={38}
                            rx={8}
                            fill={redFill}
                            stroke={red}
                            strokeWidth={2}
                        />
                    </svg>
                </CanvasItem>

                {/* Left header */}
                <CanvasItem x={34} y={24} width={398} height={26}>
                    <TextLabel
                        c={c}
                        text="Ordinary Launch · 4 SM Slots"
                        fontSize={19}
                        fontWeight={800}
                        color={red}
                    />
                </CanvasItem>
                <CanvasItem x={34} y={48} width={398} height={22}>
                    <TextLabel
                        c={c}
                        text="8 blocks launched, only 4 fit on hardware"
                        fontSize={14}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Left SM header */}
                <CanvasItem x={46} y={81} width={374} height={20}>
                    <TextLabel
                        c={c}
                        text="GPU SM Residency (4 / 4 FULL)"
                        fontSize={13}
                        fontWeight={700}
                        color={warm}
                    />
                </CanvasItem>
                {[0, 1, 2, 3].map((i) => (
                    <React.Fragment key={`lbl-left-${i}`}>
                        <CanvasItem x={46 + i * 96} y={110} width={86} height={20}>
                            <TextLabel
                                c={c}
                                text={`SM ${i}`}
                                fontSize={12}
                                fontWeight={600}
                                color={c.textSecondary}
                                align="center"
                            />
                        </CanvasItem>
                        <CanvasItem x={46 + i * 96} y={129} width={86} height={24}>
                            <TextLabel
                                c={c}
                                text={`B${i}`}
                                fontSize={18}
                                fontWeight={800}
                                color={warm}
                                mono
                                align="center"
                            />
                        </CanvasItem>
                        <CanvasItem x={46 + i * 96} y={151} width={86} height={18}>
                            <TextLabel
                                c={c}
                                text="stalled"
                                fontSize={12}
                                fontWeight={700}
                                color={red}
                                align="center"
                            />
                        </CanvasItem>
                    </React.Fragment>
                ))}

                {/* Left barrier & deadlock labels */}
                <CanvasItem x={150} y={187} width={166} height={20}>
                    <TextLabel
                        c={c}
                        text="grid.sync() barrier"
                        fontSize={12}
                        fontWeight={700}
                        color={red}
                        align="center"
                    />
                </CanvasItem>
                <CanvasItem x={24} y={230} width={132} height={36}>
                    <TextLabel
                        c={c}
                        text="B0–B3 wait on B4–B7"
                        fontSize={12}
                        fontWeight={700}
                        color={red}
                        align="right"
                    />
                </CanvasItem>
                <CanvasItem x={332} y={230} width={114} height={36}>
                    <TextLabel
                        c={c}
                        text="B4–B7 need free SM"
                        fontSize={12}
                        fontWeight={700}
                        color={c.textSecondary}
                        align="left"
                    />
                </CanvasItem>

                {/* Left queue header + labels */}
                <CanvasItem x={46} y={300} width={374} height={20}>
                    <TextLabel
                        c={c}
                        text="Hardware Block Queue (4 UNSCHEDULED)"
                        fontSize={13}
                        fontWeight={700}
                        color={red}
                    />
                </CanvasItem>
                {[4, 5, 6, 7].map((b, i) => (
                    <React.Fragment key={`qlbl-${b}`}>
                        <CanvasItem x={46 + i * 96} y={334} width={86} height={24}>
                            <TextLabel
                                c={c}
                                text={`B${b}`}
                                fontSize={18}
                                fontWeight={800}
                                color={c.textPrimary}
                                mono
                                align="center"
                            />
                        </CanvasItem>
                        <CanvasItem x={46 + i * 96} y={360} width={86} height={18}>
                            <TextLabel
                                c={c}
                                text="queued"
                                fontSize={12}
                                color={c.textMuted}
                                align="center"
                            />
                        </CanvasItem>
                    </React.Fragment>
                ))}

                {/* Left footer pill */}
                <CanvasItem x={78} y={435} width={310} height={24}>
                    <TextLabel
                        c={c}
                        text="DEADLOCK · Slots never retire"
                        fontSize={15}
                        fontWeight={800}
                        color={red}
                        align="center"
                    />
                </CanvasItem>

                {/* Right header */}
                <CanvasItem x={488} y={24} width={398} height={26}>
                    <TextLabel
                        c={c}
                        text="Cooperative Launch · 8 SM Slots"
                        fontSize={19}
                        fontWeight={800}
                        color={green}
                    />
                </CanvasItem>
                <CanvasItem x={488} y={48} width={398} height={22}>
                    <TextLabel
                        c={c}
                        text="Grid sized to co-resident SM capacity (queue empty)"
                        fontSize={14}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Right SM grid header */}
                <CanvasItem x={500} y={81} width={374} height={20}>
                    <TextLabel
                        c={c}
                        text="GPU SM Residency (8 / 8 CO-RESIDENT)"
                        fontSize={13}
                        fontWeight={700}
                        color={blue}
                    />
                </CanvasItem>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const col = i % 4
                    const row = Math.floor(i / 4)
                    const sx = 500 + col * 96
                    const sy = 104 + row * 78
                    return (
                        <React.Fragment key={`rlbl-${i}`}>
                            <CanvasItem x={sx} y={sy + 6} width={86} height={18}>
                                <TextLabel
                                    c={c}
                                    text={`SM ${i}`}
                                    fontSize={12}
                                    color={c.textSecondary}
                                    align="center"
                                />
                            </CanvasItem>
                            <CanvasItem x={sx} y={sy + 24} width={86} height={22}>
                                <TextLabel
                                    c={c}
                                    text={`B${i}`}
                                    fontSize={18}
                                    fontWeight={800}
                                    color={blue}
                                    mono
                                    align="center"
                                />
                            </CanvasItem>
                            <CanvasItem x={sx} y={sy + 46} width={86} height={16}>
                                <TextLabel
                                    c={c}
                                    text="active"
                                    fontSize={12}
                                    fontWeight={600}
                                    color={green}
                                    align="center"
                                />
                            </CanvasItem>
                        </React.Fragment>
                    )
                })}

                {/* Right barrier label */}
                <CanvasItem x={586} y={299} width={202} height={20}>
                    <TextLabel
                        c={c}
                        text="grid.sync() · all 8 arrive"
                        fontSize={13}
                        fontWeight={800}
                        color={green}
                        align="center"
                    />
                </CanvasItem>

                {/* Right resume box label */}
                <CanvasItem x={498} y={367} width={378} height={26}>
                    <TextLabel
                        c={c}
                        text="Phase 2: All 8 blocks resume in lockstep"
                        fontSize={15}
                        fontWeight={700}
                        color={green}
                        align="center"
                    />
                </CanvasItem>

                {/* Right footer pill */}
                <CanvasItem x={532} y={426} width={310} height={42}>
                    <BadgePill
                        c={c}
                        text="SAFE · Co-residency guaranteed"
                        tone="green"
                        filled
                        fontSize={15}
                        width={310}
                        height={38}
                    />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
