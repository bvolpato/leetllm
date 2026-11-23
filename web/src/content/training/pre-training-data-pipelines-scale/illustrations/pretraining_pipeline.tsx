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
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 860
export const height = 500
export const alt =
    'Five retention rows share a 100-document scale for an illustrative batch. Raw sources contain 100 records. Extraction retains 82 and removes 18; quality retains 42 and removes 40; near-deduplication retains 31 and removes 11; policy and evaluation checks retain 29 and remove 2. Cyan marks retained records, amber marks removals at the current gate, and empty space marks earlier removals. The four removal counts plus 29 retained records account for all 100 documents.'

export const stages = [
    { id: 'raw', label: 'Raw sources', kept: 100, removed: 0, reason: '' },
    {
        id: 'extraction',
        label: 'Extraction',
        kept: 82,
        removed: 18,
        reason: '18 extraction failures',
    },
    { id: 'quality', label: 'Quality gate', kept: 42, removed: 40, reason: '40 quality drops' },
    { id: 'dedup', label: 'Near-dedup', kept: 31, removed: 11, reason: '11 near-duplicates' },
    { id: 'policy', label: 'Policy / eval', kept: 29, removed: 2, reason: '2 policy / eval drops' },
]

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
    const muted = c.textSecondary

    const barX = 180
    const barWidth = 340
    const startY = 100
    const rowHeight = 65

    const allocations = stages.map((stage, i) =>
        layoutAllocation({
            x: barX,
            y: startY + i * rowHeight + 10,
            width: barWidth,
            height: 28,
            capacity: 100,
            parts: [
                { id: 'kept', label: 'Kept', value: stage.kept },
                { id: 'removed', label: 'Removed here', value: stage.removed },
            ],
        }),
    )

    const stageElements: ReactNode[] = []
    allocations.forEach((allocation, i) => {
        stageElements.push(
            SvgFrame({
                c,
                ...allocation.bounds,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1,
                key: `frame-${stages[i].id}`,
            }),
        )
        allocation.parts
            .filter((p) => p.value > 0)
            .forEach((part) => {
                stageElements.push(
                    SvgFrame({
                        c,
                        ...part.bounds,
                        rx: 4,
                        fill: part.id === 'kept' ? cyan : warm,
                        key: `part-${stages[i].id}-${part.id}`,
                    }),
                )
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
        // Left Panel Frame
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 530,
            height: 400,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-funnel',
        }),
        // Right Panel Frame
        SvgFrame({
            c,
            x: 570,
            y: 50,
            width: 270,
            height: 400,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-summary',
        }),
        ...stageElements,
        // Card in right panel
        SvgFrame({
            c,
            x: 590,
            y: 110,
            width: 230,
            height: 70,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: cyan,
            strokeWidth: 1.5,
            key: 'card-net-yield',
        }),
        SvgFrame({
            c,
            x: 590,
            y: 200,
            width: 230,
            height: 220,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-losses',
        }),
    )

    const stageLabels: ReactNode[] = []
    stages.forEach((stage, i) => {
        const y = startY + i * rowHeight + 14
        stageLabels.push(
            label(c, stage.label, 35, y, 140, 24, 15, c.textPrimary),
            label(
                c,
                `${stage.kept}`,
                barX + (stage.kept * barWidth) / 100 + 8,
                y,
                40,
                24,
                14,
                cyan,
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
                'Pre-training Data Ingestion & Filtration Funnel',
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
                'Document Retention by Pipeline Stage (100 Doc Scale)',
                35,
                62,
                490,
                24,
                16,
                c.textPrimary,
            )}
            {label(
                c,
                'Cyan: retained · Amber: filtered at current gate · Gray: prior drops',
                35,
                88,
                490,
                20,
                12,
                muted,
            )}
            {stageLabels}

            {/* Right Panel */}
            {label(c, 'Pipeline Yield & Losses', 585, 62, 240, 24, 16, c.textPrimary)}
            {label(c, 'Net Yield: 29% Retained', 600, 120, 210, 22, 15, cyan)}
            {label(c, '29 of 100 documents reach training', 600, 146, 210, 20, 11, muted)}

            {label(c, 'Cumulative Drop Breakdown', 600, 212, 210, 20, 13, c.textPrimary)}
            {label(c, '• 18 Extraction failures (HTML/PDF)', 605, 240, 200, 20, 11, muted)}
            {label(c, '• 40 Quality / perplexity drops', 605, 275, 200, 20, 11, warm)}
            {label(c, '• 11 Near-duplicate documents', 605, 310, 200, 20, 11, warm)}
            {label(c, '• 2 Benchmark decontamination', 605, 345, 200, 20, 11, muted)}
            {label(c, 'Total filtered: 71 documents (71%)', 605, 385, 200, 20, 12, warm)}

            {label(
                c,
                'Retention across filtering passes · Quality filtering accounts for the largest fraction of discarded text volume',
                20,
                460,
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
