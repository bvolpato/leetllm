import React from 'react'
import {
    Board,
    Scene,
    SvgPoint,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { PaddedLabel, labelHeight } from '../visual-helpers'

export const width = 1200
export const height = 800
export const alt =
    'A shared linear number line places 1.01 eight percent of the way between neighboring representable values 1 and 1.125. Round-to-nearest-even chooses 1. A deterministic probability bar assigns 0.92 mass to 1 and 0.08 to 1.125, whose weighted expectation is 1.01. A separate saturation lane shows 500 clipped to 448 beyond the finite neighbor interval.'

const illustration = defineIllustration((c) => {
    const ink = c.textPrimary
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const critical = getReadableToneColor('critical', c, c.bg)
    const xValue = 150 + (0.01 / 0.125) * 750

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <line x1="150" y1="248" x2="900" y2="248" stroke={line} strokeWidth="4" />
            {[150, xValue, 900].map((x, i) => (
                <line
                    key={`axis-${i}`}
                    x1={x}
                    y1="232"
                    x2={x}
                    y2="264"
                    stroke={i === 1 ? blue : line}
                    strokeWidth="4"
                />
            ))}
            <SvgPoint cx={150} cy={248} r={9} fill={green} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={xValue} cy={248} r={11} fill={blue} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={900} cy={248} r={9} fill={warm} stroke={c.bg} strokeWidth={3} />

            {/* The bar's segment widths encode exact probabilities, not sampled outcomes. */}
            <rect
                x="150"
                y="505"
                width="690"
                height="70"
                rx="10"
                fill="#bbf7d0"
                stroke={line}
                strokeWidth="3"
            />
            <rect
                x="840"
                y="505"
                width="60"
                height="70"
                rx="10"
                fill="#bfdbfe"
                stroke={line}
                strokeWidth="3"
            />
            <line x1="840" y1="497" x2="840" y2="583" stroke={line} strokeWidth="3" />
            {/* Saturation lives outside the finite neighboring-value interval. */}
            <line x1="156" y1="744" x2="1060" y2="744" stroke={line} strokeWidth="4" />
            <line x1="960" y1="722" x2="960" y2="766" stroke={critical} strokeWidth="5" />
            <SvgPoint cx={960} cy={744} r={10} fill={critical} stroke={c.bg} strokeWidth={3} />
            <VectorArrow
                x1={1050}
                y1={744}
                x2={972}
                y2={744}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />
            <SvgPoint cx={1060} cy={744} r={10} fill={warm} stroke={c.bg} strokeWidth={3} />
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
                    text="1.010 lies between representable neighbors."
                    size={48}
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={100}
                    y={108}
                    width={220}
                    height={labelHeight(42)}
                    text="x = 1.010"
                    size={42}
                    align="center"
                    color={blue}
                />
                <PaddedLabel
                    c={c}
                    x={75}
                    y={174}
                    width={150}
                    height={labelHeight(42)}
                    text="1.000"
                    size={42}
                    align="center"
                    color={green}
                />
                <PaddedLabel
                    c={c}
                    x={825}
                    y={174}
                    width={150}
                    height={labelHeight(42)}
                    text="1.125"
                    size={42}
                    align="center"
                    color={warm}
                />
                <PaddedLabel
                    c={c}
                    x={70}
                    y={318}
                    width={340}
                    height={labelHeight(42)}
                    text="RNE → 1.000"
                    size={42}
                    color={green}
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={700}
                    y={318}
                    width={420}
                    height={labelHeight(42)}
                    text="Stochastic weights"
                    size={42}
                    color={blue}
                    weight={720}
                    align="right"
                />
                <PaddedLabel
                    c={c}
                    x={60}
                    y={412}
                    width={360}
                    height={labelHeight(42)}
                    text="P(lower) = 0.92"
                    size={42}
                    color={green}
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={760}
                    y={412}
                    width={360}
                    height={labelHeight(42)}
                    text="P(upper) = 0.08"
                    size={42}
                    color={blue}
                    weight={720}
                    align="right"
                />
                <PaddedLabel
                    c={c}
                    x={155}
                    y={508}
                    width={680}
                    height={labelHeight(42)}
                    text="0.92 probability mass → 1.000"
                    size={42}
                    color="#0f172a"
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={80}
                    y={590}
                    width={1040}
                    height={labelHeight(44)}
                    text="Expected value: 0.92 × 1 + 0.08 × 1.125 = 1.010"
                    size={44}
                    color={ink}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={38}
                    y={670}
                    width={420}
                    height={labelHeight(42)}
                    text="Unscaled clip"
                    size={42}
                    color={ink}
                    weight={710}
                />
                <PaddedLabel
                    c={c}
                    x={900}
                    y={670}
                    width={120}
                    height={labelHeight(42)}
                    text="448"
                    size={42}
                    color={critical}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={1000}
                    y={670}
                    width={120}
                    height={labelHeight(42)}
                    text="500"
                    size={42}
                    color={warm}
                    align="center"
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
