import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableTextColor,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 600
export const alt =
    'Three aligned decode snapshots show one new K/V pair at steps one, two, and five. Earlier pairs stay in the cache and each query reads the visible prefix; future slots remain empty. Full-model Llama 3 70B payloads are 320, 640, and 1,600 KiB. Pair boxes are a single-head schematic.'

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
    const primaryText = getReadableToneColor('blue', c, c.bg, c.bg)
    const accentText = getReadableToneColor('purple', c, c.bg, c.bg)
    const onPrimary = getReadableTextColor(c.primary, c, c.bg)
    const rows: Array<[number, number]> = [
        [1, 320],
        [2, 640],
        [5, 1600],
    ]
    const rowY = [122, 244, 366]
    const slotX0 = 200
    const slotStep = 96
    const slotW = 88
    const slotH = 88
    const barX = 696
    const barW = 184

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={20} y1={104} x2={880} y2={104} stroke={c.borderLight} strokeWidth={2} />
            {rows.map(([step, kib], r) => {
                const y = rowY[r]
                const fillW = Math.max(12, Math.round((barW * kib) / 1600))
                return (
                    <g key={step}>
                        {Array.from({ length: 5 }, (_, idx) => {
                            const i = idx + 1
                            const x = slotX0 + idx * slotStep
                            if (i > step) {
                                return (
                                    <rect
                                        key={i}
                                        x={x}
                                        y={y}
                                        width={slotW}
                                        height={slotH}
                                        rx={6}
                                        fill="none"
                                        stroke={c.border}
                                        strokeWidth={2}
                                        strokeDasharray="6 5"
                                    />
                                )
                            }
                            const fresh = i === step
                            return SvgFrame({
                                key: i,
                                c,
                                x,
                                y,
                                width: slotW,
                                height: slotH,
                                rx: 6,
                                fill: fresh ? c.primary : c.bgCardAlt,
                                stroke: c.primary,
                                strokeWidth: fresh ? 3 : 2,
                            })
                        })}
                        {VectorArrow({
                            x1: 174,
                            y1: y + 64,
                            x2: 196,
                            y2: y + 64,
                            color: c.secondary,
                            strokeWidth: 2,
                        })}
                        {SvgFrame({
                            c,
                            x: barX,
                            y: y + 8,
                            width: barW,
                            height: 28,
                            rx: 4,
                            fill: c.bgCardAlt,
                            stroke: c.borderLight,
                            strokeWidth: 1,
                        })}
                        {SvgFrame({
                            c,
                            x: barX,
                            y: y + 8,
                            width: fillW,
                            height: 28,
                            rx: 4,
                            fill: c.primary,
                            stroke: c.primary,
                            strokeWidth: 1,
                        })}
                    </g>
                )
            })}
            <line x1={20} y1={488} x2={880} y2={488} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: 20,
                y: 518,
                width: 28,
                height: 24,
                rx: 4,
                fill: c.primary,
                stroke: c.primary,
                strokeWidth: 2,
            })}
            {SvgFrame({
                c,
                x: 210,
                y: 518,
                width: 28,
                height: 24,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.primary,
                strokeWidth: 2,
            })}
            <rect
                x={546}
                y={518}
                width={28}
                height={24}
                rx={4}
                fill="none"
                stroke={c.border}
                strokeWidth={2}
                strokeDasharray="5 4"
            />
        </svg>
    )

    const rowLabels = rows.flatMap(([step, kib], r) => {
        const y = rowY[r]
        const slotLabels = Array.from({ length: 5 }, (_, idx) => {
            const i = idx + 1
            const x = slotX0 + idx * slotStep
            if (i > step)
                return [label(c, 'next', x, y + 26, slotW, 29, c.textMuted, 'center', 600)]
            const fresh = i === step
            return [
                label(
                    c,
                    `pos ${i}`,
                    x,
                    y + 8,
                    slotW,
                    29,
                    fresh ? onPrimary : c.textPrimary,
                    'center',
                    700,
                ),
                label(
                    c,
                    `K${i} V${i}`,
                    x,
                    y + 44,
                    slotW,
                    29,
                    fresh ? onPrimary : c.textSecondary,
                    'center',
                    600,
                ),
            ]
        }).flat()
        return [
            label(c, `t = ${step}`, 20, y + 10, 152, 31, c.textPrimary, 'left', 700),
            label(c, `q${step} reads ${step}`, 20, y + 48, 152, 29, accentText, 'left', 650),
            ...slotLabels,
            label(
                c,
                `${kib.toLocaleString('en-US')} KiB`,
                barX,
                y + 46,
                barW,
                30,
                primaryText,
                'left',
                700,
            ),
        ]
    })

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'New token writes once; every query reads prefix',
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
            'Llama 3 70B · 320 KiB/token · single-head schematic',
            20,
            56,
            860,
            30,
            c.textSecondary,
        ),
        ...rowLabels,
        label(c, 'new pair', 58, 512, 140, 29, c.textPrimary, 'left', 650),
        label(c, 'kept, unchanged', 248, 512, 290, 29, c.textPrimary, 'left', 600),
        label(c, 'not written yet', 584, 512, 240, 29, c.textSecondary, 'left', 600),
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
