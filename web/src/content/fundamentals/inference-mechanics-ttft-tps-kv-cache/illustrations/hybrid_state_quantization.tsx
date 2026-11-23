import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getReadableColor,
    getReadableTextColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

const recurrentMiB = 144
const fp16KvMiB = 8
const int8KvMiB = 4
const fp16Total = recurrentMiB + fp16KvMiB
const int8Total = recurrentMiB + int8KvMiB
const plotX = 180
const plotW = 540
const stateX = (mib: number) => plotX + (plotW * mib) / fp16Total

export const alt =
    'At 128 positions in an 8 GiB per-sequence-state pool, 144 MiB of recurrent state plus 8 MiB of FP16 KV totals 152 MiB. Halving only KV changes the total to 148 MiB and capacity from 53 to 55 sequences, 1.04 times. A separate KV-only 18 GB pool at 5,120 tokens per user gives 53 FP16 users and 107 8-bit users.'

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
    const blue = getReadableColor('secondary', c)
    const cyan = getReadableColor('info', c)
    const warm = getReadableColor('warning', c)
    const recW = stateX(recurrentMiB) - plotX
    const fp16W = stateX(recurrentMiB + fp16KvMiB) - stateX(recurrentMiB)
    const int8W = stateX(recurrentMiB + int8KvMiB) - stateX(recurrentMiB)
    const capX = 180
    const capW = 540
    const countW = (n: number, max: number) => (capW * n) / max

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={20} y1={104} x2={880} y2={104} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: plotX,
                y: 158,
                width: plotW,
                height: 42,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: plotX,
                y: 158,
                width: recW,
                height: 42,
                rx: 4,
                fill: c.primary,
                stroke: c.primary,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: plotX + recW,
                y: 158,
                width: fp16W,
                height: 42,
                rx: 2,
                fill: c.secondary,
                stroke: c.secondary,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: plotX,
                y: 212,
                width: plotW,
                height: 42,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: plotX,
                y: 212,
                width: recW,
                height: 42,
                rx: 4,
                fill: c.primary,
                stroke: c.primary,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: plotX + recW,
                y: 212,
                width: int8W,
                height: 42,
                rx: 2,
                fill: c.info,
                stroke: c.info,
                strokeWidth: 1,
            })}
            <line x1={20} y1={314} x2={880} y2={314} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: capX,
                y: 368,
                width: capW,
                height: 32,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: capX,
                y: 368,
                width: countW(53, 56),
                height: 32,
                rx: 4,
                fill: c.secondary,
                stroke: c.secondary,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: capX,
                y: 412,
                width: capW,
                height: 32,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: capX,
                y: 412,
                width: countW(55, 56),
                height: 32,
                rx: 4,
                fill: c.info,
                stroke: c.info,
                strokeWidth: 1,
            })}
            <line x1={20} y1={504} x2={880} y2={504} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: capX,
                y: 558,
                width: capW,
                height: 32,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: capX,
                y: 558,
                width: countW(53, 107),
                height: 32,
                rx: 4,
                fill: c.secondary,
                stroke: c.secondary,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: capX,
                y: 602,
                width: capW,
                height: 32,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderLight,
                strokeWidth: 1,
            })}
            {SvgFrame({
                c,
                x: capX,
                y: 602,
                width: countW(107, 107),
                height: 32,
                rx: 4,
                fill: c.info,
                stroke: c.info,
                strokeWidth: 1,
            })}
        </svg>
    )

    const onPrimary = getReadableTextColor(c.primary, c, c.bg)
    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(c, 'Hybrid state limits the KV gain', 20, 14, 860, 34, c.textPrimary, 'left', 700),
        label(
            c,
            'Halving KV only: 152 MiB -> 148 MiB per sequence',
            20,
            56,
            860,
            31,
            c.textSecondary,
        ),
        label(
            c,
            '128 tokens · 144 MiB fixed recurrent + growing KV',
            20,
            114,
            860,
            31,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, 'FP16 KV', 20, 162, 150, 30, c.textPrimary, 'left', 700),
        label(c, '144 recurrent', plotX, 162, recW, 30, onPrimary, 'center', 700),
        label(c, `${fp16Total} MiB`, 734, 162, 150, 30, blue, 'left', 700),
        label(c, '8-bit KV', 20, 216, 150, 30, c.textPrimary, 'left', 700),
        label(c, '144 recurrent', plotX, 216, recW, 30, onPrimary, 'center', 700),
        label(c, `${int8Total} MiB`, 734, 216, 150, 30, cyan, 'left', 700),
        label(c, 'Recurrent state stays unquantized.', 20, 266, 860, 30, c.textSecondary),
        label(c, 'Fixed 8 GiB hybrid pool capacity', 20, 326, 860, 31, c.textPrimary, 'left', 700),
        label(c, 'FP16 KV', 20, 368, 150, 29, c.textPrimary, 'left', 600),
        label(c, '53 seqs', 734, 368, 150, 30, c.textPrimary, 'left', 700),
        label(c, '8-bit KV', 20, 412, 150, 29, c.textPrimary, 'left', 600),
        label(c, '55 seqs', 734, 412, 150, 30, c.textPrimary, 'left', 700),
        label(c, '53 -> 55 sequences (1.04×)', 20, 456, 860, 31, warm, 'left', 700),
        label(
            c,
            '18 GB KV-only pool (5,120 tokens/user, no recurrent state)',
            20,
            514,
            860,
            30,
            c.textPrimary,
            'left',
            700,
        ),
        label(c, 'FP16 KV', 20, 558, 150, 29, c.textPrimary, 'left', 600),
        label(c, '53 users', 734, 558, 150, 30, c.textPrimary, 'left', 700),
        label(c, '8-bit KV', 20, 602, 150, 29, c.textPrimary, 'left', 600),
        label(c, '107 users', 734, 602, 150, 30, c.textPrimary, 'left', 700),
        label(
            c,
            '53 -> 107 users when KV dominates · memory counts only',
            20,
            652,
            860,
            30,
            cyan,
            'left',
            700,
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
