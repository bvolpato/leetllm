import React from 'react'
import { Board, Scene, SvgPoint, defineIllustration, getReadableToneColor } from 'vizmatic'
import { PaddedLabel, labelHeight } from '../visual-helpers'

export const width = 1200
export const height = 800
export const alt =
    'E4M3 and E5M2 bit strips allocate their eight bits to one sign, four or five exponent bits, and three or two fraction bits. On the same one-to-two number line, E4M3 marks are spaced by 0.125 and E5M2 marks by 0.25. A close view around 2 shows the E4M3 step widening from 0.125 below the boundary to 0.25 above it.'

const illustration = defineIllustration((c) => {
    const ink = c.textPrimary
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const signFill = '#e2e8f0'
    const exponentFill = '#bfdbfe'
    const fractionFill = '#fed7aa'

    const group = (
        x: number,
        y: number,
        cells: number,
        color: string,
        fill: string,
        id: string,
    ) => (
        <g key={id}>
            <rect
                x={x}
                y={y}
                width={cells * 92}
                height="56"
                rx="8"
                fill={fill}
                stroke={color}
                strokeWidth="3"
            />
            {Array.from({ length: cells - 1 }, (_, index) => (
                <line
                    key={`${id}-bit-${index}`}
                    x1={x + (index + 1) * 92}
                    y1={y + 4}
                    x2={x + (index + 1) * 92}
                    y2={y + 52}
                    stroke={line}
                    strokeWidth="2"
                />
            ))}
        </g>
    )

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            {group(260, 150, 1, line, signFill, 'e4-sign')}
            {group(352, 150, 4, line, exponentFill, 'e4-exponent')}
            {group(720, 150, 3, line, fractionFill, 'e4-fraction')}
            {group(260, 222, 1, line, signFill, 'e5-sign')}
            {group(352, 222, 5, line, exponentFill, 'e5-exponent')}
            {group(812, 222, 2, line, fractionFill, 'e5-fraction')}

            <line x1="360" y1="430" x2="1000" y2="430" stroke={line} strokeWidth="4" />
            <line x1="360" y1="535" x2="1000" y2="535" stroke={line} strokeWidth="4" />
            {Array.from({ length: 8 }, (_, i) => (
                <line
                    key={`e4-tick-${i}`}
                    x1={360 + i * 80}
                    y1="418"
                    x2={360 + i * 80}
                    y2="442"
                    stroke={blue}
                    strokeWidth="4"
                />
            ))}
            {Array.from({ length: 4 }, (_, i) => (
                <line
                    key={`e5-tick-${i}`}
                    x1={360 + i * 160}
                    y1="523"
                    x2={360 + i * 160}
                    y2="547"
                    stroke={warm}
                    strokeWidth="4"
                />
            ))}
            <line
                x1="1000"
                y1="520"
                x2="1000"
                y2="596"
                stroke={line}
                strokeWidth="3"
                strokeDasharray="8 8"
            />

            <line x1="300" y1="700" x2="900" y2="700" stroke={line} strokeWidth="4" />
            {[300, 450, 600, 900].map((x, i) => (
                <line
                    key={`boundary-tick-${i}`}
                    x1={x}
                    y1="688"
                    x2={x}
                    y2="712"
                    stroke={i === 2 ? purple : line}
                    strokeWidth="4"
                />
            ))}
            <SvgPoint cx={300} cy={700} r={8} fill={blue} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={450} cy={700} r={8} fill={blue} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={600} cy={700} r={9} fill={purple} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={900} cy={700} r={8} fill={purple} stroke={c.bg} strokeWidth={3} />
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
                    x={42}
                    y={12}
                    width={1116}
                    height={labelHeight(42)}
                    text="E4M3 and E5M2 spend eight bits differently."
                    size={42}
                    weight={730}
                />

                <PaddedLabel
                    c={c}
                    x={245}
                    y={80}
                    width={122}
                    height={labelHeight(42)}
                    text="Sign"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={470}
                    y={80}
                    width={224}
                    height={labelHeight(42)}
                    text="Exponent"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={803}
                    y={80}
                    width={202}
                    height={labelHeight(42)}
                    text="Fraction"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={24}
                    y={146}
                    width={220}
                    height={labelHeight(42)}
                    text="E4M3"
                    size={42}
                    color={blue}
                    weight={740}
                />
                <PaddedLabel
                    c={c}
                    x={24}
                    y={218}
                    width={220}
                    height={labelHeight(42)}
                    text="E5M2"
                    size={42}
                    color={warm}
                    weight={740}
                />

                <PaddedLabel
                    c={c}
                    x={42}
                    y={300}
                    width={1116}
                    height={labelHeight(48)}
                    text="Grid values in [1, 2)"
                    size={48}
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={42}
                    y={375}
                    width={230}
                    height={labelHeight(42)}
                    text="Δ 0.125"
                    size={42}
                    color={blue}
                />
                <PaddedLabel
                    c={c}
                    x={42}
                    y={483}
                    width={230}
                    height={labelHeight(42)}
                    text="Δ 0.25"
                    size={42}
                    color={warm}
                />
                <PaddedLabel
                    c={c}
                    x={280}
                    y={442}
                    width={160}
                    height={labelHeight(42)}
                    text="1.000"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={440}
                    y={442}
                    width={160}
                    height={labelHeight(42)}
                    text="1.250"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={600}
                    y={442}
                    width={160}
                    height={labelHeight(42)}
                    text="1.500"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={760}
                    y={442}
                    width={160}
                    height={labelHeight(42)}
                    text="1.750"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={920}
                    y={442}
                    width={160}
                    height={labelHeight(42)}
                    text="2.000"
                    size={42}
                    color={purple}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={280}
                    y={547}
                    width={160}
                    height={labelHeight(42)}
                    text="1.00"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={440}
                    y={547}
                    width={160}
                    height={labelHeight(42)}
                    text="1.25"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={600}
                    y={547}
                    width={160}
                    height={labelHeight(42)}
                    text="1.50"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={760}
                    y={547}
                    width={160}
                    height={labelHeight(42)}
                    text="1.75"
                    size={42}
                    align="center"
                />

                <PaddedLabel
                    c={c}
                    x={42}
                    y={620}
                    width={1116}
                    height={labelHeight(42)}
                    text="At 2, E4M3 spacing widens from 0.125 to 0.25."
                    size={42}
                    weight={710}
                />
                <PaddedLabel
                    c={c}
                    x={220}
                    y={716}
                    width={160}
                    height={labelHeight(42)}
                    text="1.750"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={370}
                    y={716}
                    width={160}
                    height={labelHeight(42)}
                    text="1.875"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={520}
                    y={716}
                    width={160}
                    height={labelHeight(42)}
                    text="2.000"
                    size={42}
                    align="center"
                    color={purple}
                />
                <PaddedLabel
                    c={c}
                    x={820}
                    y={716}
                    width={160}
                    height={labelHeight(42)}
                    text="2.250"
                    size={42}
                    align="center"
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
