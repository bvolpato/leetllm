import React from 'react'
import { Board, Scene, VectorArrow, defineIllustration, getReadableToneColor } from 'vizmatic'
import { PaddedLabel, labelHeight } from '../visual-helpers'

export const width = 1200
export const height = 800
export const alt =
    'A five-stage device flow moves high-precision X and W through producer quantization, packed codes and scales, a selected MMA path with its declared accumulator mode, and an output that applies the X-row and W-column scale product before a BF16 cast. When K-block scale products are 5 and 8, partial sums 2 and 3 produce 10 plus 24, or 34; factoring 5 outside gives 25.'

const illustration = defineIllustration((c) => {
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            {/* Five device stages connected in execution order. */}
            {[15, 230, 445, 660, 925].map((x, i) => (
                <rect
                    key={`stage-${i}`}
                    x={x}
                    y="116"
                    width={[190, 190, 190, 240, 260][i]}
                    height="148"
                    rx="18"
                    fill="none"
                    stroke={[blue, warm, green, purple, blue][i]}
                    strokeWidth="4"
                />
            ))}
            {[205, 420, 635, 900].map((x, i) => (
                <g key={`stage-edge-${i}`}>
                    <VectorArrow
                        x1={x}
                        y1={190}
                        x2={x + 25}
                        y2={190}
                        color={line}
                        strokeWidth={4}
                        arrowSize={6}
                    />
                </g>
            ))}

            {/* A selected activation row and weight column own separate scales. */}
            {Array.from({ length: 6 }, (_, i) => (
                <rect
                    key={`x-row-${i}`}
                    x={74 + (i % 3) * 52}
                    y={366 + Math.floor(i / 3) * 44}
                    width="44"
                    height="36"
                    rx="6"
                    fill={i < 3 ? '#bfdbfe' : '#e2e8f0'}
                    stroke={line}
                    strokeWidth="2.5"
                />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
                <rect
                    key={`w-column-${i}`}
                    x={472 + (i % 2) * 52}
                    y={352 + Math.floor(i / 2) * 44}
                    width="44"
                    height="36"
                    rx="6"
                    fill={i % 2 === 1 ? '#fed7aa' : '#e2e8f0'}
                    stroke={line}
                    strokeWidth="2.5"
                />
            ))}
            <path
                d="M70 360 H66 V408 H70"
                fill="none"
                stroke={blue}
                strokeWidth="4"
                strokeLinecap="round"
            />
            <path
                d="M570 352 V476 M570 352 H580 M570 476 H580"
                fill="none"
                stroke={warm}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <VectorArrow
                x1={222}
                y1={410}
                x2={286}
                y2={394}
                color={blue}
                strokeWidth={4}
                arrowSize={6}
            />
            <rect
                x="286"
                y="360"
                width="150"
                height="68"
                rx="12"
                fill="none"
                stroke={blue}
                strokeWidth="3"
            />
            <VectorArrow
                x1={568}
                y1={414}
                x2={614}
                y2={462}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />
            <rect
                x="614"
                y="428"
                width="150"
                height="68"
                rx="12"
                fill="none"
                stroke={warm}
                strokeWidth="3"
            />
            <VectorArrow
                x1={436}
                y1={394}
                x2={884}
                y2={410}
                color={blue}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={764}
                y1={462}
                x2={884}
                y2={448}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />
            <rect
                x="884"
                y="394"
                width="164"
                height="70"
                rx="14"
                fill="none"
                stroke={purple}
                strokeWidth="4"
            />

            {/* Each K-block scale remains attached to its own dot partial. */}
            <rect
                x="66"
                y="640"
                width="300"
                height="82"
                rx="14"
                fill="none"
                stroke={blue}
                strokeWidth="4"
            />
            <rect
                x="430"
                y="640"
                width="300"
                height="82"
                rx="14"
                fill="none"
                stroke={warm}
                strokeWidth="4"
            />
            <rect
                x="834"
                y="640"
                width="300"
                height="82"
                rx="14"
                fill="none"
                stroke={purple}
                strokeWidth="4"
            />
            <path
                d="M366 681 H396 V628 H812 V660"
                fill="none"
                stroke={line}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <VectorArrow
                x1={812}
                y1={660}
                x2={834}
                y2={660}
                color={line}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={730}
                y1={681}
                x2={834}
                y2={697}
                color={line}
                strokeWidth={4}
                arrowSize={6}
            />
        </svg>
    )

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: (
            <Board c={c} width={width} height={height}>
                {svg}
                <PaddedLabel
                    c={c}
                    x={38}
                    y={24}
                    width={1124}
                    height={labelHeight(48)}
                    text="From source values to a scaled matrix result"
                    size={48}
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={20}
                    y={126}
                    width={180}
                    height={labelHeight(42)}
                    text="Inputs"
                    size={42}
                    color={blue}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={20}
                    y={194}
                    width={180}
                    height={labelHeight(42)}
                    text="X, W"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={235}
                    y={126}
                    width={180}
                    height={labelHeight(42)}
                    text="Encode"
                    size={42}
                    color={warm}
                    align="center"
                    weight={720}
                    paddingX={10}
                />
                <PaddedLabel
                    c={c}
                    x={235}
                    y={194}
                    width={180}
                    height={labelHeight(42)}
                    text="Q, S"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={450}
                    y={126}
                    width={180}
                    height={labelHeight(42)}
                    text="Pack"
                    size={42}
                    color={green}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={450}
                    y={194}
                    width={180}
                    height={labelHeight(42)}
                    text="Q + S"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={665}
                    y={126}
                    width={230}
                    height={labelHeight(42)}
                    text="MMA"
                    size={42}
                    color={purple}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={660}
                    y={194}
                    width={240}
                    height={labelHeight(42)}
                    text="FP32 acc."
                    size={42}
                    align="center"
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={930}
                    y={126}
                    width={250}
                    height={labelHeight(42)}
                    text="S_X · S_W"
                    size={42}
                    color={blue}
                    align="center"
                    weight={720}
                    paddingX={0}
                    math
                />
                <PaddedLabel
                    c={c}
                    x={930}
                    y={194}
                    width={250}
                    height={labelHeight(42)}
                    text="BF16 cast"
                    size={42}
                    align="center"
                    weight={720}
                    paddingX={0}
                />

                <PaddedLabel
                    c={c}
                    x={58}
                    y={278}
                    width={190}
                    height={labelHeight(42)}
                    text="X row i"
                    size={42}
                    color={blue}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={426}
                    y={278}
                    width={190}
                    height={labelHeight(42)}
                    text="W col j"
                    size={42}
                    color={warm}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={286}
                    y={362}
                    width={150}
                    height={labelHeight(42)}
                    text="S_{X,i}"
                    size={42}
                    color={blue}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={614}
                    y={430}
                    width={150}
                    height={labelHeight(42)}
                    text="S_{W,j}"
                    size={42}
                    color={warm}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={890}
                    y={398}
                    width={152}
                    height={labelHeight(42)}
                    text="Y_{ij}"
                    size={42}
                    color={purple}
                    align="center"
                    math
                />

                <PaddedLabel
                    c={c}
                    x={104}
                    y={500}
                    width={992}
                    height={labelHeight(42)}
                    text="Y_{ij} = S_{X,i} · S_{W,j} · Σ_k q_{X,ik} q_{W,kj}"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={38}
                    y={559}
                    width={1124}
                    height={labelHeight(42)}
                    text="Fixed scales exit K; block scales stay inside."
                    size={42}
                    color={c.textPrimary}
                />

                <PaddedLabel
                    c={c}
                    x={66}
                    y={648}
                    width={300}
                    height={labelHeight(42)}
                    text="5 × 2 = 10"
                    size={42}
                    color={blue}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={430}
                    y={648}
                    width={300}
                    height={labelHeight(42)}
                    text="8 × 3 = 24"
                    size={42}
                    color={warm}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={834}
                    y={648}
                    width={300}
                    height={labelHeight(42)}
                    text="10 + 24 = 34"
                    size={42}
                    color={purple}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={66}
                    y={730}
                    width={1068}
                    height={labelHeight(42)}
                    text="One scale across both blocks: 5 × (2 + 3) = 25"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                    math
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
