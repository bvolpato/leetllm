import React from 'react'
import { Board, CanvasItem, TextLabel, defineIllustration, getReadableToneColor } from 'vizmatic'

export const width = 640
export const height = 580
export const alt =
    'Modeled cost per thousand accepted answers as self-hosted acceptance varies from 80 to 100 percent. The self-hosted cost falls from 11.50 dollars to 9.20 dollars and crosses the fixed hosted cost of 10 dollars at 92 percent acceptance. Monthly workload and budgets stay fixed.'
const acceptance = [0.8, 0.84, 0.88, 0.92, 0.96, 1.0]
const x = (p: number) => 96 + ((p - 0.8) / 0.2) * 480
const y = (cost: number) => 384 - ((cost - 9) / 3) * 288

const illustration = defineIllustration((c) => {
    const self = getReadableToneColor('purple', c),
        hosted = getReadableToneColor('blue', c)
    const label = (
        s: string,
        left: number,
        top: number,
        w: number,
        size = 25,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
    ) =>
        CanvasItem({
            x: left,
            y: top,
            width: w,
            height: size * 1.4,
            children: TextLabel({ c, text: s, width: w, fontSize: size, color, align }),
        })
    const cost = (p: number) => (13_800 / (1_500_000 * p)) * 1_000
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
                        {[9, 10, 11, 12].map((v) => (
                            <line
                                key={v}
                                x1={96}
                                x2={576}
                                y1={y(v)}
                                y2={y(v)}
                                stroke={c.border}
                                strokeWidth={1}
                            />
                        ))}
                        <line
                            x1={x(0.8)}
                            x2={x(1)}
                            y1={y(10)}
                            y2={y(10)}
                            stroke={hosted}
                            strokeWidth={3}
                            strokeDasharray="8 6"
                        />
                        <polyline
                            points={acceptance.map((p) => `${x(p)},${y(cost(p))}`).join(' ')}
                            fill="none"
                            stroke={self}
                            strokeWidth={4}
                        />
                        {acceptance.map((p) => (
                            <circle key={p} cx={x(p)} cy={y(cost(p))} r={5} fill={self} />
                        ))}
                        <line
                            x1={x(0.92)}
                            x2={x(0.92)}
                            y1={y(10)}
                            y2={384}
                            stroke={c.textMuted}
                            strokeWidth={1.5}
                            strokeDasharray="4 5"
                        />
                        <circle
                            cx={x(0.92)}
                            cy={y(10)}
                            r={8}
                            fill={c.bg}
                            stroke={self}
                            strokeWidth={3}
                        />
                        <line x1={28} x2={66} y1={494} y2={494} stroke={self} strokeWidth={4} />
                        <line
                            x1={28}
                            x2={66}
                            y1={537}
                            y2={537}
                            stroke={hosted}
                            strokeWidth={3}
                            strokeDasharray="8 6"
                        />
                    </svg>
                ),
            }),
            label('USD / 1,000 accepted answers', 28, 18, 584, 28),
            ...[9, 10, 11, 12].map((v) =>
                label('$' + v.toFixed(0), 22, y(v) - 15, 58, 25, c.textSecondary, 'right'),
            ),
            ...[0.8, 0.9, 1].map((p) =>
                label(Math.round(p * 100) + '%', x(p) - 40, 398, 80, 25, c.textSecondary, 'center'),
            ),
            label('Self-hosted acceptance rate', 96, 441, 480, 26, c.textSecondary, 'center'),
            label('92% break-even', x(0.92) + 18, y(10) - 58, 208, 24, self, 'left'),
            label('Self-hosted · $13,800/month', 80, 475, 532, 25, self),
            label('Hosted · $14,400/month · 96% accepted', 80, 518, 532, 25, hosted),
        ],
    })
})
export const create = illustration.create
export default illustration.default
