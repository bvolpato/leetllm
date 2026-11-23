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
export const height = 790
export const alt =
    'Left: the curve of negative log p against probability p, with three observed targets marked: p 0.80 costs 0.223 nats, p 0.50 costs 0.693, and p 0.10 costs 2.303. Right: those losses laid end to end total 3.219 nats. Dividing by three targets gives a mean of 1.073 nats, and exponentiating gives perplexity 2.92.'

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
    const observed = [0.5, 0.1, 0.8],
        losses = observed.map((p) => -Math.log(p)),
        total = losses.reduce((a, b) => a + b, 0),
        mean = total / 3
    const x = (p: number) => 80 + p * 520,
        y = (loss: number) => 395 - (loss / 3.2) * 245
    const curve = Array.from({ length: 200 }, (_, i) => {
        const p = 0.042 + (i / 199) * 0.958
        return [x(p), y(-Math.log(p))]
    })
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
                        {[0, 1, 2, 3].map((v) => (
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
                        {observed.map((p) => (
                            <circle
                                key={p}
                                cx={x(p)}
                                cy={y(-Math.log(p))}
                                r="6"
                                fill={tone(p === 0.1 ? 'warm' : 'blue')}
                            />
                        ))}
                        {losses.map((l, i) => {
                            const before = losses.slice(0, i).reduce((a, b) => a + b, 0)
                            return (
                                <rect
                                    key={i}
                                    x={40 + (before / total) * 560}
                                    y="575"
                                    width={(l / total) * 560}
                                    height="45"
                                    fill={tone(i === 1 ? 'warm' : 'blue')}
                                    stroke={c.bg}
                                    strokeWidth="2"
                                />
                            )
                        })}
                    </svg>
                ),
            }),
            label(c, 'Average surprise, then exponentiate', 20, 20, 600, 30, c.textPrimary, 700),
            label(c, 'Target loss = −ln(p) · nats', 25, 74, 590, 25, c.textSecondary),
            ...[0, 1, 2, 3].map((v) =>
                label(c, String(v), 15, y(v) - 15, 55, 24, c.textSecondary, 500, 'right'),
            ),
            ...[0, 0.5, 1].map((v) => label(c, String(v), x(v) - 30, 410, 60, 24, c.textSecondary)),
            label(c, 'Observed target probability p', 25, 450, 590, 24, c.textSecondary),
            ...observed.flatMap((p, i) => [
                label(
                    c,
                    `p=${p.toFixed(2)}`,
                    40 +
                        (losses.slice(0, i).reduce((a, b) => a + b, 0) / total) * 560 +
                        (losses[i] / total) * 280 -
                        50,
                    500,
                    100,
                    25,
                    c.textPrimary,
                    650,
                ),
                label(
                    c,
                    losses[i].toFixed(3),
                    40 +
                        (losses.slice(0, i).reduce((a, b) => a + b, 0) / total) * 560 +
                        (losses[i] / total) * 280 -
                        50,
                    538,
                    100,
                    25,
                    tone(i === 1 ? 'warm' : 'blue'),
                    650,
                ),
            ]),
            label(
                c,
                `Total ${total.toFixed(3)} / 3 = ${mean.toFixed(3)} nats`,
                25,
                650,
                590,
                27,
                c.textPrimary,
                650,
            ),
            label(
                c,
                `PPL = exp(${mean.toFixed(3)}) = ${Math.exp(mean).toFixed(2)}`,
                25,
                715,
                590,
                29,
                tone('blue'),
                650,
            ),
        ],
    })
}

export default create()
