import React from 'react'
import { CanvasItem, TextLabel } from 'vizmatic'

type LabelColors = React.ComponentProps<typeof TextLabel>['c']

export type LabelAlign = 'left' | 'center' | 'right'

export interface PaddedLabelProps {
    c: LabelColors
    x: number
    y: number
    width: number
    height: number
    text: string
    size?: number
    color?: string
    align?: LabelAlign
    weight?: number
    id?: string
    math?: boolean
    paddingX?: number
}

let labelSequence = 0

/** Measure each complete Satori label inside its own padded geometry box. */
export function PaddedLabel({
    c,
    x,
    y,
    width,
    height,
    text,
    size = 42,
    color = c.textPrimary,
    align = 'left',
    weight = 650,
    id,
    math = false,
    paddingX = 14,
}: PaddedLabelProps) {
    const labelId = id ?? `low-precision-label-${labelSequence++}`
    const justifyContent = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'

    return (
        <CanvasItem x={x} y={y} width={width} height={height}>
            <div
                data-qa-label-box={labelId}
                data-qa-padding-x={paddingX}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent,
                    width: '100%',
                    height: '100%',
                    paddingLeft: paddingX,
                    paddingRight: paddingX,
                }}
            >
                <div data-qa-label-advance={labelId} style={{ display: 'flex' }}>
                    <TextLabel c={c} text={text} fontSize={size} fontWeight={weight} color={color} math={math} />
                </div>
            </div>
        </CanvasItem>
    )
}

export const labelHeight = (size: number) => Math.ceil(size * 1.58)
