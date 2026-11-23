import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getToneColor,
    defineIllustration,
} from 'vizmatic'

export const width = 800
export const height = 790
export const alt =
    'Three ordered states hold the 2 by 2 B weights in place as A activations move right and partial sums move down, producing 19, 22, 43, and 50. The arrays multiply A=[[1,2],[3,4]] by B=[[5,6],[7,8]]. The first completed output is 19=1×5+2×7. This conceptual schedule does not specify TPU or Trainium array geometry.'

const illustration = defineIllustration((c) => {
    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        h: number,
        fontSize: number,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 600,
        mono = false,
    ) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: h,
            children: TextLabel({
                c,
                text,
                width: '100%',
                fontSize,
                color,
                align,
                fontWeight,
                mono,
            }),
        })

    const purple = getToneColor('purple', c)
    const cyan = getToneColor('cyan', c)
    const arrow = getReadableToneColor('cyan', c)
    const xPositions = [130, 326]
    const cellWidth = 172
    const cellHeight = 64
    const rowOffset = 83
    const states = [
        {
            cycleY: 112,
            cycle: 't = 0',
            ops: ['1×5=5', 'wait', 'wait', 'wait'],
            output: ['p₀₀ = 5 in flight'],
        },
        {
            cycleY: 337,
            cycle: 't = 1–2',
            ops: ['3×5=15', '3×6=18', '4×7+15=43', '2×8+6=22'],
            output: [
                'Y₀₀ = 1×5 + 2×7',
                '= 19',
                'Y₀₁ = 1×6 + 2×8',
                '= 22',
                'Y₁₀ = 3×5 + 4×7',
                '= 43',
            ],
        },
        {
            cycleY: 562,
            cycle: 't = 3',
            ops: ['idle', 'idle', 'done 43', '4×8+18=50'],
            output: ['Y₁₁ = 3×6 + 4×8', '= 50'],
        },
    ]
    const weights = ['B₀₀ = 5', 'B₀₁ = 6', 'B₁₀ = 7', 'B₁₁ = 8']
    const cellFrames = states.flatMap((state, stateIndex) =>
        Array.from({ length: 4 }, (_, index) => {
            const x = xPositions[index % 2]
            const y = state.cycleY + 23 + Math.floor(index / 2) * rowOffset
            return SvgFrame({
                key: 'pe-' + stateIndex + '-' + index,
                c,
                x,
                y,
                width: cellWidth,
                height: cellHeight,
                rx: 4,
                fill: c.bgCard,
                stroke: index < 2 ? purple : cyan,
                strokeWidth: 1.5,
            })
        }),
    )
    const arrows = states.flatMap((state) => {
        const firstRowY = state.cycleY + 23
        const secondRowY = firstRowY + rowOffset
        return [
            <VectorArrow
                x1={302}
                y1={firstRowY + 32}
                x2={323}
                y2={firstRowY + 32}
                color={arrow}
                strokeWidth={2.5}
                arrowSize={4}
            />,
            <VectorArrow
                x1={302}
                y1={secondRowY + 32}
                x2={323}
                y2={secondRowY + 32}
                color={arrow}
                strokeWidth={2.5}
                arrowSize={4}
            />,
            <VectorArrow
                x1={216}
                y1={firstRowY + cellHeight}
                x2={216}
                y2={secondRowY - 2}
                color={arrow}
                strokeWidth={2.5}
                arrowSize={4}
            />,
            <VectorArrow
                x1={412}
                y1={firstRowY + cellHeight}
                x2={412}
                y2={secondRowY - 2}
                color={arrow}
                strokeWidth={2.5}
                arrowSize={4}
            />,
        ]
    })
    const cellText = states.flatMap((state, stateIndex) =>
        state.ops.flatMap((operation, index) => {
            const x = xPositions[index % 2]
            const y = state.cycleY + 23 + Math.floor(index / 2) * rowOffset
            return [
                label(
                    weights[index],
                    x + 4,
                    y + 4,
                    cellWidth - 8,
                    25,
                    26,
                    c.textPrimary,
                    'center',
                    700,
                    true,
                ),
                label(
                    operation,
                    x + 4,
                    y + 35,
                    cellWidth - 8,
                    25,
                    26,
                    c.textPrimary,
                    'center',
                    600,
                    true,
                ),
            ]
        }),
    )
    const outputText = states.flatMap((state) => {
        const x = 526
        const y = state.cycleY + (state.output.length > 2 ? 16 : 66)
        return state.output.map((line, index) =>
            label(
                line,
                x,
                y + index * 29,
                260,
                27,
                28,
                c.textPrimary,
                'left',
                index % 2 === 0 ? 700 : 600,
            ),
        )
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: (
                        <svg
                            width={width}
                            height={height}
                            viewBox={'0 0 ' + width + ' ' + height}
                            role="presentation"
                            aria-hidden="true"
                        >
                            {cellFrames}
                            {arrows}
                        </svg>
                    ),
                }),
                label(
                    'Weights stay; products accumulate',
                    20,
                    10,
                    760,
                    40,
                    36,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label(
                    'A = [[1,2],[3,4]] · B = [[5,6],[7,8]]',
                    20,
                    50,
                    760,
                    30,
                    28,
                    c.textPrimary,
                    'center',
                    650,
                    true,
                ),
                label('Activations →', 130, 77, 172, 25, 26, c.textPrimary, 'center', 650),
                label('Partial sums ↓', 326, 77, 172, 25, 26, c.textPrimary, 'center', 650),
                ...states.map((state) =>
                    label(
                        state.cycle,
                        22,
                        state.cycleY + 73,
                        100,
                        32,
                        30,
                        c.textPrimary,
                        'center',
                        750,
                        true,
                    ),
                ),
                ...cellText,
                ...outputText,
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
