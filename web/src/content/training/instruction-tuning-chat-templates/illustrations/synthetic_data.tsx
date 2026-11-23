import React from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    SvgFrame,
    TextLabel,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 840
export const height = 520
export const alt =
    'A table of five candidate training rows against two checks. Row-001, row-003, and row-004 pass the keyword check and the source review, and are kept. Row-002 fails the keyword check and skips review. Row-005 passes the keyword check, because it contains every required string, and fails source review, because it denies the required ticket. Coverage bars for the kept rows show two stale-key rows, one admin-access row, and zero source-citation rows.'

const rows = [
    { id: '001', keyword: true, review: true, kept: true },
    { id: '002', keyword: false, review: null, kept: false },
    { id: '003', keyword: true, review: true, kept: true },
    { id: '004', keyword: true, review: true, kept: true },
    { id: '005', keyword: true, review: false, kept: false },
]

function leftFilterTable(c: ThemeColors, print = false) {
    const w = 440
    const h = print ? 320 : 420
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('critical', c)

    const label = (
        x: number,
        y: number,
        width: number,
        text: string,
        fontSize = 14,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'center',
        mono = true,
    ) => (
        <CanvasItem x={x} y={y} width={width} height={print ? 28 : 24}>
            <TextLabel
                c={c}
                text={text}
                width={width}
                fontSize={print ? Math.max(fontSize, 18) : fontSize}
                color={color}
                mono={mono}
                align={align}
            />
        </CanvasItem>
    )

    return (
        <Board c={c} width={w} height={h}>
            <CanvasItem x={0} y={0} width={w} height={h}>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    {/* Header line */}
                    <VectorSegment
                        x1={16}
                        y1={44}
                        x2={424}
                        y2={44}
                        color={c.borderLight}
                        strokeWidth={1.5}
                        showStartDot={false}
                        showEndDot={false}
                    />
                    {/* Row dividers */}
                    {rows.map((_, i) => (
                        <VectorSegment
                            key={i}
                            x1={16}
                            y1={88 + i * 54}
                            x2={424}
                            y2={88 + i * 54}
                            color={c.borderLight}
                            strokeWidth={1}
                            showStartDot={false}
                            showEndDot={false}
                        />
                    ))}
                </svg>
            </CanvasItem>

            {/* Table headers */}
            {label(20, 16, 90, 'Row ID', 13, c.textSecondary, 'left', false)}
            {label(120, 16, 90, 'Keywords', 13, c.textSecondary, 'center', false)}
            {label(220, 16, 90, 'Review', 13, c.textSecondary, 'center', false)}
            {label(320, 16, 90, 'Verdict', 13, c.textSecondary, 'center', false)}

            {/* Data rows */}
            {rows.map((r, i) => {
                const y = 56 + i * 54
                const kwText = r.keyword ? 'PASS' : 'FAIL'
                const revText = r.review === null ? 'N/A' : r.review ? 'PASS' : 'FAIL'
                const keptText = r.kept ? 'KEPT' : 'DROP'
                return (
                    <React.Fragment key={r.id}>
                        {label(20, y, 90, `row-${r.id}`, 14, c.textPrimary, 'left')}
                        {label(120, y, 90, kwText, 13, r.keyword ? green : red)}
                        {label(
                            220,
                            y,
                            90,
                            revText,
                            13,
                            r.review === null ? c.textSecondary : r.review ? green : red,
                        )}
                        {label(320, y, 90, keptText, 13, r.kept ? green : red)}
                    </React.Fragment>
                )
            })}

            {!print &&
                label(
                    20,
                    374,
                    400,
                    'row-005 passes keywords but denies required ticket; rejected.',
                    13,
                    c.warningDark,
                    'center',
                    false,
                )}
        </Board>
    )
}

function rightCoveragePanel(c: ThemeColors, print = false) {
    const coverage = [
        { label: 'Stale keys', count: 2, tone: 'cyan' as const },
        { label: 'Admin access', count: 1, tone: 'purple' as const },
        { label: 'Source citation', count: 0, tone: 'warm' as const },
    ]

    return Column({
        gap: 12,
        align: 'stretch',
        children: [
            Panel({
                c,
                width: 350,
                padding: 12,
                gap: 10,
                tone: 'neutral',
                title: 'Coverage in Kept Rows (3 Total)',
                titleFontSize: print ? 20 : 16,
                children: Column({
                    gap: 8,
                    align: 'stretch',
                    children: coverage.map((item) =>
                        Row({
                            gap: 10,
                            justify: 'space-between',
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: item.label,
                                    width: 140,
                                    fontSize: print ? 18 : 14,
                                    color: c.textPrimary,
                                }),
                                BadgePill({
                                    c,
                                    text: `${item.count} row${item.count === 1 ? '' : 's'}`,
                                    tone: item.tone,
                                    fontSize: print ? 18 : 13,
                                    height: print ? 28 : 24,
                                }),
                            ],
                        }),
                    ),
                }),
            }),
            Panel({
                c,
                width: 350,
                padding: 10,
                gap: 6,
                tone: 'warm',
                title: 'Coverage Blindspot',
                titleFontSize: 15,
                children: TextLabel({
                    c,
                    text: 'Filtering eliminated all source-citation examples (0 rows). Training on this slice will degrade citation grounding.',
                    width: 330,
                    fontSize: 13,
                    color: c.textSecondary,
                }),
            }),
            Panel({
                c,
                width: 350,
                padding: 10,
                gap: 4,
                tone: 'green',
                title: 'Dual Filter Standard',
                titleFontSize: 15,
                children: TextLabel({
                    c,
                    text: 'Heuristic keyword filters catch surface noise; expert or verifier review guards semantic correctness.',
                    width: 330,
                    fontSize: 13,
                    color: c.textPrimary,
                }),
            }),
        ].slice(0, print ? 1 : 3),
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 824,
        title: 'Heuristic Filtering Requires Semantic Verification',
        subtitle:
            'Surface keyword matching flags candidate rows but cannot verify factual alignment alone.',
        children: Row({
            width: 824,
            gap: 16,
            align: 'center',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    width: 448,
                    padding: 8,
                    gap: 4,
                    tone: 'neutral',
                    title: 'Filtering Stages',
                    titleFontSize: 17,
                    children: leftFilterTable(c),
                }),
                Column({
                    width: 360,
                    gap: 8,
                    align: 'stretch',
                    children: [rightCoveragePanel(c)],
                }),
            ],
        }),
    }),
)

export const create = illustration.create

export const createPrint = defineIllustration((c) =>
    Scene({
        c,
        padding: 12,
        contentWidth: 814,
        children: Row({
            width: 814,
            gap: 16,
            align: 'center',
            children: [
                Panel({
                    c,
                    width: 448,
                    padding: 8,
                    gap: 4,
                    tone: 'neutral',
                    title: 'Filtering stages',
                    titleFontSize: 20,
                    children: leftFilterTable(c, true),
                }),
                rightCoveragePanel(c, true),
            ],
        }),
    }),
).create

export default illustration.default
