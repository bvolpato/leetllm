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
export const height = 745
export const alt =
    'The exponential curve from average loss in nats to perplexity, for losses 0 to 4.7. A staircase climbs it through perplexity 5, 10, 20, 40, and 80. Every horizontal step is ln 2, about 0.693 nats, and every step doubles perplexity.'

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
    const x = (loss: number) => 80 + (loss / 4.7) * 520,
        y = (ppl: number) => 535 - (ppl / 110) * 370
    const curve = Array.from({ length: 200 }, (_, i) => {
        const l = (i / 199) * 4.7
        return [x(l), y(Math.exp(l))]
    })
    const stairs = [5, 10, 20, 40, 80]
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
                        {[0, 20, 40, 80, 100].map((v) => (
                            <line
                                key={v}
                                x1="80"
                                x2="600"
                                y1={y(v)}
                                y2={y(v)}
                                stroke={c.border}
                                strokeWidth="1"
                            />
                        ))}
                        <polyline
                            points={curve.map((p) => p.join(',')).join(' ')}
                            fill="none"
                            stroke={tone('blue')}
                            strokeWidth="3"
                        />
                        {stairs.map((p, i) => (
                            <g key={p}>
                                <circle cx={x(Math.log(p))} cy={y(p)} r="6" fill={tone('blue')} />
                                {i < 4 && (
                                    <path
                                        d={`M${x(Math.log(p))} ${y(p)} H${x(Math.log(stairs[i + 1]))} V${y(stairs[i + 1])}`}
                                        fill="none"
                                        stroke={tone('warm')}
                                        strokeWidth="2"
                                        strokeDasharray="5 4"
                                    />
                                )}
                            </g>
                        ))}
                    </svg>
                ),
            }),
            label(
                c,
                'Equal loss increments double perplexity',
                20,
                20,
                600,
                29,
                c.textPrimary,
                700,
            ),
            label(c, 'PPL = exp(mean loss)', 25, 78, 590, 26, c.textSecondary),
            ...[0, 20, 40, 80, 100].map((v) =>
                label(c, String(v), 10, y(v) - 15, 60, 24, c.textSecondary, 500, 'right'),
            ),
            label(c, 'PPL', 25, 115, 590, 24, c.textSecondary, 500, 'left'),
            ...[0, 1, 2, 3, 4].map((v) =>
                label(c, String(v), x(v) - 30, 550, 60, 24, c.textSecondary),
            ),
            label(c, 'Mean loss (nats)', 25, 598, 590, 25, c.textSecondary),
            label(c, 'Each step: +ln 2 ≈ 0.693 nats', 25, 650, 590, 27, tone('warm'), 650),
            label(c, 'PPL 5 → 10 → 20 → 40 → 80', 25, 696, 590, 26, tone('blue'), 650),
        ],
    })
}

export default create()
