import React from 'react'
import { Board, Scene, VectorArrow, defineIllustration, getReadableToneColor } from 'vizmatic'
import { PaddedLabel, labelHeight } from '../visual-helpers'

export const width = 1200
export const height = 800
export const alt =
    'The same raw bytes enter two E4M3 decoder conventions. The byte 0x38 has sign 0, exponent bits 0111, and fraction bits 000; bias 7 decodes it as 1.0 while bias 8 decodes it as 0.5. The byte 0x80 has sign 1, exponent 0000, and fraction 000; OCP decodes negative zero while FNUZ reserves that byte for NaN.'

const illustration = defineIllustration((c) => {
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)

    const cellX = 212
    const cellStep = 58
    const cellWidth = 48
    const bits = (values: number[], y: number, name: string) =>
        values.map((_, i) => {
            const x = cellX + i * cellStep
            const color = i === 0 ? blue : i < 5 ? green : warm
            return (
                <g key={`${name}-${i}`}>
                    <rect
                        x={x}
                        y={y}
                        width={cellWidth}
                        height="68"
                        rx="6"
                        fill={i === 0 ? '#e2e8f0' : i < 5 ? '#bfdbfe' : '#fed7aa'}
                        stroke={color}
                        strokeWidth="2.5"
                    />
                </g>
            )
        })

    const byteBits = (n: number) => Array.from({ length: 8 }, (_, i) => (n >> (7 - i)) & 1)
    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            {bits(byteBits(0x38), 190, 'byte-38')}
            {bits(byteBits(0x80), 276, 'byte-80')}
            <path
                d="M200 184 H195 V352 H200"
                fill="none"
                stroke={line}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <rect
                x="78"
                y="438"
                width="468"
                height="300"
                rx="20"
                fill="none"
                stroke={blue}
                strokeWidth="4"
            />
            <rect
                x="654"
                y="438"
                width="468"
                height="300"
                rx="20"
                fill="none"
                stroke={purple}
                strokeWidth="4"
            />
            <VectorArrow
                x1={682}
                y1={356}
                x2={334}
                y2={438}
                color={blue}
                strokeWidth={4}
                arrowSize={6}
            />
            <VectorArrow
                x1={682}
                y1={356}
                x2={888}
                y2={438}
                color={purple}
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
                    text="A byte's meaning depends on its decoder"
                    size={48}
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={212}
                    y={118}
                    width={48}
                    height={labelHeight(40)}
                    text="S"
                    size={40}
                    align="center"
                    weight={720}
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={270}
                    y={118}
                    width={232}
                    height={labelHeight(40)}
                    text="Exponent"
                    size={40}
                    align="center"
                    weight={720}
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={502}
                    y={118}
                    width={174}
                    height={labelHeight(40)}
                    text="Fraction"
                    size={40}
                    align="center"
                    weight={720}
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={34}
                    y={190}
                    width={150}
                    height={labelHeight(42)}
                    text="0x38"
                    size={42}
                    color={blue}
                    align="center"
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={34}
                    y={276}
                    width={150}
                    height={labelHeight(42)}
                    text="0x80"
                    size={42}
                    color={blue}
                    align="center"
                    weight={730}
                />
                {byteBits(0x38).map((bit, i) => (
                    <PaddedLabel
                        key={`byte-38-bit-${i}`}
                        c={c}
                        x={cellX + i * cellStep}
                        y={190}
                        width={cellWidth}
                        height={labelHeight(42)}
                        text={String(bit)}
                        size={42}
                        color="#0f172a"
                        align="center"
                        weight={720}
                        paddingX={0}
                    />
                ))}
                {byteBits(0x80).map((bit, i) => (
                    <PaddedLabel
                        key={`byte-80-bit-${i}`}
                        c={c}
                        x={cellX + i * cellStep}
                        y={276}
                        width={cellWidth}
                        height={labelHeight(42)}
                        text={String(bit)}
                        size={42}
                        color="#0f172a"
                        align="center"
                        weight={720}
                        paddingX={0}
                    />
                ))}
                <PaddedLabel
                    c={c}
                    x={98}
                    y={456}
                    width={426}
                    height={labelHeight(44)}
                    text="OCP · bias 7"
                    size={44}
                    color={blue}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={674}
                    y={456}
                    width={426}
                    height={labelHeight(44)}
                    text="FNUZ · bias 8"
                    size={44}
                    color={purple}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={98}
                    y={534}
                    width={426}
                    height={labelHeight(42)}
                    text="0x38 → 1.0"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={98}
                    y={602}
                    width={426}
                    height={labelHeight(42)}
                    text="0x80 → −0"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={674}
                    y={534}
                    width={426}
                    height={labelHeight(42)}
                    text="0x38 → 0.5"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={674}
                    y={602}
                    width={426}
                    height={labelHeight(42)}
                    text="0x80 → NaN"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={98}
                    y={672}
                    width={426}
                    height={labelHeight(42)}
                    text="signed zero"
                    size={42}
                    color={blue}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={674}
                    y={672}
                    width={426}
                    height={labelHeight(42)}
                    text="reserved NaN"
                    size={42}
                    color={purple}
                    align="center"
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
