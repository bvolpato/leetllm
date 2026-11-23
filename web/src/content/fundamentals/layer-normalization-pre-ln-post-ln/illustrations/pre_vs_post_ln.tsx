import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    renderMathSvg,
    type ThemeMode,
} from 'vizmatic'

export const width = 520
export const height = 578
export const alt =
    'Two stacked computational graphs compare normalization placement. Pre-LN sends x through LN and the sublayer F while a blue identity skip bypasses both and reaches the addition. Post-LN sends x through F, adds the skip, and then routes the whole sum through LN. Their Jacobians are I plus J F times J LN, and J LN times the quantity I plus J F, respectively.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const skip = getReadableToneColor('blue', c, c.bg)
    const norm = getReadableToneColor('purple', c, c.bg)
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        size = 23,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
    ) => (
        <CanvasItem x={x} y={y} width={w} height={36}>
            <TextLabel c={c} text={text} fontSize={size} color={color} width="100%" align={align} />
        </CanvasItem>
    )
    const lanes = [true, false].map((pre) => {
        const top = pre ? 16 : 300
        const nodes = pre
            ? [
                  { x: 24, w: 56, text: 'x' },
                  { x: 110, w: 68, text: 'LN' },
                  { x: 210, w: 64, text: 'F' },
                  { x: 310, w: 52, text: '+' },
                  { x: 404, w: 88, text: 'y' },
              ]
            : [
                  { x: 24, w: 56, text: 'x' },
                  { x: 110, w: 68, text: 'F' },
                  { x: 210, w: 64, text: '+' },
                  { x: 310, w: 52, text: 'LN' },
                  { x: 404, w: 88, text: 'y' },
              ]
        const add = pre ? 336 : 242
        const math = renderMathSvg(pre ? 'J=I+J_F J_{\\mathrm{LN}}' : 'J=J_{\\mathrm{LN}}(I+J_F)', {
            fontSize: 28,
            color: c.textPrimary,
        })
        return (
            <React.Fragment key={pre ? 'pre' : 'post'}>
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ position: 'absolute', left: 0, top: 0 }}
                >
                    {nodes.slice(0, -1).map((node, i) => (
                        <g key={`main-${i}`}>
                            <VectorArrow
                                x1={node.x + node.w}
                                y1={top + 92}
                                x2={nodes[i + 1].x}
                                y2={top + 92}
                                color={
                                    node.text === '+' || (!pre && node.text === 'LN')
                                        ? skip
                                        : c.textSecondary
                                }
                                strokeWidth={2.5}
                                arrowSize={2.2}
                            />
                        </g>
                    ))}
                    <VectorSegment
                        x1={52}
                        y1={top + 121}
                        x2={52}
                        y2={top + 174}
                        color={skip}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    <VectorSegment
                        x1={52}
                        y1={top + 174}
                        x2={add}
                        y2={top + 174}
                        color={skip}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    <VectorArrow
                        x1={add}
                        y1={top + 174}
                        x2={add}
                        y2={top + 121}
                        color={skip}
                        strokeWidth={3}
                        arrowSize={2.2}
                    />
                    {nodes.map((node) => (
                        <g key={`node-${node.x}`}>
                            <SvgFrame
                                c={c}
                                x={node.x}
                                y={top + 63}
                                width={node.w}
                                height={58}
                                rx={5}
                                fill={c.bgSubtle}
                                stroke={
                                    node.text === 'LN'
                                        ? norm
                                        : node.text === '+' || node.text === 'y'
                                          ? skip
                                          : c.textSecondary
                                }
                                strokeWidth={2}
                            />
                        </g>
                    ))}
                </svg>
                {label(24, top, 160, pre ? 'Pre-LN' : 'Post-LN', 27)}
                {label(
                    176,
                    top + 2,
                    316,
                    pre ? 'y = x + F(LN(x))' : 'y = LN(x + F(x))',
                    23,
                    c.textSecondary,
                    'right',
                )}
                {nodes.map((node) =>
                    label(
                        node.x,
                        top + 75,
                        node.w,
                        node.text,
                        26,
                        node.text === 'LN' ? norm : c.textPrimary,
                        'center',
                    ),
                )}
                {label(78, top + 138, 226, 'identity skip', 21, skip)}
                <CanvasItem x={24} y={top + 213} width={math.width} height={math.height}>
                    <img
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(math.svg)}`}
                        width={math.width}
                        height={math.height}
                        alt={
                            pre
                                ? 'J equals I plus J F times J LN'
                                : 'J equals J LN times I plus J F in parentheses'
                        }
                    />
                </CanvasItem>
            </React.Fragment>
        )
    })
    return (
        <Board c={c} width={width} height={height}>
            {lanes}
        </Board>
    )
}

export default create('dark')
