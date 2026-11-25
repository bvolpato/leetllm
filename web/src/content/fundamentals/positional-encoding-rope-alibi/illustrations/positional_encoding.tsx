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

export const width = 760
export const height = 400
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

    const yQ = 192
    const yK = 268
    const yV = 352
    const yMid = 230

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Outer schematic frame */}
                        <rect
                            x={8}
                            y={8}
                            width={744}
                            height={384}
                            rx={12}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />

                        {/* Main spine wires */}
                        {/* x -> Site 1 (+) */}
                        <line x1={62} y1={yK} x2={84} y2={yK} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(88, yK, wire)}

                        {/* Site 1 (+) -> fork to W_Q, W_K, W_V */}
                        <line x1={122} y1={yK} x2={146} y2={yK} stroke={wire} strokeWidth={2.2} />
                        <line x1={146} y1={yQ} x2={146} y2={yV} stroke={wire} strokeWidth={2.2} />
                        <line x1={146} y1={yQ} x2={166} y2={yQ} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(170, yQ, wire)}
                        <line x1={146} y1={yK} x2={166} y2={yK} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(170, yK, wire)}
                        <line x1={146} y1={yV} x2={166} y2={yV} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(170, yV, wire)}

                        {/* W_Q -> R(m), W_K -> R(n) */}
                        <line x1={234} y1={yQ} x2={278} y2={yQ} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(282, yQ, wire)}
                        <line x1={234} y1={yK} x2={278} y2={yK} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(282, yK, wire)}

                        {/* R(m) & R(n) -> QK^T / sqrt(d_k) */}
                        <path
                            d={`M 356 ${yQ} L 380 ${yQ} L 380 ${yMid - 10} L 396 ${yMid - 10}`}
                            fill="none"
                            stroke={wire}
                            strokeWidth={2.2}
                        />
                        {arrowRight(400, yMid - 10, wire)}
                        <path
                            d={`M 356 ${yK} L 380 ${yK} L 380 ${yMid + 10} L 396 ${yMid + 10}`}
                            fill="none"
                            stroke={wire}
                            strokeWidth={2.2}
                        />
                        {arrowRight(400, yMid + 10, wire)}

                        {/* QK^T -> Site 3 (+) -> softmax -> xV -> Y */}
                        <line x1={492} y1={yMid} x2={514} y2={yMid} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(518, yMid, wire)}

                        <line x1={552} y1={yMid} x2={574} y2={yMid} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(578, yMid, wire)}

                        <line x1={666} y1={yMid} x2={682} y2={yMid} stroke={wire} strokeWidth={2.2} />
                        {arrowRight(686, yMid, wire)}

                        <line x1={720} y1={yMid} x2={728} y2={yMid} stroke={wire} strokeWidth={2.2} />

                        {/* V wire running along bottom and up into (x) node */}
                        <path
                            d={`M 234 ${yV} L 703 ${yV} L 703 ${yMid + 21}`}
                            fill="none"
                            stroke={wire}
                            strokeWidth={2.2}
                        />
                        {arrowUp(703, yMid + 17, wire)}

                        {/* Neutral core blocks */}
                        {/* Input x */}
                        <rect
                            x={20}
                            y={yK - 22}
                            width={42}
                            height={44}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                        {/* W_Q, W_K, W_V */}
                        {[yQ, yK, yV].map((cy, idx) => (
                            <rect
                                key={`w-${idx}`}
                                x={170}
                                y={cy - 22}
                                width={64}
                                height={44}
                                rx={8}
                                fill={c.bgSubtle}
                                stroke={c.borderLight}
                                strokeWidth={2}
                            />
                        ))}
                        {/* QK^T / sqrt(d_k) */}
                        <rect
                            x={400}
                            y={yMid - 30}
                            width={92}
                            height={60}
                            rx={9}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                        {/* softmax */}
                        <rect
                            x={578}
                            y={yMid - 24}
                            width={88}
                            height={48}
                            rx={9}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                        {/* Multiply V circle */}
                        <circle
                            cx={703}
                            cy={yMid}
                            r={17}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />

                        {/* === SITE 1: Additive PE (Blue) === */}
                        <rect
                            x={20}
                            y={22}
                            width={228}
                            height={92}
                            rx={10}
                            fill={withColorAlpha(blue, 0.14)}
                            stroke={blue}
                            strokeWidth={2}
                        />
                        <line
                            x1={105}
                            y1={114}
                            x2={105}
                            y2={yK - 21}
                            stroke={blue}
                            strokeWidth={2.4}
                            strokeDasharray="5 3"
                        />
                        {arrowDown(105, yK - 17, blue)}
                        <circle
                            cx={105}
                            cy={yK}
                            r={17}
                            fill={withColorAlpha(blue, 0.24)}
                            stroke={blue}
                            strokeWidth={2.4}
                        />

                        {/* === SITE 2: RoPE (Green) === */}
                        <rect
                            x={260}
                            y={22}
                            width={228}
                            height={92}
                            rx={10}
                            fill={withColorAlpha(green, 0.14)}
                            stroke={green}
                            strokeWidth={2}
                        />
                        <rect
                            x={274}
                            y={156}
                            width={90}
                            height={146}
                            rx={10}
                            fill={withColorAlpha(green, 0.08)}
                            stroke={green}
                            strokeWidth={1.75}
                            strokeDasharray="5 4"
                        />
                        <line
                            x1={319}
                            y1={114}
                            x2={319}
                            y2={152}
                            stroke={green}
                            strokeWidth={2.4}
                            strokeDasharray="5 3"
                        />
                        {arrowDown(319, 156, green)}
                        <rect
                            x={282}
                            y={yQ - 21}
                            width={74}
                            height={42}
                            rx={8}
                            fill={withColorAlpha(green, 0.22)}
                            stroke={green}
                            strokeWidth={2}
                        />
                        <rect
                            x={282}
                            y={yK - 21}
                            width={74}
                            height={42}
                            rx={8}
                            fill={withColorAlpha(green, 0.22)}
                            stroke={green}
                            strokeWidth={2}
                        />

                        {/* === SITE 3: ALiBi (Warm) === */}
                        <rect
                            x={500}
                            y={22}
                            width={240}
                            height={92}
                            rx={10}
                            fill={withColorAlpha(warm, 0.14)}
                            stroke={warm}
                            strokeWidth={2}
                        />
                        <line
                            x1={535}
                            y1={114}
                            x2={535}
                            y2={yMid - 21}
                            stroke={warm}
                            strokeWidth={2.4}
                            strokeDasharray="5 3"
                        />
                        {arrowDown(535, yMid - 17, warm)}
                        <circle
                            cx={535}
                            cy={yMid}
                            r={17}
                            fill={withColorAlpha(warm, 0.24)}
                            stroke={warm}
                            strokeWidth={2.4}
                        />
                    </svg>
                </CanvasItem>

                {/* Site 1 callout text */}
                <CanvasItem x={30} y={30} width={208} height={24}>
                    <TextLabel c={c} text="1 · Additive PE" width={208} fontSize={16} fontWeight={800} color={blue} />
                </CanvasItem>
                <CanvasItem x={30} y={56} width={208} height={24}>
                    <TextLabel c={c} text="x + p_i (input)" width={208} fontSize={16} mono math color={c.textPrimary} />
                </CanvasItem>
                <CanvasItem x={30} y={84} width={208} height={22}>
                    <TextLabel c={c} text="Enters Q, K, and V" width={208} fontSize={16} color={c.textSecondary} />
                </CanvasItem>

                {/* Site 2 callout text */}
                <CanvasItem x={270} y={30} width={208} height={24}>
                    <TextLabel c={c} text="2 · RoPE (Q, K)" width={208} fontSize={16} fontWeight={800} color={green} />
                </CanvasItem>
                <CanvasItem x={270} y={56} width={208} height={24}>
                    <TextLabel c={c} text="R(m)Q, R(n)K" width={208} fontSize={16} mono color={c.textPrimary} />
                </CanvasItem>
                <CanvasItem x={270} y={84} width={208} height={22}>
                    <TextLabel c={c} text="Offset n−m; V clean" width={208} fontSize={16} color={c.textSecondary} />
                </CanvasItem>

                {/* Site 3 callout text */}
                <CanvasItem x={510} y={30} width={220} height={24}>
                    <TextLabel c={c} text="3 · ALiBi (Logits)" width={220} fontSize={16} fontWeight={800} color={warm} />
                </CanvasItem>
                <CanvasItem x={510} y={56} width={220} height={24}>
                    <TextLabel c={c} text="+ B_ij = −m_h|i−j|" width={220} fontSize={16} mono math color={c.textPrimary} />
                </CanvasItem>
                <CanvasItem x={510} y={84} width={220} height={22}>
                    <TextLabel c={c} text="Biases logits only" width={220} fontSize={16} color={c.textSecondary} />
                </CanvasItem>

                {/* Spine block labels */}
                <CanvasItem x={20} y={yK - 12} width={42} height={24}>
                    <TextLabel c={c} text="x" width={42} fontSize={18} fontWeight={800} mono color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={88} y={yK - 12} width={34} height={24}>
                    <TextLabel c={c} text="+" width={34} fontSize={19} fontWeight={800} mono color={blue} align="center" />
                </CanvasItem>

                <CanvasItem x={170} y={yQ - 11} width={64} height={22}>
                    <TextLabel c={c} text="W_Q" width={64} fontSize={16} fontWeight={800} mono math color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={170} y={yK - 11} width={64} height={22}>
                    <TextLabel c={c} text="W_K" width={64} fontSize={16} fontWeight={800} mono math color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={170} y={yV - 11} width={64} height={22}>
                    <TextLabel c={c} text="W_V" width={64} fontSize={16} fontWeight={800} mono math color={c.textPrimary} align="center" />
                </CanvasItem>

                {/* Q, K, V wire labels */}
                <CanvasItem x={242} y={yQ - 26} width={28} height={22}>
                    <TextLabel c={c} text="Q" width={28} fontSize={16} fontWeight={800} mono color={c.textSecondary} align="center" />
                </CanvasItem>
                <CanvasItem x={242} y={yK - 26} width={28} height={22}>
                    <TextLabel c={c} text="K" width={28} fontSize={16} fontWeight={800} mono color={c.textSecondary} align="center" />
                </CanvasItem>
                <CanvasItem x={360} y={yV - 28} width={230} height={22}>
                    <TextLabel c={c} text="V (unrotated by RoPE)" width={230} fontSize={16} fontWeight={700} color={green} align="center" />
                </CanvasItem>

                {/* RoPE rotation boxes */}
                <CanvasItem x={282} y={yQ - 11} width={74} height={22}>
                    <TextLabel c={c} text="R(m)" width={74} fontSize={16} fontWeight={800} mono color={green} align="center" />
                </CanvasItem>
                <CanvasItem x={282} y={yK - 11} width={74} height={22}>
                    <TextLabel c={c} text="R(n)" width={74} fontSize={16} fontWeight={800} mono color={green} align="center" />
                </CanvasItem>

                {/* QK^T / sqrt(d_k) */}
                <CanvasItem x={402} y={yMid - 23} width={88} height={22}>
                    <TextLabel c={c} text="QK^T" width={88} fontSize={16} fontWeight={800} mono math color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={402} y={yMid + 3} width={88} height={22}>
                    <TextLabel c={c} text="/ √d_k" width={88} fontSize={16} fontWeight={700} mono math color={c.textSecondary} align="center" />
                </CanvasItem>

                {/* ALiBi + circle */}
                <CanvasItem x={518} y={yMid - 12} width={34} height={24}>
                    <TextLabel c={c} text="+" width={34} fontSize={19} fontWeight={800} mono color={warm} align="center" />
                </CanvasItem>

                {/* Softmax, xV, Y */}
                <CanvasItem x={578} y={yMid - 11} width={88} height={22}>
                    <TextLabel c={c} text="softmax" width={88} fontSize={16} fontWeight={800} mono color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={686} y={yMid - 12} width={34} height={24}>
                    <TextLabel c={c} text="×" width={34} fontSize={19} fontWeight={800} mono color={c.textPrimary} align="center" />
                </CanvasItem>
                <CanvasItem x={726} y={yMid - 12} width={24} height={24}>
                    <TextLabel c={c} text="Y" width={24} fontSize={18} fontWeight={800} mono color={c.textPrimary} align="center" />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
