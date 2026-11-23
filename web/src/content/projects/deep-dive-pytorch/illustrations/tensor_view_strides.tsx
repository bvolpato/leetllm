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
export const height = 680
export const alt =
    'Six int64 elements occupy 48 bytes. The original view has shape [2,3] and strides (3,1); its transpose has shape [3,2] and strides (1,3). Highlighted value 3 is x[1,0] and y[0,1], both at element offset 3 and byte offset 24.'

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
    const views = [
        {
            x: 45,
            y: 295,
            rows: [
                [0, 1, 2],
                [3, 4, 5],
            ],
            color: 'blue' as const,
        },
        {
            x: 405,
            y: 255,
            rows: [
                [0, 3],
                [1, 4],
                [2, 5],
            ],
            color: 'green' as const,
        },
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
                        {Array.from({ length: 6 }, (_, i) => (
                            <rect
                                key={i}
                                x={80 + i * 80}
                                y="110"
                                width="75"
                                height="65"
                                rx="5"
                                fill={i === 3 ? fill('purple') : c.bgCard}
                                stroke={i === 3 ? tone('purple') : c.border}
                                strokeWidth="2"
                            />
                        ))}
                        {views.map((v) =>
                            v.rows.map((row, r) =>
                                row.map((val, col) => (
                                    <rect
                                        key={v.x + '-' + r + '-' + col}
                                        x={v.x + col * 80}
                                        y={v.y + r * 80}
                                        width="75"
                                        height="75"
                                        rx="5"
                                        fill={val === 3 ? fill('purple') : c.bgCard}
                                        stroke={val === 3 ? tone('purple') : tone(v.color)}
                                        strokeWidth="2"
                                    />
                                )),
                            ),
                        )}
                    </svg>
                ),
            }),
            label(c, 'Two views share one 48-byte allocation', 20, 20, 600, 28, c.textPrimary, 700),
            label(
                c,
                'Shared int64 storage · 8 bytes per element',
                25,
                68,
                590,
                23,
                c.textSecondary,
            ),
            ...Array.from({ length: 6 }, (_, i) =>
                label(
                    c,
                    String(i),
                    85 + i * 80,
                    122,
                    65,
                    30,
                    i === 3 ? tone('purple') : c.textPrimary,
                    650,
                ),
            ),
            label(c, 'x · shape [2,3]', 30, 215, 280, 26, tone('blue'), 650),
            label(c, 'y = xᵀ · [3,2]', 360, 182, 260, 26, tone('green'), 650),
            label(c, 'stride (3,1)', 30, 255, 280, 24, c.textSecondary),
            label(c, 'stride (1,3)', 360, 222, 260, 24, c.textSecondary),
            ...views.flatMap((v) =>
                v.rows.flatMap((row, r) =>
                    row.map((val, col) =>
                        label(
                            c,
                            String(val),
                            v.x + col * 80 + 5,
                            v.y + r * 80 + 18,
                            65,
                            30,
                            val === 3 ? tone('purple') : c.textPrimary,
                            650,
                        ),
                    ),
                ),
            ),
            label(c, 'x[1,0] = y[0,1] = 3', 25, 540, 590, 28, tone('purple'), 650),
            label(c, 'Element offset 3 → 3 × 8 = 24 bytes', 25, 590, 590, 26, c.textPrimary, 650),
            label(
                c,
                'Transpose changes strides; the bytes stay put',
                25,
                637,
                590,
                23,
                c.textSecondary,
            ),
        ],
    })
}

export default create()
