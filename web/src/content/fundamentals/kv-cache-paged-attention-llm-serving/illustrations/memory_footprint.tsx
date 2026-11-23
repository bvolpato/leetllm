import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 640
export const alt =
    'Three equal-width bars partition the same 40 GiB payload-only KV pool. Llama 3 8B fits 80 half-GiB requests, Llama 3 70B fits 32 1.25-GiB requests, and the extrapolated GPT-3 175B shape fits two 18-GiB requests with 4 GiB free. Segment sizes use one common 0-to-40-GiB scale.'

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
    const rows = [
        {
            y: 114,
            model: 'Llama 3 8B · GQA-8',
            geom: '32L × 8 KV heads × 128d · 128 KiB/token',
            right: '80 × 0.5 GiB = 40 GiB',
            fill: c.positive,
            textTone: getReadableToneColor('green', c, c.bg, c.bg),
            usedGiB: 40,
            segs: 80,
        },
        {
            y: 244,
            model: 'Llama 3 70B · GQA-8',
            geom: '80L × 8 KV heads × 128d · 320 KiB/token',
            right: '32 × 1.25 GiB = 40 GiB',
            fill: c.secondary,
            textTone: getReadableToneColor('cyan', c, c.bg, c.bg),
            usedGiB: 40,
            segs: 32,
        },
        {
            y: 374,
            model: 'GPT-3 175B · MHA-96',
            geom: '96L × 96 KV heads × 128d · 4.5 MiB/token',
            right: '2 × 18 GiB · 4 GiB free',
            fill: c.warning,
            textTone: getReadableToneColor('warm', c, c.bg, c.bg),
            usedGiB: 36,
            segs: 2,
        },
    ]

    const barX = 20
    const barW = 860
    const ticks = [0, 10, 20, 30, 40]

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={20} y1={102} x2={880} y2={102} stroke={c.borderLight} strokeWidth={2} />
            {rows.map((r) => {
                const usedW = Math.round((barW * r.usedGiB) / 40)
                const segStep = usedW / r.segs
                return (
                    <g key={r.model}>
                        {SvgFrame({
                            c,
                            x: barX,
                            y: r.y + 42,
                            width: barW,
                            height: 42,
                            rx: 4,
                            fill: c.bgCardAlt,
                            stroke: c.borderLight,
                            strokeWidth: 1.5,
                        })}
                        {SvgFrame({
                            c,
                            x: barX,
                            y: r.y + 42,
                            width: usedW,
                            height: 42,
                            rx: 4,
                            fill: r.fill,
                            stroke: r.fill,
                            strokeWidth: 1,
                        })}
                        {Array.from({ length: r.segs - 1 }, (_, i) => {
                            const sx = barX + (i + 1) * segStep
                            return VectorSegment({
                                key: i,
                                x1: sx,
                                y1: r.y + 42,
                                x2: sx,
                                y2: r.y + 84,
                                color: c.bg,
                                strokeWidth: r.segs > 40 ? 1 : 2,
                            })
                        })}
                    </g>
                )
            })}
            <line x1={20} y1={516} x2={880} y2={516} stroke={c.border} strokeWidth={2} />
            {ticks.map((v) => {
                const tx = barX + (barW * v) / 40
                return (
                    <line
                        key={v}
                        x1={tx}
                        y1={506}
                        x2={tx}
                        y2={526}
                        stroke={c.border}
                        strokeWidth={2}
                    />
                )
            })}
            <line x1={20} y1={584} x2={880} y2={584} stroke={c.borderLight} strokeWidth={2} />
        </svg>
    )

    const rowLabels = rows.flatMap((r) => [
        label(c, r.model, 20, r.y, 440, 31, c.textPrimary, 'left', 700),
        label(c, r.right, 470, r.y + 2, 410, 29, r.textTone, 'right', 700),
        label(c, r.geom, 20, r.y + 90, 860, 29, c.textSecondary, 'left', 600),
    ])

    const tickLabels = [
        label(c, '0 GiB', 20, 534, 120, 29, c.textSecondary, 'left', 650),
        label(c, '10', 205, 534, 60, 29, c.textSecondary, 'center', 650),
        label(c, '20', 420, 534, 60, 29, c.textSecondary, 'center', 650),
        label(c, '30', 635, 534, 60, 29, c.textSecondary, 'center', 650),
        label(c, '40 GiB', 760, 534, 120, 29, c.textSecondary, 'right', 650),
    ]

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'One 40 GiB pool, three request shapes',
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
            'FP16 KV payloads at 4,096 tokens · common 0-40 GiB scale',
            20,
            56,
            860,
            28,
            c.textSecondary,
        ),
        ...rowLabels,
        ...tickLabels,
        label(
            c,
            'Excludes weights/buffers; GPT-3 4K extrapolates 2K.',
            20,
            596,
            860,
            28,
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
