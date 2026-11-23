import React from 'react'
import { Board, Scene, defineIllustration, getReadableToneColor } from 'vizmatic'
import { PaddedLabel, labelHeight } from '../visual-helpers'

export const width = 1200
export const height = 800
export const alt =
    'For the same 64-element FP8 activation X, 64 code bytes plus one four-byte tensor scale total 68 bytes. Two 32-element MX groups use 64 code bytes plus two one-byte E8M0 scales, totaling 66 bytes. The scale-byte inset draws each metadata byte three times wider than each code-byte cell. E8M0 examples map 0x77 to 2 to the minus 8, 0x80 to 2, 0x00 to a positive scale, and 0xff to NaN. The MX payload is 8.25 bits per value, with scale bytes equal to 3.125 percent of the 64 code bytes.'

const illustration = defineIllustration((c) => {
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            {/* Code cells share a unit width. Scale bytes are isolated in a visibly 3x inset. */}
            {Array.from({ length: 64 }, (_, i) => (
                <rect
                    key={`tensor-byte-${i}`}
                    x={82 + i * 12.9}
                    y="172"
                    width="10.5"
                    height="54"
                    rx="2"
                    fill={i < 32 ? '#bfdbfe' : '#dbeafe'}
                    stroke={line}
                    strokeWidth="1.4"
                />
            ))}
            {Array.from({ length: 4 }, (_, i) => (
                <rect
                    key={`tensor-scale-${i}`}
                    x={970 + i * 31.5}
                    y="172"
                    width="31.5"
                    height="54"
                    rx="4"
                    fill="#fed7aa"
                    stroke={line}
                    strokeWidth="2.5"
                />
            ))}
            {Array.from({ length: 64 }, (_, i) => (
                <rect
                    key={`mx-byte-${i}`}
                    x={82 + i * 12.9}
                    y="370"
                    width="10.5"
                    height="54"
                    rx="2"
                    fill={i < 32 ? '#bbf7d0' : '#dcfce7'}
                    stroke={line}
                    strokeWidth="1.4"
                />
            ))}
            {Array.from({ length: 2 }, (_, i) => (
                <rect
                    key={`mx-scale-${i}`}
                    x={970 + i * 31.5}
                    y="370"
                    width="31.5"
                    height="54"
                    rx="4"
                    fill="#e9d5ff"
                    stroke={line}
                    strokeWidth="2.5"
                />
            ))}
            <line
                x1="494"
                y1="370"
                x2="494"
                y2="424"
                stroke={line}
                strokeWidth="2"
                strokeDasharray="7 7"
            />

            {/* The input, value, and special-code lanes remain separate. */}
            {[80, 356, 632, 908].map((x, i) => (
                <rect
                    key={`decode-${i}`}
                    x={x}
                    y="510"
                    width="248"
                    height="128"
                    rx="16"
                    fill="none"
                    stroke={[blue, green, warm, purple][i]}
                    strokeWidth="3.5"
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
                    text="Scale bytes have a measurable footprint"
                    size={48}
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={38}
                    y={104}
                    width={850}
                    height={labelHeight(42)}
                    text="Tensor-scaled X · 64 FP8 values"
                    size={42}
                    color={blue}
                    weight={710}
                />
                <PaddedLabel
                    c={c}
                    x={891}
                    y={104}
                    width={300}
                    height={labelHeight(40)}
                    text="4 B · 3× inset"
                    size={40}
                    color={warm}
                    align="center"
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={38}
                    y={228}
                    width={1124}
                    height={labelHeight(42)}
                    text="64 code bytes + 4 scale bytes = 68 bytes"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                    math
                />

                <PaddedLabel
                    c={c}
                    x={38}
                    y={300}
                    width={850}
                    height={labelHeight(42)}
                    text="MX · two groups of 32 · E8M0"
                    size={42}
                    color={green}
                    weight={710}
                />
                <PaddedLabel
                    c={c}
                    x={891}
                    y={300}
                    width={300}
                    height={labelHeight(40)}
                    text="1 B / group · 3×"
                    size={40}
                    color={purple}
                    align="center"
                    paddingX={0}
                />
                <PaddedLabel
                    c={c}
                    x={38}
                    y={428}
                    width={1124}
                    height={labelHeight(42)}
                    text="64 code bytes + 2 scale bytes = 66 bytes"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                    math
                />

                <PaddedLabel
                    c={c}
                    x={84}
                    y={510}
                    width={240}
                    height={labelHeight(42)}
                    text="0x77"
                    size={42}
                    color={blue}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={360}
                    y={510}
                    width={240}
                    height={labelHeight(42)}
                    text="0x80"
                    size={42}
                    color={green}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={636}
                    y={510}
                    width={240}
                    height={labelHeight(42)}
                    text="0x00"
                    size={42}
                    color={warm}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={912}
                    y={510}
                    width={240}
                    height={labelHeight(42)}
                    text="0xff"
                    size={42}
                    color={purple}
                    align="center"
                    weight={720}
                />
                <PaddedLabel
                    c={c}
                    x={84}
                    y={574}
                    width={240}
                    height={labelHeight(42)}
                    text="2⁻⁸"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={360}
                    y={574}
                    width={240}
                    height={labelHeight(42)}
                    text="2.0"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={636}
                    y={574}
                    width={240}
                    height={labelHeight(42)}
                    text="positive"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={912}
                    y={574}
                    width={240}
                    height={labelHeight(42)}
                    text="NaN"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={40}
                    y={654}
                    width={1120}
                    height={labelHeight(42)}
                    text="MX · 8.25 bits/value · scales add 3.125%"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
