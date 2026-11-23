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
    'The left number line magnifies zero to the smallest E4M3 subnormal d = 2⁻⁹. The RNE midpoint 0.5d maps to signed zero, while 0.75d maps to d. The separate right range maps an unscaled input 500 with S = 1 to the finite E4M3 code 448 and reconstructs 448.'

const illustration = defineIllustration((c) => {
    const ink = c.textPrimary
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const critical = getReadableToneColor('critical', c, c.bg)

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <line x1="62" y1="126" x2="62" y2="750" stroke={line} strokeWidth="2" />
            <line x1="682" y1="126" x2="682" y2="750" stroke={line} strokeWidth="2" />

            {/* A unit interval measured in subnormal steps: 0, 0.5d, 0.75d, d. */}
            <line x1="132" y1="316" x2="632" y2="316" stroke={line} strokeWidth="4" />
            {[132, 382, 507, 632].map((x, i) => (
                <line
                    key={`subnormal-tick-${i}`}
                    x1={x}
                    y1="302"
                    x2={x}
                    y2="330"
                    stroke={line}
                    strokeWidth="4"
                />
            ))}
            <SvgPoint cx={132} cy={316} r={8} fill={ink} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={382} cy={316} r={10} fill={warm} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={507} cy={316} r={10} fill={blue} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={632} cy={316} r={8} fill={ink} stroke={c.bg} strokeWidth={3} />

            <line x1="132" y1="526" x2="632" y2="526" stroke={line} strokeWidth="4" />
            <SvgPoint cx={132} cy={526} r={10} fill={warm} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={632} cy={526} r={10} fill={green} stroke={c.bg} strokeWidth={3} />
            <VectorArrow
                x1={382}
                y1={332}
                x2={150}
                y2={510}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={507}
                y1={332}
                x2={614}
                y2={510}
                color={blue}
                strokeWidth={4}
                arrowSize={6}
            />

            {/* One shared original-value transform: x=0 at 748, x=500 at 1128. */}
            <line x1="748" y1="316" x2="1128" y2="316" stroke={line} strokeWidth="4" />
            <line x1="748" y1="302" x2="748" y2="330" stroke={line} strokeWidth="4" />
            <line x1="1088.48" y1="292" x2="1088.48" y2="340" stroke={critical} strokeWidth="5" />
            <VectorArrow
                x1={1119}
                y1={316}
                x2={1098}
                y2={316}
                color={warm}
                strokeWidth={4}
                arrowSize={6}
            />
            <SvgPoint cx={1088.48} cy={316} r={10} fill={critical} stroke={c.bg} strokeWidth={3} />
            <SvgPoint cx={1128} cy={316} r={9} fill={warm} stroke={c.bg} strokeWidth={3} />
            <line x1="1088.48" y1="268" x2="1088.48" y2="291" stroke={critical} strokeWidth="3" />
            <line x1="1128" y1="325" x2="1128" y2="349" stroke={warm} strokeWidth="3" />

            <path d="M748 548 H1128" fill="none" stroke={line} strokeWidth="3" />
            <circle cx="748" cy="548" r="8" fill={line} />
            <circle cx="1088.48" cy="548" r="8" fill={critical} />
            <circle cx="1128" cy="548" r="8" fill={warm} />
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
                    y={24}
                    width={1116}
                    height={labelHeight(48)}
                    text="Rounding meets the finite grid at both ends."
                    size={48}
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={82}
                    y={116}
                    width={580}
                    height={labelHeight(44)}
                    text="Subnormal step d = 2⁻⁹"
                    size={44}
                    color={blue}
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={720}
                    y={116}
                    width={430}
                    height={labelHeight(44)}
                    text="Unscaled · S = 1"
                    size={44}
                    color={warm}
                    weight={720}
                />

                <PaddedLabel
                    c={c}
                    x={82}
                    y={225}
                    width={116}
                    height={labelHeight(42)}
                    text="0"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={323}
                    y={225}
                    width={118}
                    height={labelHeight(42)}
                    text="0.5d"
                    size={42}
                    align="center"
                    color={warm}
                    paddingX={10}
                />
                <PaddedLabel
                    c={c}
                    x={435}
                    y={225}
                    width={144}
                    height={labelHeight(42)}
                    text="0.75d"
                    size={42}
                    align="center"
                    color={blue}
                    paddingX={10}
                />
                <PaddedLabel
                    c={c}
                    x={572}
                    y={225}
                    width={120}
                    height={labelHeight(42)}
                    text="d"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={82}
                    y={548}
                    width={340}
                    height={labelHeight(42)}
                    text="signed zero"
                    size={42}
                    color={warm}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={592}
                    y={548}
                    width={80}
                    height={labelHeight(42)}
                    text="d"
                    size={42}
                    color={green}
                    align="center"
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={100}
                    y={606}
                    width={470}
                    height={labelHeight(42)}
                    text="RNE output"
                    size={42}
                    color={ink}
                />
                <PaddedLabel
                    c={c}
                    x={86}
                    y={675}
                    width={528}
                    height={labelHeight(42)}
                    text="Tie selects signed zero."
                    size={42}
                />

                <PaddedLabel
                    c={c}
                    x={984}
                    y={202}
                    width={208}
                    height={labelHeight(42)}
                    text="q = 448"
                    size={42}
                    color={critical}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={993}
                    y={350}
                    width={190}
                    height={labelHeight(42)}
                    text="x = 500"
                    size={42}
                    color={warm}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={708}
                    y={336}
                    width={104}
                    height={labelHeight(42)}
                    text="0"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={741}
                    y={468}
                    width={425}
                    height={labelHeight(42)}
                    text="500 → 448 → 448"
                    size={42}
                    weight={700}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={742}
                    y={564}
                    width={424}
                    height={labelHeight(42)}
                    text="Input · 0–500"
                    size={42}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={718}
                    y={620}
                    width={445}
                    height={labelHeight(42)}
                    text="Round → mode"
                    size={42}
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
