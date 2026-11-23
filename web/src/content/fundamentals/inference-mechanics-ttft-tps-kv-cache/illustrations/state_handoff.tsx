import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

const raw4kGb = 268_435_456 / 1e9
const raw64kGb = 4_294_967_296 / 1e9
const floor4kMs = (1000 * raw4kGb) / 25
const floor64kMs = (1000 * raw64kGb) / 25

export const alt =
    'Separate prefill and decode worker pools hand off compatible KV state, request metadata, and any needed recurrent state. A bandwidth-only estimate isolates raw K/V payload: 4K is 0.268 GB and takes at least 10.7 ms; 64K is 4.295 GB and takes at least 171.8 ms over an ideal 25 GB/s (200 Gbps) link. State serialization, network overhead, and scheduling are outside these payload-only floors.'

export const width = 900
export const height = 740

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
    const purple = getReadableColor('primary', c)
    const blue = getReadableColor('secondary', c)
    const positive = getReadableColor('positive', c)
    const barX = 120
    const barW = 540
    const handoffItems = [
        { name: 'KV state', color: c.primary, y: 122 },
        { name: 'metadata', color: c.info, y: 168 },
        { name: 'recurrent state', color: c.warning, y: 214 },
    ]

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {SvgFrame({
                c,
                x: 20,
                y: 118,
                width: 220,
                height: 140,
                rx: 10,
                fill: c.bgCardAlt,
                stroke: c.primary,
                strokeWidth: 3,
            })}
            {VectorArrow({
                x1: 248,
                y1: 188,
                x2: 304,
                y2: 188,
                color: c.secondary,
                strokeWidth: 3,
            })}
            {handoffItems.map((h) =>
                SvgFrame({
                    key: h.name,
                    c,
                    x: 314,
                    y: h.y,
                    width: 272,
                    height: 38,
                    rx: 4,
                    fill: c.bgCardAlt,
                    stroke: h.color,
                    strokeWidth: 2,
                }),
            )}
            {VectorArrow({
                x1: 594,
                y1: 188,
                x2: 650,
                y2: 188,
                color: c.secondary,
                strokeWidth: 3,
            })}
            {SvgFrame({
                c,
                x: 660,
                y: 118,
                width: 220,
                height: 140,
                rx: 10,
                fill: c.bgCardAlt,
                stroke: c.secondary,
                strokeWidth: 3,
            })}
            <line x1={20} y1={286} x2={880} y2={286} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: barX,
                y: 344,
                width: barW,
                height: 30,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: barX,
                y: 344,
                width: (barW * raw4kGb) / raw64kGb,
                height: 30,
                rx: 4,
                fill: c.primary,
                stroke: c.primary,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: barX,
                y: 388,
                width: barW,
                height: 30,
                rx: 4,
                fill: c.primary,
                stroke: c.primary,
                strokeWidth: 1,
            })}
            <line x1={20} y1={444} x2={880} y2={444} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: barX,
                y: 504,
                width: barW,
                height: 30,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: barX,
                y: 504,
                width: (barW * floor4kMs) / 180,
                height: 30,
                rx: 4,
                fill: c.positive,
                stroke: c.positive,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: barX,
                y: 548,
                width: barW,
                height: 30,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: barX,
                y: 548,
                width: (barW * floor64kMs) / 180,
                height: 30,
                rx: 4,
                fill: c.positive,
                stroke: c.positive,
                strokeWidth: 1,
            })}
        </svg>
    )

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Disaggregation moves state between pools',
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
            'Prefill and decode run on separate worker pools.',
            20,
            56,
            860,
            30,
            c.textSecondary,
        ),
        label(c, 'PREFILL', 20, 144, 220, 32, purple, 'center', 700),
        label(c, 'worker pool', 20, 196, 220, 29, c.textSecondary, 'center', 600),
        ...handoffItems.map((h) =>
            label(c, h.name, 326, h.y + 3, 248, 29, c.textPrimary, 'center', 650),
        ),
        label(c, 'DECODE', 660, 144, 220, 32, blue, 'center', 700),
        label(c, 'worker pool', 660, 196, 220, 29, c.textSecondary, 'center', 600),
        label(
            c,
            'Raw K/V payload (shared scale to 4.295 GB)',
            20,
            300,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, '4K', 20, 342, 80, 30, c.textPrimary, 'left', 700),
        label(c, `${raw4kGb.toFixed(3)} GB`, 676, 342, 200, 30, c.textPrimary, 'left', 700),
        label(c, '64K', 20, 386, 80, 30, c.textPrimary, 'left', 700),
        label(c, `${raw64kGb.toFixed(3)} GB`, 676, 386, 200, 30, c.textPrimary, 'left', 700),
        label(
            c,
            'Payload-only transfer floor · 25 GB/s (200 Gbps)',
            20,
            460,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, '4K', 20, 502, 80, 30, c.textPrimary, 'left', 700),
        label(c, `>= ${floor4kMs.toFixed(1)} ms`, 676, 502, 200, 30, positive, 'left', 700),
        label(c, '64K', 20, 546, 80, 30, c.textPrimary, 'left', 700),
        label(c, `>= ${floor64kMs.toFixed(1)} ms`, 676, 546, 200, 30, positive, 'left', 700),
        label(
            c,
            'Serialization, protocol overhead, and scheduling add work.',
            20,
            616,
            860,
            30,
            c.textSecondary,
        ),
        label(c, 'Payload floors exclude active-stream stalls.', 20, 658, 860, 30, c.textSecondary),
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
