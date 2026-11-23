import React from 'react'
import { Board, Scene, VectorArrow, defineIllustration, getReadableToneColor } from 'vizmatic'
import { PaddedLabel, labelHeight } from '../visual-helpers'

export const width = 1200
export const height = 800
export const alt =
    'Two schematic device sequences compare current and delayed scaling. Current scaling reads tensor values for amax, computes the scale, reads values again to cast and write codes, then GEMM reads those codes. Delayed scaling selects the current scale as max of the previous three amax values divided by 448, then casts and writes codes in one tensor pass while recording the current amax for the next history window. The selected history scale feeds the current cast. Spacing is schematic, with no duration claim.'

const illustration = defineIllustration((c) => {
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            {[40, 270, 500, 730, 960].map((x, i) => (
                <rect
                    key={`current-${i}`}
                    x={x}
                    y="180"
                    width="198"
                    height="90"
                    rx="16"
                    fill="none"
                    stroke={[blue, warm, blue, green, purple][i]}
                    strokeWidth="4"
                />
            ))}
            {[238, 468, 698, 928].map((x, i) => (
                <g key={`current-edge-${i}`}>
                    <VectorArrow
                        x1={x}
                        y1={225}
                        x2={x + 32}
                        y2={225}
                        color={line}
                        strokeWidth={4}
                        arrowSize={6}
                    />
                </g>
            ))}

            <rect
                x="40"
                y="674"
                width="455"
                height="92"
                rx="16"
                fill="none"
                stroke={blue}
                strokeWidth="3"
            />
            {[68, 207, 346].map((x, i) => (
                <rect
                    key={`history-${i}`}
                    x={x}
                    y="694"
                    width="120"
                    height="54"
                    rx="10"
                    fill="none"
                    stroke={blue}
                    strokeWidth="2.5"
                />
            ))}
            <rect
                x="520"
                y="674"
                width="350"
                height="92"
                rx="16"
                fill="none"
                stroke={purple}
                strokeWidth="4"
            />
            <rect
                x="900"
                y="674"
                width="250"
                height="92"
                rx="16"
                fill="none"
                stroke={warm}
                strokeWidth="3"
            />
            <VectorArrow
                x1={495}
                y1={720}
                x2={520}
                y2={720}
                color={line}
                strokeWidth={4}
                arrowSize={6}
            />
            <path d="M 1025 766 V 784 H 478 V 720" fill="none" stroke={warm} strokeWidth="4" />
            <VectorArrow
                x1={478}
                y1={720}
                x2={458}
                y2={720}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />

            {/* One delayed-scaling input pass branches to today's codes and tomorrow's history. */}
            <rect
                x="80"
                y="364"
                width="250"
                height="126"
                rx="18"
                fill="none"
                stroke={blue}
                strokeWidth="4"
            />
            <rect
                x="461"
                y="340"
                width="286"
                height="100"
                rx="18"
                fill="none"
                stroke={green}
                strokeWidth="4"
            />
            <rect
                x="461"
                y="500"
                width="286"
                height="100"
                rx="18"
                fill="none"
                stroke={warm}
                strokeWidth="4"
            />
            <rect
                x="857"
                y="340"
                width="256"
                height="100"
                rx="18"
                fill="none"
                stroke={purple}
                strokeWidth="4"
            />
            <rect
                x="857"
                y="500"
                width="256"
                height="100"
                rx="18"
                fill="none"
                stroke={warm}
                strokeWidth="4"
            />
            <VectorArrow
                x1={330}
                y1={410}
                x2={461}
                y2={392}
                color={green}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={330}
                y1={450}
                x2={461}
                y2={550}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={747}
                y1={390}
                x2={857}
                y2={390}
                color={purple}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={747}
                y1={550}
                x2={857}
                y2={550}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={1025}
                y1={600}
                x2={1025}
                y2={674}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={870}
                y1={694}
                x2={747}
                y2={436}
                color={purple}
                strokeWidth={4}
                arrowSize={7}
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
                    text="Where scaling reads the tensor"
                    size={48}
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={40}
                    y={108}
                    width={1120}
                    height={labelHeight(42)}
                    text="CURRENT · derive scale from this tensor"
                    size={42}
                    color={blue}
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={44}
                    y={194}
                    width={190}
                    height={labelHeight(42)}
                    text="Read X"
                    size={42}
                    align="center"
                    color={blue}
                />
                <PaddedLabel
                    c={c}
                    x={274}
                    y={194}
                    width={190}
                    height={labelHeight(42)}
                    text="amax"
                    size={42}
                    align="center"
                    color={warm}
                />
                <PaddedLabel
                    c={c}
                    x={504}
                    y={194}
                    width={190}
                    height={labelHeight(42)}
                    text="Read X"
                    size={42}
                    align="center"
                    color={blue}
                />
                <PaddedLabel
                    c={c}
                    x={734}
                    y={194}
                    width={190}
                    height={labelHeight(42)}
                    text="write Q"
                    size={42}
                    align="center"
                    color={green}
                />
                <PaddedLabel
                    c={c}
                    x={964}
                    y={194}
                    width={190}
                    height={labelHeight(42)}
                    text="GEMM"
                    size={42}
                    align="center"
                    color={purple}
                />

                <PaddedLabel
                    c={c}
                    x={40}
                    y={278}
                    width={1120}
                    height={labelHeight(42)}
                    text="DELAYED · history H_t chooses the current scale"
                    size={42}
                    color={blue}
                    weight={720}
                    math
                />
                <PaddedLabel
                    c={c}
                    x={85}
                    y={394}
                    width={240}
                    height={labelHeight(42)}
                    text="read X"
                    size={42}
                    color={blue}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={466}
                    y={358}
                    width={276}
                    height={labelHeight(42)}
                    text="cast with S_t"
                    size={42}
                    color={green}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={466}
                    y={518}
                    width={276}
                    height={labelHeight(42)}
                    text="amax_t"
                    size={42}
                    color={warm}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={862}
                    y={358}
                    width={246}
                    height={labelHeight(42)}
                    text="write Q"
                    size={42}
                    color={purple}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={862}
                    y={518}
                    width={246}
                    height={labelHeight(42)}
                    text="record a_t"
                    size={42}
                    color={warm}
                    align="center"
                    math
                />

                <PaddedLabel
                    c={c}
                    x={68}
                    y={685}
                    width={120}
                    height={labelHeight(40)}
                    text="a_{t−3}"
                    size={40}
                    color={blue}
                    align="center"
                    math
                    paddingX={4}
                />
                <PaddedLabel
                    c={c}
                    x={207}
                    y={685}
                    width={120}
                    height={labelHeight(40)}
                    text="a_{t−2}"
                    size={40}
                    color={blue}
                    align="center"
                    math
                    paddingX={4}
                />
                <PaddedLabel
                    c={c}
                    x={346}
                    y={685}
                    width={120}
                    height={labelHeight(40)}
                    text="a_{t−1}"
                    size={40}
                    color={blue}
                    align="center"
                    math
                    paddingX={4}
                />
                <PaddedLabel
                    c={c}
                    x={520}
                    y={684}
                    width={350}
                    height={labelHeight(40)}
                    text="S_t=max(H_t)/448"
                    size={40}
                    color={purple}
                    weight={710}
                    align="center"
                    math
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={905}
                    y={688}
                    width={240}
                    height={labelHeight(40)}
                    text="a_t → H_{t+1}"
                    size={40}
                    color={warm}
                    align="center"
                    math
                    paddingX={4}
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
