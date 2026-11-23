import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableColor,
    getReadableTextColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const alt =
    'Eight physical blocks hold C in P2 through P4 and B in P5, leaving two free pairs at P0/P1 and P6/P7. A contiguous three-block request for D cannot fit. Paging maps D logical blocks 0, 1, and 2 to P0, P1, and P6, leaving P7 free while B and C keep their blocks. Each illustrative block holds 16 tokens; final-block slack remains owned.'

export const width = 900
export const height = 740

const blockX = (index: number) => 64 + index * 99
const blockWidth = 88
const blockHeight = 84
const logicalBlockIndices = [0, 1, 2]
const logicalToPhysical = [0, 1, 6]

function label(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 500,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(38, fontSize + 8),
        children: TextLabel({ c, text: value, fontSize, fontWeight, color, align, width: w }),
    })
}

function blockFill(c: ReturnType<typeof getThemeColors>, owner: string) {
    if (owner === 'C') return c.secondary
    if (owner === 'B') return c.positive
    if (owner === 'D') return c.primary
    return c.bgCardAlt
}

function rowShapes(c: ReturnType<typeof getThemeColors>, y: number, owners: string[]) {
    return owners.map((owner, index) =>
        SvgFrame({
            key: `${y}-${index}`,
            c,
            x: blockX(index),
            y,
            width: blockWidth,
            height: blockHeight,
            rx: 8,
            fill: blockFill(c, owner),
            stroke: owner === 'free' ? c.borderLight : blockFill(c, owner),
            strokeWidth: 2,
        }),
    )
}

function rowLabels(c: ReturnType<typeof getThemeColors>, y: number, owners: string[]) {
    return owners.flatMap((owner, index) => {
        const fill = blockFill(c, owner)
        const fg = owner === 'free' ? c.textPrimary : getReadableTextColor(fill, c, c.bg)
        const ownerFg = owner === 'free' ? c.textSecondary : fg
        return [
            label(c, `P${index}`, blockX(index), y + 8, blockWidth, 32, fg, 'center', 700),
            label(c, owner, blockX(index), y + 44, blockWidth, 32, ownerFg, 'center', 650),
        ]
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const beforeOwners = ['free', 'free', 'C', 'C', 'C', 'B', 'free', 'free']
    const afterOwners = ['D', 'D', 'C', 'C', 'C', 'B', 'D', 'free']
    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {rowShapes(c, 158, beforeOwners)}
            {logicalBlockIndices.map((index) =>
                SvgFrame({
                    key: `logical-${index}`,
                    c,
                    x: blockX(index),
                    y: 368,
                    width: blockWidth,
                    height: 54,
                    rx: 8,
                    fill: c.primary,
                    stroke: c.primaryLight,
                    strokeWidth: 2,
                }),
            )}
            {rowShapes(c, 520, afterOwners)}
            {logicalBlockIndices.map((index) =>
                VectorArrow({
                    x1: blockX(index) + blockWidth / 2,
                    y1: 430,
                    x2: blockX(logicalToPhysical[index]) + blockWidth / 2,
                    y2: 512,
                    color: c.primaryLight,
                    strokeWidth: 5,
                }),
            )}
        </svg>
    )

    const dText = getReadableTextColor(c.primary, c, c.bg)
    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(c, 'Paging uses scattered KV blocks', 20, 14, 860, 34, c.textPrimary, 'left', 700),
        label(c, 'Logical token order stays intact.', 20, 58, 860, 31, c.textSecondary),
        label(c, 'Before D arrives', 20, 114, 860, 31, c.textPrimary, 'left', 700),
        ...rowLabels(c, 158, beforeOwners),
        label(
            c,
            'Free pairs P0/P1, P6/P7 cannot fit 3-block D.',
            20,
            258,
            860,
            31,
            getReadableColor('warning', c),
            'left',
            650,
        ),
        label(c, 'D logical blocks', 20, 322, 320, 31, c.textSecondary, 'left', 650),
        ...logicalBlockIndices.map((index) =>
            label(c, `D${index}`, blockX(index), 376, blockWidth, 32, dText, 'center', 700),
        ),
        ...rowLabels(c, 520, afterOwners),
        label(
            c,
            'B and C keep their pages; P7 stays free.',
            20,
            626,
            860,
            31,
            c.textPrimary,
            'left',
            650,
        ),
        label(
            c,
            'Block size: 16 tokens; final-block slack stays owned.',
            20,
            672,
            860,
            30,
            c.textSecondary,
        ),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

export default create('dark')
