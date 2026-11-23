import React from 'react'
import { Board, Scene, defineIllustration, getReadableToneColor } from 'vizmatic'
import { PaddedLabel, labelHeight } from '../visual-helpers'

export const width = 1200
export const height = 800
export const alt =
    'One logical 32 by 32 high-precision matrix can be quantized with horizontal 1 by 32 groups or vertical 32 by 1 groups. The highlighted horizontal group contains all 32 values of row i; the highlighted vertical group contains all 32 values of column j. Transposing encoded bytes carries their existing group ownership, so derive the columnwise representation from the original wider matrix.'

const illustration = defineIllustration((c) => {
    const line = '#64748b'
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const mutedFill = 'none'

    const grid = (x: number, y: number, highlight: 'row' | 'column', id: string) =>
        Array.from({ length: 1024 }, (_, index) => {
            const r = Math.floor(index / 32)
            const col = index % 32
            const active = highlight === 'row' ? r === 15 : col === 20
            const fill = active ? (highlight === 'row' ? '#bfdbfe' : '#fed7aa') : mutedFill
            const stroke = line
            return (
                <rect
                    key={`${id}-${index}`}
                    x={x + col * 7.5}
                    y={y + r * 7.5}
                    width="6.4"
                    height="6.4"
                    rx="1"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="0.55"
                />
            )
        })

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            {grid(112, 286, 'row', 'row-grid')}
            {grid(648, 286, 'column', 'column-grid')}
            <line x1="112" y1="550" x2="352" y2="550" stroke={blue} strokeWidth="4" />
            <line x1="648" y1="550" x2="888" y2="550" stroke={warm} strokeWidth="4" />
            <line x1="112" y1="402" x2="352" y2="402" stroke={blue} strokeWidth="8" />
            <line x1="798" y1="286" x2="798" y2="526" stroke={warm} strokeWidth="8" />
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
                    text="Scale groups follow the matrix orientation"
                    size={48}
                    weight={730}
                />
                <PaddedLabel
                    c={c}
                    x={40}
                    y={106}
                    width={1120}
                    height={labelHeight(42)}
                    text="One logical 32 × 32 matrix of high-precision values"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                    math
                />
                <PaddedLabel
                    c={c}
                    x={32}
                    y={182}
                    width={400}
                    height={labelHeight(44)}
                    text="Rowwise · 1 × 32"
                    size={44}
                    color={blue}
                    align="center"
                    weight={720}
                    math
                />
                <PaddedLabel
                    c={c}
                    x={573}
                    y={182}
                    width={390}
                    height={labelHeight(44)}
                    text="Column · 32 × 1"
                    size={44}
                    color={warm}
                    align="center"
                    weight={720}
                    math
                />
                <PaddedLabel
                    c={c}
                    x={42}
                    y={566}
                    width={380}
                    height={labelHeight(42)}
                    text="row i · 32 values"
                    size={42}
                    color={blue}
                    align="center"
                    weight={700}
                    math
                />
                <PaddedLabel
                    c={c}
                    x={538}
                    y={566}
                    width={460}
                    height={labelHeight(42)}
                    text="column j · 32 values"
                    size={42}
                    color={warm}
                    align="center"
                    weight={700}
                    math
                />
                <PaddedLabel
                    c={c}
                    x={56}
                    y={650}
                    width={510}
                    height={labelHeight(42)}
                    text="32 across row i"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={634}
                    y={650}
                    width={510}
                    height={labelHeight(42)}
                    text="32 down column j"
                    size={42}
                    color={c.textPrimary}
                    align="center"
                />
                <PaddedLabel
                    c={c}
                    x={56}
                    y={722}
                    width={1088}
                    height={labelHeight(42)}
                    text="Transpose carries the original scale ownership."
                    size={42}
                    color={c.textPrimary}
                    align="center"
                    weight={710}
                />
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
