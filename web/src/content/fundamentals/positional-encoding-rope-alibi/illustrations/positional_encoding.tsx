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

export const width = 940
export const height = 500
export const alt =
    'A unified Transformer attention block schematic traces input x through linear projections W_Q, W_K, W_V, scaled dot product QK^T / sqrt(d_k), softmax, and multiplication by V to output Y, pinpointing three color-coded positional injection sites: (1) blue additive sinusoidal or learned embeddings added at input x + p before projections (entering Q, K, and V), (2) green RoPE rotating projected Q and K via R(m) and R(n) while leaving V untouched, and (3) warm ALiBi adding -m_h|i-j| bias directly to pre-softmax logits.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const wire = c.textSecondary

    const arrowRight = (x: number, y: number, color: string) => (
        <polygon points={`${x},${y} ${x - 8},${y - 4.5} ${x - 8},${y + 4.5}`} fill={color} />
    )
    const arrowDown = (x: number, y: number, color: string) => (
        <polygon points={`${x},${y} ${x - 4.5},${y - 8} ${x + 4.5},${y - 8}`} fill={color} />
    )
    const arrowUp = (x: number, y: number, color: string) => (
        <polygon points={`${x},${y} ${x - 4.5},${y + 8} ${x + 4.5},${y + 8}`} fill={color} />
    )

    // Key horizontal spine coordinates
    const yQ = 196
    const yK = 268
    const yV = 352
    const yMid = 232 // midpoint between Q and K

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Outer schematic frame */}
                        <rect
                            x={16}
                            y={14}
                            width={908}
                            height={472}
                            rx={14}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />

                        {/* Main spine wires */}
                        {/* x -> Site 1 (+) */}
                        <line x1={96} y1={yK} x2={136} y2={yK} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(140, yK, wire)}

                        {/* Site 1 (+) -> fork to W_Q, W_K, W_V */}
                        <line x1={174} y1={yK} x2={206} y2={yK} stroke={wire} strokeWidth={2.2} />
                        <line x1={206} y1={yQ} x2={206} y2={yV} stroke={wire} strokeWidth={2.2} />
                        <line x1={206} y1={yQ} x2={234} y2={yQ} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(238, yQ, wire)}
                        <line x1={206} y1={yK} x2={234} y2={yK} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(238, yK, wire)}
                        <line x1={206} y1={yV} x2={234} y2={yV} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(238, yV, wire)}

                        {/* W_Q -> R(m), W_K -> R(n) */}
                        <line x1={314} y1={yQ} x2={364} y2={yQ} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(368, yQ, wire)}
                        <line x1={314} y1={yK} x2={364} y2={yK} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(368, yK, wire)}

                        {/* R(m) & R(n) -> QK^T / sqrt(d_k) */}
                        <path
                            d={`M 454 ${yQ} L 486 ${yQ} L 486 ${yMid - 10} L 508 ${yMid - 10}`}
                            fill="none"
                            stroke={wire}
                            strokeWidth={2.2}
                        />
                        {arrowRight(512, yMid - 10, wire)}
                        <path
                            d={`M 454 ${yK} L 486 ${yK} L 486 ${yMid + 10} L 508 ${yMid + 10}`}
                            fill="none"
                            stroke={wire}
                            strokeWidth={2.2}
                        />
                        {arrowRight(512, yMid + 10, wire)}

                        {/* QK^T -> Site 3 (+) -> softmax -> xV -> Y */}
                        <line x1={614} y1={yMid} x2={644} y2={yMid} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(648, yMid, wire)}

                        <line x1={682} y1={yMid} x2={708} y2={yMid} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(712, yMid, wire)}

                        <line x1={798} y1={yMid} x2={822} y2={yMid} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(826, yMid, wire)}

                        <line x1={860} y1={yMid} x2={876} y2={yMid} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(880, yMid, wire)}

                        {/* V wire running cleanly along bottom and up into (x) node */}
                        <path
                            d={`M 314 ${yV} L 843 ${yV} L 843 ${yMid + 21}`}
                            fill="none"
                            stroke={wire}
                            strokeWidth={2.2}
                        />
                        {arrowUp(843, yMid + 17, wire)}

                        {/* Neutral core blocks */}
                        {/* Input x */}
                        <rect
                            x={36}
                            y={yK - 24}
                            width={60}
                            height={48}
                            rx={9}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                        {/* W_Q, W_K, W_V */}
                        {[yQ, yK, yV].map((cy, idx) => (
                            <rect
                                key={`w-${idx}`}
                                x={238}
                                y={cy - 22}
                                width={76}
                                height={44}
                                rx={8}
                                fill={c.bgSubtle}
                                stroke={c.borderLight}
                                strokeWidth={2}
                            />
                        ))}
                        {/* QK^T / sqrt(d_k) */}
                        <rect
                            x={512}
                            y={yMid - 28}
                            width={102}
                            height={56}
                            rx={9}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                        {/* softmax */}
                        <rect
                            x={712}
                            y={yMid - 24}
                            width={86}
                            height={48}
                            rx={9}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                        {/* Multiply V circle */}
                        <circle
                            cx={843}
                            cy={yMid}
                            r={17}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />

                        {/* === SITE 1: Additive PE (Blue) === */}
                        <rect
                            x={36}
                            y={56}
                            width={242}
                            height={72}
                            rx={10}
                            fill={withColorAlpha(blue, 0.16)}
                            stroke={blue}
                            strokeWidth={2}
                        />
                        <line
                            x1={157}
                            y1={128}
                            x2={157}
                            y2={yK - 21}
                            stroke={blue}
                            strokeWidth={2.5}
                            strokeDasharray="5 3"
                        />
                        {arrowDown(157, yK - 17, blue)}
                        <circle
                            cx={157}
                            cy={yK}
                            r={17}
                            fill={withColorAlpha(blue, 0.25)}
                            stroke={blue}
                            strokeWidth={2.5}
                        />

                        {/* === SITE 2: RoPE (Green) === */}
                        <rect
                            x={300}
                            y={56}
                            width={254}
                            height={72}
                            rx={10}
                            fill={withColorAlpha(green, 0.16)}
                            stroke={green}
                            strokeWidth={2}
                        />
                        {/* Dashed enclosure around R(m) and R(n) */}
                        <rect
                            x={358}
                            y={164}
                            width={106}
                            height={134}
                            rx={10}
                            fill={withColorAlpha(green, 0.08)}
                            stroke={green}
                            strokeWidth={1.75}
                            strokeDasharray="5 4"
                        />
                        <line
                            x1={411}
                            y1={128}
                            x2={411}
                            y2={160}
                            stroke={green}
                            strokeWidth={2.5}
                            strokeDasharray="5 3"
                        />
                        {arrowDown(411, 164, green)}
                        {/* R(m) box on Q */}
                        <rect
                            x={368}
                            y={yQ - 20}
                            width={86}
                            height={40}
                            rx={8}
                            fill={withColorAlpha(green, 0.24)}
                            stroke={green}
                            strokeWidth={2.2}
                        />
                        {/* R(n) box on K */}
                        <rect
                            x={368}
                            y={yK - 20}
                            width={86}
                            height={40}
                            rx={8}
                            fill={withColorAlpha(green, 0.24)}
                            stroke={green}
                            strokeWidth={2.2}
                        />

                        {/* === SITE 3: ALiBi (Warm) === */}
                        <rect
                            x={576}
                            y={56}
                            width={326}
                            height={72}
                            rx={10}
                            fill={withColorAlpha(warm, 0.16)}
                            stroke={warm}
                            strokeWidth={2}
                        />
                        <line
                            x1={665}
                            y1={128}
                            x2={665}
                            y2={yMid - 21}
                            stroke={warm}
                            strokeWidth={2.5}
                            strokeDasharray="5 3"
                        />
                        {arrowDown(665, yMid - 17, warm)}
                        <circle
                            cx={665}
                            cy={yMid}
                            r={17}
                            fill={withColorAlpha(warm, 0.25)}
                            stroke={warm}
                            strokeWidth={2.5}
                        />

                        {/* Bottom summary bar */}
                        <rect
                            x={36}
                            y={408}
                            width={866}
                            height={58}
                            rx={10}
                            fill={c.bgSubtle}
                            stroke={c.border}
                            strokeWidth={1.25}
                        />
                    </svg>
                </CanvasItem>

                {/* Top title */}
                <CanvasItem x={36} y={22} width={866} height={24}>
                    <TextLabel
                        c={c}
                        text="Where Position Enters a Transformer Attention Block"
                        fontSize={19}
                        fontWeight={800}
                        color={c.textPrimary}
                    />
                </CanvasItem>

                {/* Site 1 callout text */}
                <CanvasItem x={46} y={64} width={222} height={22}>
                    <TextLabel c={c} text="1 · Additive PE (Input)" fontSize={15} fontWeight={800} color={blue} />
                </CanvasItem>
                <CanvasItem x={46} y={86} width={222} height={20}>
                    <TextLabel c={c} text="x + p_i (Sinusoidal / Learned)" fontSize={13} mono math color={c.textPrimary} />
                </CanvasItem>
                <CanvasItem x={46} y={104} width={222} height={18}>
                    <TextLabel c={c} text="Position enters Q, K, and V" fontSize={12} color={c.textSecondary} />
                </CanvasItem>

                {/* Site 2 callout text */}
                <CanvasItem x={310} y={64} width={234} height={22}>
                    <TextLabel c={c} text="2 · RoPE (Projected Q, K)" fontSize={15} fontWeight={800} color={green} />
                </CanvasItem>
                <CanvasItem x={310} y={86} width={234} height={20}>
                    <TextLabel c={c} text="R(m)Q, R(n)K (2D pairs)" fontSize={13} mono color={c.textPrimary} />
                </CanvasItem>
                <CanvasItem x={310} y={104} width={234} height={18}>
                    <TextLabel c={c} text="Relative offset n − m; V clean" fontSize={12} color={c.textSecondary} />
                </CanvasItem>

                {/* Site 3 callout text */}
                <CanvasItem x={588} y={64} width={304} height={22}>
                    <TextLabel c={c} text="3 · ALiBi (Pre-Softmax Logits)" fontSize={15} fontWeight={800} color={warm} />
                </CanvasItem>
                <CanvasItem x={588} y={86} width={304} height={20}>
                    <TextLabel c={c} text="+ B_ij = −m_h |i − j|" fontSize={13} mono math color={c.textPrimary} />
                </CanvasItem>
                <CanvasItem x={588} y={104} width={304} height={18}>
                    <TextLabel c={c} text="Recency bias only; Q, K, V untouched" fontSize={12} color={c.textSecondary} />
                </CanvasItem>

                {/* Spine block labels */}
                <CanvasItem x={36} y={yK - 12} width={60} height={24}>
                    <TextLabel c={c} text="x" fontSize={19} fontWeight={800} mono color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={140} y={yK - 13} width={34} height={24}>
                    <TextLabel c={c} text="+" fontSize={20} fontWeight={800} mono color={blue} align="center" />
                </CanvasItem>

                <CanvasItem x={238} y={yQ - 11} width={76} height={22}>
                    <TextLabel c={c} text="W_Q" fontSize={16} fontWeight={800} mono math color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={238} y={yK - 11} width={76} height={22}>
                    <TextLabel c={c} text="W_K" fontSize={16} fontWeight={800} mono math color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={238} y={yV - 11} width={76} height={22}>
                    <TextLabel c={c} text="W_V" fontSize={16} fontWeight={800} mono math color={c.textPrimary} align="center" />
                </CanvasItem>

                {/* Q, K, V wire labels */}
                <CanvasItem x={320} y={yQ - 20} width={32} height={18}>
                    <TextLabel c={c} text="Q" fontSize={13} fontWeight={800} mono color={c.textSecondary} align="center" />
                </CanvasItem>
                <CanvasItem x={320} y={yK - 20} width={32} height={18}>
                    <TextLabel c={c} text="K" fontSize={13} fontWeight={800} mono color={c.textSecondary} align="center" />
                </CanvasItem>
                <CanvasItem x={486} y={yV - 22} width={170} height={18}>
                    <TextLabel c={c} text="V (unrotated by RoPE)" fontSize={13} fontWeight={700} color={green} align="center" />
                </CanvasItem>

                {/* RoPE rotation boxes */}
                <CanvasItem x={368} y={yQ - 10} width={86} height={22}>
                    <TextLabel c={c} text="R(m)" fontSize={15} fontWeight={800} mono color={green} align="center" />
                </CanvasItem>
                <CanvasItem x={368} y={yK - 10} width={86} height={22}>
                    <TextLabel c={c} text="R(n)" fontSize={15} fontWeight={800} mono color={green} align="center" />
                </CanvasItem>

                {/* QK^T / sqrt(d_k) */}
                <CanvasItem x={514} y={yMid - 18} width={98} height={20}>
                    <TextLabel c={c} text="Q K^T" fontSize={15} fontWeight={800} mono math color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={514} y={yMid + 2} width={98} height={20}>
                    <TextLabel c={c} text="/ √d_k" fontSize={14} fontWeight={700} mono math color={c.textSecondary} align="center" />
                </CanvasItem>

                {/* ALiBi + circle */}
                <CanvasItem x={648} y={yMid - 13} width={34} height={24}>
                    <TextLabel c={c} text="+" fontSize={20} fontWeight={800} mono color={warm} align="center" />
                </CanvasItem>

                {/* Softmax, xV, Y */}
                <CanvasItem x={712} y={yMid - 10} width={86} height={22}>
                    <TextLabel c={c} text="softmax" fontSize={15} fontWeight={800} mono color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={826} y={yMid - 13} width={34} height={24}>
                    <TextLabel c={c} text="×" fontSize={20} fontWeight={800} mono color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={882} y={yMid - 12} width={28} height={24}>
                    <TextLabel c={c} text="Y" fontSize={19} fontWeight={800} mono color={c.textPrimary} align="center" />
                </CanvasItem>

                {/* Bottom summary strip */}
                <CanvasItem x={52} y={427} width={270} height={22}>
                    <TextLabel
                        c={c}
                        text="1. Additive: modifies x -> Q, K, V"
                        fontSize={14}
                        fontWeight={700}
                        color={blue}
                    />
                </CanvasItem>
                <CanvasItem x={346} y={427} width={270} height={22}>
                    <TextLabel
                        c={c}
                        text="2. RoPE: rotates Q, K only"
                        fontSize={14}
                        fontWeight={700}
                        color={green}
                        align="center"
                    />
                </CanvasItem>
                <CanvasItem x={634} y={427} width={256} height={22}>
                    <TextLabel
                        c={c}
                        text="3. ALiBi: biases logits only"
                        fontSize={14}
                        fontWeight={700}
                        color={warm}
                        align="right"
                    />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
