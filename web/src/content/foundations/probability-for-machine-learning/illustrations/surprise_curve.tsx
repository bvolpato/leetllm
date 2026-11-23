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
export const height = 740
export const alt =
    'The curve of loss equals negative log p, plotted against the probability a model gave the token that actually came next. At probability 0.9 the loss is 0.105 nats, at 0.5 it is 0.693, at 0.1 it is 2.303, and at 0.01 it is 4.605. The curve rises sharply as the probability approaches zero, so being confidently wrong is punished far more than being unsure.'

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
    const x = (p: number) => 80 + p * 520,
        y = (loss: number) => 535 - (loss / 5) * 360
    const points = Array.from({ length: 400 }, (_, i) => {
        const p = 0.0068 + (i / 399) * 0.9932
        return [x(p), y(-Math.log(p))]
    })
    const marks = [0.01, 0.1, 0.5, 0.9]
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
                        {[0, 1, 2, 3, 4, 5].map((v) => (
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
                            points={points.map((p) => p.join(',')).join(' ')}
                            fill="none"
                            stroke={tone('blue')}
                            strokeWidth="3"
                        />
                        {marks.map((p) => (
                            <circle
                                key={p}
                                cx={x(p)}
                                cy={y(-Math.log(p))}
                                r="6"
                                fill={tone(p < 0.2 ? 'critical' : p > 0.8 ? 'green' : 'blue')}
                            />
                        ))}
                    </svg>
                ),
            }),
            label(
                c,
                'Surprise rises as target probability falls',
                20,
                20,
                600,
                29,
                c.textPrimary,
                700,
            ),
            label(c, 'Loss = −ln(p) · nats', 25, 85, 590, 26, c.textSecondary),
            ...[0, 1, 2, 3, 4, 5].map((v) =>
                label(c, String(v), 15, y(v) - 15, 55, 24, c.textSecondary, 500, 'right'),
            ),
            ...[0, 0.25, 0.5, 0.75, 1].map((v) =>
                label(c, String(v), x(v) - 35, 550, 70, 24, c.textSecondary),
            ),
            label(c, 'Observed target probability p', 25, 597, 590, 25, c.textSecondary),
            label(c, 'p=.01 →4.605', 25, 650, 285, 25, tone('critical'), 650),
            label(c, 'p=.10 →2.303', 330, 650, 285, 25, tone('critical'), 650),
            label(c, 'p=.50 →0.693', 25, 694, 285, 25, tone('blue'), 650),
            label(c, 'p=.90 →0.105', 330, 694, 285, 25, tone('green'), 650),
        ],
    })
}

export default create()
