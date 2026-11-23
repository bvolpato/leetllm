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
export const height = 625
export const alt =
    'A timeline in milliseconds with two lanes. In the Python lane on the CPU, queueing the work takes 2 ms, then Python is free to move on. In the GPU lane, the forward pass runs from 2 ms to 42 ms. A timer read right after the call stops at 2 ms. A timer read after synchronize stops at 42 ms, when the work has really finished.'

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
    const x = (ms: number) => 60 + (ms / 46) * 540
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
                        <rect x="60" y="235" width={x(2) - 60} height="50" fill={tone('blue')} />
                        <rect
                            x={x(2)}
                            y="235"
                            width={x(42) - x(2)}
                            height="50"
                            fill={fill('blue')}
                            stroke={tone('blue')}
                            strokeWidth="2"
                        />
                        <rect
                            x={x(2)}
                            y="400"
                            width={x(42) - x(2)}
                            height="50"
                            fill={tone('warm')}
                        />
                        {[235, 400].map((y) => (
                            <g key={y}>
                                <line
                                    x1={x(2)}
                                    x2={x(2)}
                                    y1={y}
                                    y2={y + 50}
                                    stroke={tone('critical')}
                                    strokeWidth="2"
                                    strokeDasharray="6 5"
                                />
                                <line
                                    x1={x(42)}
                                    x2={x(42)}
                                    y1={y}
                                    y2={y + 50}
                                    stroke={tone('green')}
                                    strokeWidth="2"
                                />
                            </g>
                        ))}
                        <line
                            x1="60"
                            x2="600"
                            y1="505"
                            y2="505"
                            stroke={c.textSecondary}
                            strokeWidth="2"
                        />
                    </svg>
                ),
            }),
            label(c, 'Measure completed GPU work', 20, 20, 600, 29, c.textPrimary, 700),
            label(
                c,
                'The CPU returns before its GPU work finishes',
                25,
                78,
                590,
                24,
                c.textSecondary,
            ),
            label(c, 'Return 2 ms', 25, 132, 250, 27, tone('critical'), 650, 'left'),
            label(c, 'Complete 42 ms', 330, 132, 285, 27, tone('green'), 650, 'right'),
            label(c, 'Python on CPU', 25, 184, 590, 26, c.textPrimary, 650, 'left'),
            label(c, 'Caller free / synchronize()', 110, 248, 420, 24, c.textSecondary),
            label(c, 'Forward kernels on GPU', 25, 345, 590, 26, c.textPrimary, 650, 'left'),
            label(c, '40 ms of GPU work', 130, 411, 390, 26, c.bg, 650),
            ...[0, 10, 20, 30, 40].map((v) =>
                label(c, String(v), x(v) - 30, 521, 60, 24, c.textSecondary),
            ),
            label(c, 'Milliseconds after the call', 25, 575, 590, 25, c.textSecondary),
        ],
    })
}

export default create()
