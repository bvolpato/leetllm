import React from 'react'
import { Board, Scene, SvgPoint, defineIllustration, getReadableToneColor } from 'vizmatic'
import { PaddedLabel, labelHeight } from '../visual-helpers'

export const width = 1200
export const height = 800
export const alt =
    'The 32-value activation row repeats an eight-value pattern four times; highlighted spikes at indices 3, 11, 19, and 27 reconstruct from 500 to 512. Grouped positive and negative real-arithmetic sums meet at 7.75: 181 plus negative 173.25 for FP32 values, and 184 plus negative 176.25 for reconstructed operands. A full 32-entry one-hot W selector has only w3 set to 1; at index 3 it exposes 500 versus 512, an absolute error of 12.'

const illustration = defineIllustration((c) => {
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const critical = getReadableToneColor('critical', c, c.bg)
    const cellStart = 74
    const step = 33
    const cumulativeY = (value: number) => 545 - (value / 200) * 106
    const referencePositiveY = cumulativeY(181)
    const mxPositiveY = cumulativeY(184)
    const finalY = cumulativeY(7.75)
    const selectorStart = 170
    const selectorStep = 27

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            {Array.from({ length: 32 }, (_, i) => {
                const spike = i % 8 === 3
                return (
                    <rect
                        key={`activation-${i}`}
                        x={cellStart + i * step}
                        y="236"
                        width="27"
                        height="62"
                        rx="5"
                        fill={spike ? '#fed7aa' : i % 2 ? '#dbeafe' : '#bfdbfe'}
                        stroke={line}
                        strokeWidth={spike ? 3 : 1.6}
                    />
                )
            })}
            {[0, 1, 2, 3].map((i) => {
                const left = cellStart + i * step * 8
                return (
                    <path
                        key={`repeat-${i}`}
                        d={`M${left} 234 V228 H${left + step * 8 - 5} V234`}
                        fill="none"
                        stroke={blue}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                )
            })}

            {/* Shared value axis: each trace rises with positive terms, then returns to 7.75. */}
            <line x1="200" y1="439" x2="200" y2="545" stroke={line} strokeWidth="3" />
            <line x1="200" y1="545" x2="1040" y2="545" stroke={line} strokeWidth="3" />
            {[439, 492, 545].map((y, i) => (
                <line
                    key={`sum-tick-${i}`}
                    x1="190"
                    y1={y}
                    x2="1040"
                    y2={y}
                    stroke={line}
                    strokeWidth="1.5"
                    opacity="0.45"
                />
            ))}
            <path
                d={`M230 545 L620 ${referencePositiveY} L1000 ${finalY}`}
                fill="none"
                stroke={blue}
                strokeWidth="5"
            />
            <path
                d={`M230 545 L620 ${mxPositiveY} L1000 ${finalY}`}
                fill="none"
                stroke={green}
                strokeWidth="5"
                strokeDasharray="10 7"
            />
            <SvgPoint cx={230} cy={545} r={8} fill={purple} stroke={c.bg} strokeWidth={3} />
            <SvgPoint
                cx={620}
                cy={referencePositiveY}
                r={7}
                fill={blue}
                stroke={c.bg}
                strokeWidth={3}
            />
            <rect
                x="613"
                y={mxPositiveY - 7}
                width="14"
                height="14"
                rx="2"
                fill={green}
                stroke={c.bg}
                strokeWidth="2.5"
            />
            <SvgPoint cx={1000} cy={finalY} r={9} fill={purple} stroke={c.bg} strokeWidth={3} />

            {/* One-hot W selects the highlighted lane and exposes the reconstructed spike. */}
            {Array.from({ length: 32 }, (_, i) => (
                <rect
                    key={`selector-cell-${i}`}
                    x={selectorStart + i * selectorStep}
                    y="724"
                    width="24"
                    height="48"
                    rx="4"
                    fill={i === 3 ? '#e9d5ff' : '#f1f5f9'}
                    stroke={i === 3 ? purple : line}
                    strokeWidth={i === 3 ? 3 : 1.7}
                />
            ))}
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
                    text="Cancellation can hide a changed operand"
                    size={48}
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={48}
                    y={96}
                    width={1094}
                    height={labelHeight(40)}
                    text="32-value row · eight-value pattern repeats four times"
                    size={40}
                    color={blue}
                    weight={710}
                />
                <PaddedLabel
                    c={c}
                    x={48}
                    y={160}
                    width={1094}
                    height={labelHeight(40)}
                    text="Spikes at indices 3, 11, 19, 27 · 500 → 512"
                    size={40}
                    color={warm}
                />

                <PaddedLabel
                    c={c}
                    x={38}
                    y={356}
                    width={1124}
                    height={labelHeight(42)}
                    text="Grouped positive and negative real-arithmetic sums"
                    size={42}
                    color={blue}
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={27}
                    y={420}
                    width={116}
                    height={labelHeight(42)}
                    text="200"
                    size={42}
                    align="right"
                />
                <PaddedLabel
                    c={c}
                    x={35}
                    y={473}
                    width={100}
                    height={labelHeight(42)}
                    text="100"
                    size={42}
                    align="right"
                    paddingX={12}
                />
                <PaddedLabel
                    c={c}
                    x={35}
                    y={526}
                    width={100}
                    height={labelHeight(42)}
                    text="0"
                    size={42}
                    align="right"
                />
                <PaddedLabel
                    c={c}
                    x={109}
                    y={554}
                    width={520}
                    height={labelHeight(40)}
                    text="FP32: 181 − 173.25 = 7.75"
                    size={40}
                    color={blue}
                    align="center"
                    paddingX={8}
                />
                <PaddedLabel
                    c={c}
                    x={637}
                    y={554}
                    width={500}
                    height={labelHeight(40)}
                    text="MX: 184 − 176.25 = 7.75"
                    size={40}
                    color={green}
                    align="center"
                    paddingX={8}
                />
                <PaddedLabel
                    c={c}
                    x={34}
                    y={644}
                    width={520}
                    height={labelHeight(40)}
                    text="i3: 500 → 512 · Δ12"
                    size={40}
                    color={critical}
                    align="center"
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={570}
                    y={644}
                    width={596}
                    height={labelHeight(40)}
                    text="W=e₃ · 32 weights · 31 zeros"
                    size={40}
                    color={purple}
                    align="center"
                    paddingX={0}
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
