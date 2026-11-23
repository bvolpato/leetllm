import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 680
export const alt =
    'For 100 compatible requests with a warm full-attention 1,000-token prefix and 16-token blocks, one shared run occupies 62 full blocks and the requests keep 100 private tail blocks: 162 occupied blocks instead of 6,300. At prompt lengths 1,000, 1,008, and 1,009, the aligned hit rule reuses 992, 992, and 1,008 tokens and recomputes 8, 16, and 1.'

function label(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight: number = 600,
): React.ReactElement {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(36, fontSize + 10),
        children: TextLabel({ c, text: value, fontSize, fontWeight, color, align, width: w }),
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const positive = getReadableToneColor('green', c, c.bg, c.bg)
    const warning = getReadableToneColor('warm', c, c.bg, c.bg)
    const hitRows = [
        { y: 406, prompt: 1000, reused: 992, blocks: 62, recomp: 8 },
        { y: 468, prompt: 1008, reused: 992, blocks: 62, recomp: 16 },
        { y: 530, prompt: 1009, reused: 1008, blocks: 63, recomp: 1 },
    ]
    const barW = 860
    const shareBarW = Math.max(24, Math.round((barW * 162) / 6300))

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={20} y1={102} x2={880} y2={102} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: 20,
                y: 158,
                width: barW,
                height: 34,
                rx: 4,
                fill: c.warning,
                stroke: c.warning,
                strokeWidth: 1,
            })}
            {VectorArrow({ x1: 60, y1: 196, x2: 60, y2: 244, color: c.positive, strokeWidth: 3 })}
            {SvgFrame({
                c,
                x: 20,
                y: 248,
                width: barW,
                height: 34,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: 20,
                y: 248,
                width: shareBarW,
                height: 34,
                rx: 4,
                fill: c.positive,
                stroke: c.positive,
                strokeWidth: 1,
            })}
            <line x1={20} y1={340} x2={880} y2={340} stroke={c.borderLight} strokeWidth={2} />
            {hitRows.map((r) => (
                <g key={r.prompt}>
                    {SvgFrame({
                        c,
                        x: 526,
                        y: r.y + 4,
                        width: 192,
                        height: 32,
                        rx: 4,
                        fill: c.bgCardAlt,
                        stroke: c.border,
                        strokeWidth: 1.5,
                    })}
                    {Array.from({ length: 16 }, (_, idx) => (
                        <rect
                            key={idx}
                            x={527 + idx * 12}
                            y={r.y + 5}
                            width={10}
                            height={30}
                            rx={2}
                            fill={idx < r.recomp ? c.warning : c.bgSubtle}
                        />
                    ))}
                </g>
            ))}
            <line x1={20} y1={592} x2={880} y2={592} stroke={c.borderLight} strokeWidth={2} />
        </svg>
    )

    const hitLabels = hitRows.flatMap((r) => [
        label(
            c,
            `${r.prompt} tok · reuse ${r.reused} (${r.blocks} blk)`,
            20,
            r.y,
            496,
            29,
            c.textPrimary,
            'left',
            650,
        ),
        label(c, `recomp ${r.recomp}`, 726, r.y, 154, 29, warning, 'right', 700),
    ])

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Reuse complete blocks; recompute the suffix',
            20,
            14,
            860,
            34,
            c.textPrimary,
            'left',
            700,
        ),
        label(
            c,
            '100 compatible runs · 1,000-tok prompt · 16-tok blocks',
            20,
            56,
            860,
            28,
            c.textSecondary,
        ),
        label(c, 'Without reuse', 20, 116, 400, 31, c.textPrimary, 'left', 700),
        label(c, '63 × 100 = 6,300 blocks', 440, 118, 440, 29, warning, 'right', 700),
        label(c, 'With compatible reuse', 100, 206, 380, 31, c.textPrimary, 'left', 700),
        label(c, '162 total · 97.4% fewer', 480, 208, 400, 29, positive, 'right', 700),
        label(
            c,
            '62 shared full blocks + 100 private 8-token tails',
            20,
            294,
            860,
            29,
            c.textSecondary,
        ),
        label(
            c,
            'Aligned hit rule · one 16-slot tail block',
            20,
            354,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        ...hitLabels,
        label(
            c,
            'Aligned rule leaves suffix work for next-token logits.',
            20,
            604,
            860,
            29,
            c.textSecondary,
        ),
        label(
            c,
            'Compatibility and isolation keys still govern reuse.',
            20,
            640,
            860,
            29,
            c.textSecondary,
        ),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

export default create('dark')
