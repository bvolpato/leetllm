import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

type Colors = ReturnType<typeof getThemeColors>

export const width = 900
export const height = 790

export const alt =
    'Four same-scale stacked bars show model-state ownership per GPU for a 70B, 16-byte recipe in an eight-rank data-parallel group. DDP stores P=140, G=140, O=840 GB for 1,120 total. ZeRO-1 stores P=140, G=140, O=105 for 385 GB. ZeRO-2 stores P=140, G=17.5, O=105 for 262.5 GB. ZeRO-3 stores P=17.5, G=17.5, O=105 for 140 GB. P is parameters, G gradients, and O the FP32 master plus Adam moments; bars share a 0–1,120 GB axis.'

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 650,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

function colorKey(c: Colors, x: number, y: number, color: string) {
    return SvgFrame({
        c,
        x,
        y,
        width: 24,
        height: 24,
        rx: 5,
        fill: color,
        stroke: color,
        strokeWidth: 1,
    })
}

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const pTone = getReadableToneColor('blue', c)
    const gTone = getReadableToneColor('purple', c)
    const oTone = getReadableToneColor('warm', c)
    const muted = c.textSecondary
    const plotX = 230
    const plotW = 390
    const max = 1120
    const storageX = (value: number) => plotX + (plotW * value) / max
    const storageTicks = [0, 560, 1120]
    const valueColumnCenters = [672, 756, 840]
    const valueColumnWidth = 62
    const rows = [
        { name: 'DDP', total: '1,120 GB', p: 140, g: 140, o: 840 },
        { name: 'ZeRO-1', total: '385 GB', p: 140, g: 140, o: 105 },
        { name: 'ZeRO-2', total: '262.5 GB', p: 140, g: 17.5, o: 105 },
        { name: 'ZeRO-3', total: '140 GB', p: 17.5, g: 17.5, o: 105 },
    ]

    const geometry = [
        colorKey(c, 26, 126, pTone),
        colorKey(c, 278, 126, gTone),
        colorKey(c, 532, 126, oTone),
        ...rows.flatMap((row, index) => {
            const y = 270 + index * 116
            const pW = storageX(row.p) - storageX(0)
            const gW = storageX(row.p + row.g) - storageX(row.p)
            const oW = storageX(row.p + row.g + row.o) - storageX(row.p + row.g)
            const pX = storageX(0)
            const gX = storageX(row.p)
            const oX = storageX(row.p + row.g)
            return [
                SvgFrame({
                    c,
                    x: 20,
                    y: y - 12,
                    width: 860,
                    height: 102,
                    rx: 8,
                    fill: index % 2 ? c.bgSubtle : c.bgCard,
                    stroke: c.borderSubtle,
                    strokeWidth: 1,
                }),
                SvgFrame({
                    c,
                    x: pX,
                    y: y + 10,
                    width: pW,
                    height: 44,
                    rx: 4,
                    fill: pTone,
                    stroke: pTone,
                    strokeWidth: 1,
                }),
                SvgFrame({
                    c,
                    x: gX,
                    y: y + 10,
                    width: gW,
                    height: 44,
                    rx: 2,
                    fill: gTone,
                    stroke: gTone,
                    strokeWidth: 1,
                }),
                SvgFrame({
                    c,
                    x: oX,
                    y: y + 10,
                    width: oW,
                    height: 44,
                    rx: 3,
                    fill: oTone,
                    stroke: oTone,
                    strokeWidth: 1,
                }),
                VectorSegment({
                    x1: plotX,
                    y1: y + 67,
                    x2: plotX + plotW,
                    y2: y + 67,
                    color: c.borderSubtle,
                    strokeWidth: 1,
                    opacity: 0.7,
                }),
            ]
        }),
        VectorSegment({
            x1: storageX(0),
            y1: 220,
            x2: storageX(max),
            y2: 220,
            color: muted,
            strokeWidth: 2,
        }),
        ...storageTicks.map((value) => {
            const x = storageX(value)
            return VectorSegment({ x1: x, y1: 212, x2: x, y2: 226, color: muted, strokeWidth: 2 })
        }),
    ]

    const labels = [
        label(c, 'The states ZeRO stops replicating', 22, 17, 856, 48, 39, c.textPrimary, 850),
        label(c, '70B · 8-rank group · model states per GPU', 24, 68, 852, 38, 32, muted, 600),
        label(c, 'P · params', 58, 120, 205, 34, 32, c.textPrimary, 700),
        label(c, 'G · gradients', 310, 120, 205, 34, 32, c.textPrimary, 700),
        label(c, 'O · master + Adam', 564, 120, 310, 34, 32, c.textPrimary, 700),
        ...storageTicks.map((value) => {
            const tickLabelWidth = 90
            return label(
                c,
                value.toLocaleString('en-US'),
                storageX(value) - tickLabelWidth / 2,
                172,
                tickLabelWidth,
                32,
                32,
                muted,
                600,
                'center',
                true,
            )
        }),
        label(
            c,
            'P',
            valueColumnCenters[0] - valueColumnWidth / 2,
            224,
            valueColumnWidth,
            32,
            32,
            pTone,
            800,
            'center',
            true,
        ),
        label(
            c,
            'G',
            valueColumnCenters[1] - valueColumnWidth / 2,
            224,
            valueColumnWidth,
            32,
            32,
            gTone,
            800,
            'center',
            true,
        ),
        label(
            c,
            'O',
            valueColumnCenters[2] - valueColumnWidth / 2,
            224,
            valueColumnWidth,
            32,
            32,
            oTone,
            800,
            'center',
            true,
        ),
        ...rows.flatMap((row, index) => {
            const y = 262 + index * 116
            return [
                label(c, row.name, 34, y, 178, 36, 32, c.textPrimary, 820),
                label(c, row.total, 34, y + 40, 178, 34, 32, muted, 700, 'left', true),
                label(
                    c,
                    String(row.p),
                    valueColumnCenters[0] - valueColumnWidth / 2,
                    y + 10,
                    valueColumnWidth,
                    40,
                    32,
                    pTone,
                    760,
                    'center',
                ),
                label(
                    c,
                    String(row.g),
                    valueColumnCenters[1] - valueColumnWidth / 2,
                    y + 10,
                    valueColumnWidth,
                    40,
                    32,
                    gTone,
                    760,
                    'center',
                ),
                label(
                    c,
                    String(row.o),
                    valueColumnCenters[2] - valueColumnWidth / 2,
                    y + 10,
                    valueColumnWidth,
                    40,
                    32,
                    oTone,
                    760,
                    'center',
                ),
            ]
        }),
    ]

    const svg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...geometry,
    )
    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [CanvasItem({ x: 0, y: 0, width, height, children: svg }), ...labels],
    })
}

export default create('dark')
