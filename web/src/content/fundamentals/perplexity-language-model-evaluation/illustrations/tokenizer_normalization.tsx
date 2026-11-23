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
export const height = 800
export const alt =
    'The fourteen bytes of Rain falls now, aligned with four subword pieces (Rain, space falls, space n, and ow) and fourteen character targets. Over the same bytes, the subword model has total loss 8.4 nats, token perplexity 8.17, and 0.866 bits per byte. The character model has 9.0 nats, token perplexity 1.90, and 0.927 bits per byte. Token perplexity favors the character model, and bits per byte favors the subword model.'

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
    const bytes = [...'Rain·falls·now'],
        pieces = ['Rain', '·falls', '·n', 'ow']
    const x = (i: number) => 180 + i * 30
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
                        {pieces.map((p, i) => {
                            const start = pieces.slice(0, i).join('').length
                            return (
                                <rect
                                    key={i}
                                    x={x(start)}
                                    y="230"
                                    width={p.length * 30 - 3}
                                    height="55"
                                    rx="4"
                                    fill={fill('blue')}
                                    stroke={tone('blue')}
                                    strokeWidth="2"
                                />
                            )
                        })}
                        {bytes.map((_, i) => (
                            <rect
                                key={i}
                                x={x(i)}
                                y="340"
                                width="27"
                                height="55"
                                rx="3"
                                fill={fill('warm')}
                                stroke={tone('warm')}
                                strokeWidth="2"
                            />
                        ))}
                        <line
                            x1="25"
                            x2="615"
                            y1="440"
                            y2="440"
                            stroke={c.border}
                            strokeWidth="2"
                        />
                    </svg>
                ),
            }),
            label(c, 'Compare bytes across tokenizers', 20, 20, 600, 29, c.textPrimary, 700),
            label(c, 'The same 14 bytes: “Rain falls now”', 25, 78, 590, 25, c.textSecondary),
            ...bytes.map((t, i) =>
                label(c, t, x(i), 162, 28, 25, t === '·' ? c.textMuted : c.textPrimary, 650),
            ),
            label(c, 'Subword', 25, 245, 145, 25, tone('blue'), 650, 'left'),
            label(c, 'Character', 25, 355, 145, 25, tone('warm'), 650, 'left'),
            ...['Model', 'NLL', 'Token PPL', 'BPB'].map((s, i) =>
                label(
                    c,
                    s,
                    [25, 205, 330, 490][i],
                    480,
                    [165, 110, 145, 125][i],
                    24,
                    c.textSecondary,
                    650,
                ),
            ),
            ...[
                { name: 'Subword', nll: '8.4', ppl: '8.17', bpb: '.866' },
                { name: 'Character', nll: '9.0', ppl: '1.90', bpb: '.927' },
            ].flatMap((r, i) => [
                label(c, r.name, 25, 540 + i * 85, 165, 25, c.textPrimary, 650),
                label(c, r.nll, 205, 540 + i * 85, 110, 26, c.textPrimary),
                label(
                    c,
                    r.ppl,
                    330,
                    540 + i * 85,
                    145,
                    26,
                    i === 1 ? tone('warm') : c.textPrimary,
                    i === 1 ? 700 : 500,
                ),
                label(
                    c,
                    r.bpb,
                    490,
                    540 + i * 85,
                    125,
                    26,
                    i === 0 ? tone('blue') : c.textPrimary,
                    i === 0 ? 700 : 500,
                ),
            ]),
            label(
                c,
                '4 subword targets or 14 character targets',
                25,
                715,
                590,
                25,
                c.textSecondary,
            ),
            label(
                c,
                'BPB compares loss over the same byte count',
                25,
                760,
                590,
                24,
                c.textSecondary,
            ),
        ],
    })
}

export default create()
