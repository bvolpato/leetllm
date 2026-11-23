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
export const height = 650
export const alt =
    'Eligibility table for a user in the employees group. Finance-plan has the highest score, 0.99, but the user lacks finance access. Old-handbook scores 0.95 but is deleted. Only public-access-policy, score 0.82, reaches reranking.'

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
        { name: 'finance-plan', score: 0.99, reason: 'No finance access', allowed: false },
        { name: 'old-handbook', score: 0.95, reason: 'Deleted', allowed: false },
        { name: 'public-access-policy', score: 0.82, reason: 'Employees allowed', allowed: true },
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
                            <g key={r.name}>
                                <rect
                                    x="25"
                                    y={230 + i * 160}
                                    width="590"
                                    height="24"
                                    rx="4"
                                    fill={c.bgCard}
                                />
                                <rect
                                    x="25"
                                    y={230 + i * 160}
                                    width={590 * r.score}
                                    height="24"
                                    rx="4"
                                    fill={tone(r.allowed ? 'green' : 'critical')}
                                />
                            </g>
                        ))}
                    </svg>
                ),
            }),
            label(
                c,
                'Eligibility decides what reaches reranking',
                20,
                20,
                600,
                28,
                c.textPrimary,
                700,
            ),
            label(
                c,
                'Caller group: employees · shared 0–1 score scale',
                25,
                77,
                590,
                23,
                c.textSecondary,
            ),
            ...rows.flatMap((r, i) => [
                label(c, r.name, 25, 140 + i * 160, 465, 26, c.textPrimary, 650, 'left'),
                label(
                    c,
                    r.score.toFixed(2),
                    510,
                    140 + i * 160,
                    100,
                    27,
                    tone(r.allowed ? 'green' : 'critical'),
                    650,
                    'right',
                ),
                label(c, r.reason, 25, 184 + i * 160, 420, 24, c.textSecondary, 500, 'left'),
                label(
                    c,
                    r.allowed ? 'Rerank' : 'Block',
                    465,
                    184 + i * 160,
                    150,
                    25,
                    tone(r.allowed ? 'green' : 'critical'),
                    650,
                    'right',
                ),
            ]),
            label(
                c,
                'A higher similarity score grants no access',
                25,
                598,
                590,
                24,
                c.textSecondary,
            ),
        ],
    })
}

export default create()
