import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getToneColor,
    defineIllustration,
} from 'vizmatic'

export const width = 1000
export const height = 900
export const alt =
    'Two linear time views show one 16 decimal GB BF16 weight stream split between resident reads at 3.35 TB/s and an assumed 64 GB/s host path. On a 0–30 ms scale, 0%, 1%, and 10% host bytes take 4.8, 7.2, and 29.3 ms; the host path contributes 0.0%, 34.6%, and 85.3% of modeled transfer time. A separate full 0–250 ms scale shows 100% host traffic at 250.0 ms. Segments use sequential transfer time; compute, KV traffic, and overlap are excluded.'

const illustration = defineIllustration((c) => {
    const resident = getToneColor('purple', c)
    const host = getToneColor('cyan', c)
    const residentText = getReadableToneColor('purple', c)
    const hostText = getReadableToneColor('cyan', c)
    const weightBytes = 16e9
    const residentRate = 3.35e12
    const hostRate = 64e9

    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        h: number,
        fontSize: number,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 650,
        mono = false,
    ) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: h,
            children: TextLabel({
                c,
                text,
                width: '100%',
                fontSize,
                color,
                align,
                fontWeight,
                mono,
            }),
        })

    const rowParts = (fraction: number, y: number, maxMs: number) => {
        const residentMs = ((weightBytes * (1 - fraction)) / residentRate) * 1000
        const hostMs = ((weightBytes * fraction) / hostRate) * 1000
        const totalMs = residentMs + hostMs
        const hostShare = totalMs === 0 ? 0 : (hostMs / totalMs) * 100
        const trackX = 270
        const trackWidth = 420
        const residentWidth = (residentMs / maxMs) * trackWidth
        const hostWidth = (hostMs / maxMs) * trackWidth
        return {
            bars: (
                <g key={'transfer-row-' + y}>
                    <rect
                        x={trackX}
                        y={y + 6}
                        width={trackWidth}
                        height={28}
                        rx={4}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                        strokeWidth={1.5}
                    />
                    {residentWidth > 0 && (
                        <rect
                            x={trackX}
                            y={y + 6}
                            width={residentWidth}
                            height={28}
                            rx={4}
                            fill={resident}
                        />
                    )}
                    {hostWidth > 0 && (
                        <rect
                            x={trackX + residentWidth}
                            y={y + 6}
                            width={hostWidth}
                            height={28}
                            rx={4}
                            fill={host}
                        />
                    )}
                </g>
            ),
            labels: [
                label(
                    (fraction * 100).toFixed(0) + '%',
                    20,
                    y,
                    100,
                    40,
                    34,
                    c.textPrimary,
                    'left',
                    700,
                    true,
                ),
                label(
                    ((weightBytes * fraction) / 1e9).toFixed(2),
                    120,
                    y,
                    130,
                    40,
                    34,
                    c.textPrimary,
                    'right',
                    650,
                    true,
                ),
                label(totalMs.toFixed(1), 700, y, 140, 40, 34, c.textPrimary, 'right', 650, true),
                label(
                    hostShare.toFixed(1) + '%',
                    850,
                    y,
                    130,
                    40,
                    34,
                    c.textPrimary,
                    'right',
                    650,
                    true,
                ),
            ],
        }
    }

    const axis = (y: number, max: number, ticks: number[]) => ({
        line: (
            <line
                key={'axis-' + y}
                x1={270}
                y1={y}
                x2={720}
                y2={y}
                stroke={c.textPrimary}
                strokeWidth="2"
            />
        ),
        labels: ticks.map((tick) => {
            const x = 270 + (tick / max) * 420
            return CanvasItem({
                x: x - 46,
                y: y + 8,
                width: 92,
                height: 40,
                children: TextLabel({
                    c,
                    text: String(tick),
                    width: '100%',
                    fontSize: 34,
                    color: c.textPrimary,
                    align: 'center',
                    mono: true,
                }),
            })
        }),
    })

    const rows = [
        rowParts(0, 246, 30),
        rowParts(0.01, 318, 30),
        rowParts(0.1, 390, 30),
        rowParts(1, 684, 250),
    ]
    const axes = [axis(444, 30, [0, 15, 30]), axis(728, 250, [0, 125, 250])]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: (
                        <svg
                            width={width}
                            height={height}
                            viewBox={'0 0 ' + width + ' ' + height}
                            role="presentation"
                            aria-hidden="true"
                        >
                            <SvgFrame
                                c={c}
                                x={28}
                                y={108}
                                width={24}
                                height={24}
                                rx={4}
                                fill={resident}
                                stroke={resident}
                                strokeWidth={0}
                            />
                            <SvgFrame
                                c={c}
                                x={512}
                                y={108}
                                width={24}
                                height={24}
                                rx={4}
                                fill={host}
                                stroke={host}
                                strokeWidth={0}
                            />
                            {rows.map((row) => row.bars)}
                            {axes.map((item) => item.line)}
                        </svg>
                    ),
                }),
                label(
                    'Host bytes stretch the same weight stream',
                    20,
                    12,
                    960,
                    44,
                    38,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label(
                    '16 decimal GB · assumed host bandwidth 64 GB/s',
                    20,
                    60,
                    960,
                    40,
                    34,
                    c.textPrimary,
                    'center',
                    650,
                ),
                label('Resident · 3.35 TB/s', 66, 106, 410, 40, 34, residentText, 'left', 700),
                label('Host path · 64 GB/s', 550, 106, 420, 40, 34, hostText, 'left', 700),
                label(
                    'Magnified transfer time · 0–30 ms',
                    20,
                    154,
                    960,
                    40,
                    34,
                    c.textPrimary,
                    'left',
                    700,
                ),
                label('Host', 20, 199, 110, 40, 34, c.textPrimary, 'left', 650),
                label('GB', 120, 199, 130, 40, 34, c.textPrimary, 'right', 650),
                label('Total', 700, 199, 140, 40, 34, c.textPrimary, 'right', 650),
                label('Share', 850, 199, 130, 40, 34, c.textPrimary, 'right', 650),
                ...rows.slice(0, 3).flatMap((row) => row.labels),
                ...axes[0].labels,
                label('Time · ms', 270, 494, 420, 40, 34, c.textPrimary, 'center', 600),
                label(
                    '1% host bytes take 34.6% of modeled time.',
                    20,
                    540,
                    960,
                    40,
                    34,
                    c.textPrimary,
                    'center',
                    700,
                ),
                label(
                    '100% host · full scale to 250 ms',
                    20,
                    592,
                    960,
                    40,
                    34,
                    c.textPrimary,
                    'left',
                    700,
                ),
                label('Host', 20, 638, 110, 40, 34, c.textPrimary, 'left', 650),
                label('GB', 120, 638, 130, 40, 34, c.textPrimary, 'right', 650),
                label('Total', 700, 638, 140, 40, 34, c.textPrimary, 'right', 650),
                label('Share', 850, 638, 130, 40, 34, c.textPrimary, 'right', 650),
                ...rows[3].labels,
                ...axes[1].labels,
                label('Time · ms', 270, 780, 420, 40, 34, c.textPrimary, 'center', 600),
                label(
                    'Compute, KV traffic, and overlap excluded.',
                    20,
                    822,
                    960,
                    34,
                    34,
                    c.textPrimary,
                    'center',
                    600,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
