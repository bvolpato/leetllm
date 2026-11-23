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
export const height = 725
export const alt =
    'Simulated evaluations of a system whose true pass rate is 0.80. For each test set size of 10, 50, 200, and 1,000 cases, sixty runs appear as dots. At 10 cases the measured rate ranges widely, roughly from 0.4 to 1.0. At 1,000 cases the dots cluster tightly around 0.80. A shaded band shows two standard errors on each side, which narrows as the test set grows: 0.25, 0.11, 0.057, and 0.025. At 10 cases the formula overshoots 1.0, so that band stops at 1.0.'

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

function generator(seed: number) {
    let state = seed >>> 0
    return () => {
        state = (state + 0x6d2b79f5) >>> 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)
    const sizes = [10, 50, 200, 1000],
        truth = 0.8
    const py = (p: number) => 510 - ((p - 0.36) / 0.67) * 360
    const centers = [145, 285, 425, 565]
    const random = generator(20261103)
    const dots = sizes.flatMap((n, i) =>
        Array.from({ length: 60 }, () => {
            let passes = 0
            for (let k = 0; k < n; k++) if (random() < truth) passes++
            return { x: centers[i] + (random() - 0.5) * 78, y: py(passes / n) }
        }),
    )
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
                        {[0.4, 0.6, 0.8, 1].map((p) => (
                            <line
                                key={p}
                                x1="80"
                                x2="615"
                                y1={py(p)}
                                y2={py(p)}
                                stroke={c.border}
                                strokeWidth="1"
                            />
                        ))}
                        {sizes.map((n, i) => {
                            const m = 2 * Math.sqrt((truth * (1 - truth)) / n),
                                lo = Math.max(0.36, truth - m),
                                hi = Math.min(1, truth + m)
                            return (
                                <rect
                                    key={n}
                                    x={centers[i] - 55}
                                    y={py(hi)}
                                    width="110"
                                    height={py(lo) - py(hi)}
                                    fill={fill('warm')}
                                />
                            )
                        })}
                        {dots.map((d, i) => (
                            <circle
                                key={i}
                                cx={d.x}
                                cy={d.y}
                                r="3"
                                fill={tone('blue')}
                                fillOpacity=".7"
                            />
                        ))}
                        <line
                            x1="80"
                            x2="615"
                            y1={py(0.8)}
                            y2={py(0.8)}
                            stroke={c.textPrimary}
                            strokeWidth="2"
                            strokeDasharray="6 5"
                        />
                    </svg>
                ),
            }),
            label(
                c,
                'Larger test sets narrow estimate spread',
                20,
                20,
                600,
                29,
                c.textPrimary,
                700,
            ),
            label(
                c,
                'True pass rate .80 · 60 simulated runs per size',
                25,
                78,
                590,
                24,
                c.textSecondary,
            ),
            label(c, 'Measured pass rate', 90, 118, 520, 24, c.textSecondary, 500, 'left'),
            ...[0.4, 0.6, 0.8, 1].map((p) =>
                label(c, p.toFixed(1), 15, py(p) - 15, 55, 24, c.textSecondary, 500, 'right'),
            ),
            ...sizes.flatMap((n, i) => [
                label(
                    c,
                    n.toLocaleString('en-US'),
                    centers[i] - 60,
                    540,
                    120,
                    26,
                    c.textPrimary,
                    650,
                ),
                label(
                    c,
                    `±${(2 * Math.sqrt((0.8 * 0.2) / n)).toPrecision(2)}`,
                    centers[i] - 60,
                    582,
                    120,
                    24,
                    tone('warm'),
                    650,
                ),
            ]),
            label(c, 'Cases in each test set', 25, 626, 590, 25, c.textSecondary),
            label(c, 'Shaded: ±2 standard errors, clipped at 1.0', 25, 667, 590, 22, c.textMuted),
        ],
    })
}

export default create()
