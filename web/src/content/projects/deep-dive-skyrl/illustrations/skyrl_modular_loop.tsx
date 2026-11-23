import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    getToneFill,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 640
export const height = 665
export const alt =
    'Five toy response positions align token IDs, masks, and rewards. The environment observation at position 2 stays in context with mask zero. Turn rewards occur at action endpoints 1 and 4.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    size = 24,
    color = c.textPrimary,
    weight = 500,
    align: 'left' | 'center' | 'right' = 'center',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * 1.6,
        children: (
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={size}
                fontWeight={weight}
                color={color}
                align={align}
            />
        ),
    })
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)
    const rows = [
        ['0', 'attempt', '11', '1', '0'],
        ['1', 'attempt', '12', '1', '−0.2'],
        ['2', 'observation', '90', '0', '0'],
        ['3', 'repair', '21', '1', '0'],
        ['4', 'repair', '22', '1', '+1.0'],
    ]
    const cols = [
        { x: 25, w: 65 },
        { x: 95, w: 180 },
        { x: 280, w: 100 },
        { x: 385, w: 100 },
        { x: 490, w: 125 },
    ]
    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {rows.map((r, i) => (
                            <rect
                                key={i}
                                x="25"
                                y={180 + i * 70}
                                width="590"
                                height="65"
                                rx="6"
                                fill={fill(i === 2 ? 'warm' : 'blue')}
                            />
                        ))}
                    </svg>
                ),
            }),
            label(c, 'Align tokens, masks and turn rewards', 20, 20, 600, 28, c.textPrimary, 700),
            label(c, 'Rewards occur at action endpoints', 25, 78, 590, 24, c.textSecondary),
            ...['Pos', 'Origin', 'ID', 'Mask', 'Reward'].map((s, i) =>
                label(c, s, cols[i].x, 136, cols[i].w, 24, c.textPrimary, 650),
            ),
            ...rows.flatMap((r, i) =>
                r.map((s, j) =>
                    label(
                        c,
                        s,
                        cols[j].x,
                        197 + i * 70,
                        cols[j].w,
                        24,
                        j === 3 && i === 2 ? tone('warm') : c.textPrimary,
                        j === 3 ? 650 : 500,
                    ),
                ),
            ),
            label(
                c,
                'Observation 90 stays in context with loss mask 0',
                25,
                558,
                590,
                24,
                tone('warm'),
                650,
            ),
            label(c, 'Toy token IDs · turn-end rewards', 25, 605, 590, 23, c.textSecondary),
        ],
    })
}

export default create()
