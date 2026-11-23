import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getReadableColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

const currentBytes = 40 * 4096 * 65_536
const request16Bytes = 16_384 * 65_536
const request64Bytes = 65_536 * 65_536
const poolLimitBytes = 12_000_000_000
const chartMaxBytes = 16_000_000_000

export const alt =
    'A 12 GB pool limit is compared on one scale with 40 current 4,096-token reservations totaling 10,737,418,240 bytes. Adding 16,384 tokens reaches 11,811,160,064 bytes and fits; adding 65,536 reaches 15,032,385,536 and exceeds the pool. Separately, 17 logical positions round to two 16-token pages: 32 allocated, with a 15-token unused tail.'

export const width = 900
export const height = 740

const barX = 20
const barW = 860
const bytesToW = (b: number) => (barW * b) / chartMaxBytes

function label(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 500,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(36, fontSize + 8),
        children: TextLabel({ c, text: value, fontSize, fontWeight, color, align, width: w }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const primaryText = getReadableColor('primary', c)
    const positive = getReadableColor('positive', c)
    const warning = getReadableColor('warning', c)
    const critical = getReadableColor('critical', c)
    const limitX = barX + bytesToW(poolLimitBytes)
    const curW = bytesToW(currentBytes)
    const total16 = currentBytes + request16Bytes
    const total64 = currentBytes + request64Bytes
    const ticks = [
        { val: 0, text: '0' },
        { val: 4e9, text: '4' },
        { val: 8e9, text: '8' },
        { val: 12e9, text: '12 GB limit' },
        { val: 16e9, text: '16 GB' },
    ]

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {[178, 304, 430].map((y, idx) => {
                const extra = idx === 1 ? request16Bytes : idx === 2 ? request64Bytes : 0
                const total = currentBytes + extra
                const withinW = bytesToW(
                    Math.min(
                        Math.max(0, total - currentBytes),
                        Math.max(0, poolLimitBytes - currentBytes),
                    ),
                )
                const overW = bytesToW(Math.max(0, total - poolLimitBytes))
                return [
                    SvgFrame({
                        key: `bg-${idx}`,
                        c,
                        x: barX,
                        y,
                        width: barW,
                        height: 34,
                        rx: 4,
                        fill: c.bgCardAlt,
                        stroke: c.borderLight,
                        strokeWidth: 1,
                    }),
                    SvgFrame({
                        key: `c-${idx}`,
                        c,
                        x: barX,
                        y,
                        width: curW,
                        height: 34,
                        rx: 4,
                        fill: c.primary,
                        stroke: c.primary,
                        strokeWidth: 1,
                    }),
                    withinW > 0
                        ? SvgFrame({
                              key: `in-${idx}`,
                              c,
                              x: barX + curW,
                              y,
                              width: withinW,
                              height: 34,
                              rx: 2,
                              fill: idx === 1 ? c.positive : c.warning,
                              stroke: idx === 1 ? c.positive : c.warning,
                              strokeWidth: 1,
                          })
                        : null,
                    overW > 0
                        ? SvgFrame({
                              key: `ov-${idx}`,
                              c,
                              x: limitX,
                              y,
                              width: overW,
                              height: 34,
                              rx: 2,
                              fill: c.critical,
                              stroke: c.critical,
                              strokeWidth: 1,
                          })
                        : null,
                    <line
                        key={`lim-${idx}`}
                        x1={limitX}
                        y1={y - 4}
                        x2={limitX}
                        y2={y + 38}
                        stroke={c.critical}
                        strokeWidth={3}
                    />,
                ]
            })}
            <line x1={20} y1={526} x2={880} y2={526} stroke={c.borderLight} strokeWidth={2} />
            {Array.from({ length: 16 }, (_, cell) => [
                SvgFrame({
                    key: `p1-${cell}`,
                    c,
                    x: 20 + cell * 26,
                    y: 616,
                    width: 22,
                    height: 30,
                    rx: 3,
                    fill: c.primary,
                    stroke: c.primaryLight,
                    strokeWidth: 1,
                }),
                SvgFrame({
                    key: `p2-${cell}`,
                    c,
                    x: 464 + cell * 26,
                    y: 616,
                    width: 22,
                    height: 30,
                    rx: 3,
                    fill: cell < 1 ? c.positive : c.bgCardAlt,
                    stroke: cell < 1 ? c.positiveLight : c.borderLight,
                    strokeWidth: 1,
                }),
            ])}
        </svg>
    )

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Pool scheduling follows reserved bytes',
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
            '40 active sequences · 4,096 tokens each · 65,536 B/token',
            20,
            56,
            860,
            30,
            c.textSecondary,
        ),
        label(
            c,
            'Current pool use: 10.737 GB (10,737,418,240 B)',
            20,
            134,
            860,
            30,
            primaryText,
            'left',
            700,
        ),
        ...ticks.map((t) => {
            const tx = t.val === 0 ? 20 : t.val === 16e9 ? 710 : barX + bytesToW(t.val) - 85
            return label(
                c,
                t.text,
                tx,
                218,
                170,
                27,
                t.val === 12e9 ? critical : c.textSecondary,
                t.val === 0 ? 'left' : t.val === 16e9 ? 'right' : 'center',
                t.val === 12e9 ? 700 : 500,
            )
        }),
        label(
            c,
            `New 16,384 tokens (+${(request16Bytes / 1e9).toFixed(3)} GB): ${(total16 / 1e9).toFixed(3)} GB · fits`,
            20,
            260,
            860,
            30,
            positive,
            'left',
            700,
        ),
        label(
            c,
            `+65,536 tokens (+${(request64Bytes / 1e9).toFixed(3)} GB): ${(total64 / 1e9).toFixed(3)} GB · over 12 GB`,
            20,
            386,
            860,
            30,
            warning,
            'left',
            700,
        ),
        label(c, 'Over budget by 3.032 GB', 480, 472, 400, 28, critical, 'right', 700),
        label(
            c,
            'Page rounding: 17 tokens across 16-token blocks',
            20,
            540,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, 'Page 1: 16 used', 20, 578, 410, 29, primaryText, 'left', 650),
        label(c, 'Page 2: 1 used, 15 unused', 464, 578, 416, 29, c.textSecondary, 'left', 650),
        label(
            c,
            '32 positions allocated; 15 stay unused in final page.',
            20,
            662,
            860,
            30,
            c.textPrimary,
            'left',
            650,
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
