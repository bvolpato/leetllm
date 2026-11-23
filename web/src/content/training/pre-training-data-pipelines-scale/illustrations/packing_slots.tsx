import React, { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    layoutAllocation,
    layoutCellGrid,
    type ThemeMode,
    type ToneName,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 860
export const height = 520
export const alt =
    'Equal-size slot cells show six supplied record lengths 7, 6, 5, 5, 3 and 2. Separate capacity-10 blocks use 28 of 60 slots, or 47 percent rounded. Best-fit decreasing forms blocks [7,3], [6,2] and [5,5], using 28 of 30 slots, or 93 percent rounded, with two padding slots visible. A separate counterexample packs three length-6 records into three blocks, using 18 of 30 slots, or 60 percent. Letter IDs track the six supplied lengths through repacking.'

export const records = [7, 6, 5, 5, 3, 2].map((length, i) => ({
    id: String.fromCharCode(65 + i),
    length,
    tone: ['purple', 'blue', 'cyan', 'green', 'warm', 'neutral'][i] as ToneName,
}))

export function bestFit(items: typeof records) {
    const blocks: (typeof records)[] = []
    for (const record of [...items].sort((a, b) => b.length - a.length)) {
        const options = blocks.filter(
            (block) => block.reduce((sum, row) => sum + row.length, 0) + record.length <= 10,
        )
        options.sort(
            (a, b) =>
                b.reduce((sum, row) => sum + row.length, 0) -
                a.reduce((sum, row) => sum + row.length, 0),
        )
        if (options.length) options[0].push(record)
        else blocks.push([record])
    }
    return blocks
}

export const packed = bestFit(records)
export const awkward = [0, 1, 2].map((i) => [
    { id: 'counter-' + i, length: 6, tone: 'warm' as ToneName },
])

export const allRows = [
    ...records.map((record, i) => ({
        id: 'naive-' + record.id,
        label: record.id + ': ' + record.length,
        y: 110 + i * 36,
        records: [record],
        showIds: false,
    })),
    ...packed.map((block, i) => ({
        id: 'packed-' + i,
        label: 'Block ' + (i + 1),
        y: 120 + i * 58,
        records: block,
        showIds: true,
    })),
].map((row) => ({
    ...row,
    occupants: row.records.flatMap((record) => Array.from({ length: record.length }, () => record)),
    grid: layoutCellGrid({ x: 140, y: row.y, width: 240, height: 24, rows: 1, columns: 10 }),
    allocation: layoutAllocation({
        x: 140,
        y: row.y,
        width: 240,
        height: 24,
        capacity: 10,
        parts: row.records.map((record) => ({
            id: record.id,
            label: record.id,
            value: record.length,
        })),
    }),
}))

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const muted = c.textSecondary

    const toneColors: Record<string, string> = {
        A: purple,
        B: getReadableToneColor('blue', c),
        C: cyan,
        D: getReadableToneColor('green', c),
        E: warm,
        F: c.borderLight,
    }

    // Left panel: Naive unpack
    const naiveElements: ReactNode[] = []
    records.forEach((rec, i) => {
        const y = 110 + i * 44
        const w = (rec.length / 10) * 250
        naiveElements.push(
            // Background full slot (10 capacity)
            SvgFrame({
                c,
                x: 120,
                y,
                width: 250,
                height: 26,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1,
                key: `naive-bg-${i}`,
            }),
            // Active tokens
            SvgFrame({
                c,
                x: 120,
                y,
                width: w,
                height: 26,
                rx: 4,
                fill: toneColors[rec.id],
                key: `naive-fg-${i}`,
            }),
        )
    })

    // Right panel: Best-fit packed
    const packedBlocks = [
        {
            label: 'Block 1',
            items: [
                { id: 'A', len: 7 },
                { id: 'E', len: 3 },
            ],
            pad: 0,
        },
        {
            label: 'Block 2',
            items: [
                { id: 'B', len: 6 },
                { id: 'F', len: 2 },
            ],
            pad: 2,
        },
        {
            label: 'Block 3',
            items: [
                { id: 'C', len: 5 },
                { id: 'D', len: 5 },
            ],
            pad: 0,
        },
    ]

    const packedElements: ReactNode[] = []
    packedBlocks.forEach((b, i) => {
        const y = 120 + i * 58
        packedElements.push(
            SvgFrame({
                c,
                x: 540,
                y,
                width: 250,
                height: 32,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1,
                key: `pack-bg-${i}`,
            }),
        )
        let cx = 540
        b.items.forEach((item) => {
            const w = (item.len / 10) * 250
            packedElements.push(
                SvgFrame({
                    c,
                    x: cx,
                    y,
                    width: w,
                    height: 32,
                    rx: 3,
                    fill: toneColors[item.id],
                    key: `pack-item-${i}-${item.id}`,
                }),
            )
            cx += w
        })
    })

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Left Panel (Naive)
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 390,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        // Right Panel (Packed)
        SvgFrame({
            c,
            x: 430,
            y: 50,
            width: 410,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),
        ...naiveElements,
        ...packedElements,
        // Arrow from left to right
        VectorArrow({
            x1: 390,
            y1: 240,
            x2: 430,
            y2: 240,
            color: cyan,
            strokeWidth: 2.5,
            arrowSize: 8,
        }),
        // Summary Callout Card in Right Panel
        SvgFrame({
            c,
            x: 450,
            y: 310,
            width: 370,
            height: 130,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: cyan,
            strokeWidth: 1.5,
            key: 'card-efficiency',
        }),
    )

    const naiveLabels: ReactNode[] = []
    records.forEach((rec, i) => {
        const y = 110 + i * 44 + 4
        naiveLabels.push(
            label(c, `${rec.id} (${rec.length})`, 35, y, 80, 20, 13, toneColors[rec.id]),
            label(c, `${10 - rec.length} pad`, 380, y, 20, 20, 11, muted, 'right'),
        )
    })

    const packedLabels: ReactNode[] = []
    packedBlocks.forEach((b, i) => {
        const y = 120 + i * 58 + 6
        packedLabels.push(
            label(c, b.label, 450, y, 80, 20, 14, c.textPrimary),
            label(
                c,
                b.pad === 0 ? '100% full' : `${b.pad} pad (80%)`,
                540 + 258,
                y,
                40,
                20,
                11,
                b.pad === 0 ? cyan : muted,
            ),
        )
    })

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                {shapeSvg}
            </CanvasItem>
            {label(
                c,
                'Sequence Packing: Best-Fit Decreasing vs Naive Padding',
                20,
                12,
                width - 40,
                30,
                22,
                c.textPrimary,
                'center',
            )}

            {/* Left Panel */}
            {label(
                c,
                '1. Naive 1-Record Per Block (Capacity 10)',
                35,
                62,
                360,
                24,
                16,
                c.textPrimary,
            )}
            {label(
                c,
                '6 blocks required · 28 of 60 slots used (47% efficiency)',
                35,
                86,
                360,
                20,
                12,
                warm,
            )}
            {naiveLabels}
            {label(
                c,
                'Total: 28 tokens + 32 padding tokens (53% wasted compute)',
                35,
                385,
                360,
                20,
                11,
                warm,
            )}

            {/* Right Panel */}
            {label(c, '2. Best-Fit Decreasing Packed Blocks', 450, 62, 370, 24, 16, c.textPrimary)}
            {label(
                c,
                '3 blocks required · 28 of 30 slots used (93.3% efficiency)',
                450,
                86,
                370,
                20,
                12,
                cyan,
            )}
            {packedLabels}

            {/* Callout Card */}
            {label(c, 'Packing Yield & Throughput Gains', 465, 320, 340, 20, 14, cyan)}
            {label(
                c,
                '• Blocks reduced: 6 blocks → 3 blocks (2.0× throughput)',
                465,
                344,
                340,
                18,
                11,
                c.textPrimary,
            )}
            {label(
                c,
                '• Padding tokens: 32 tokens → 2 tokens (−94% waste)',
                465,
                366,
                340,
                18,
                11,
                cyan,
            )}
            {label(
                c,
                '• Efficiency: 46.7% → 93.3% (+46.6 percentage points)',
                465,
                388,
                340,
                18,
                11,
                purple,
            )}
            {label(
                c,
                'Requires cross-document attention masking to prevent context leakage.',
                465,
                412,
                340,
                18,
                11,
                muted,
            )}

            {label(
                c,
                'Best-fit decreasing sequence packing · Maximizes batch density and slashes padding waste',
                20,
                480,
                width - 40,
                24,
                14,
                muted,
                'center',
            )}
        </Board>
    )
}

export default create('dark')
