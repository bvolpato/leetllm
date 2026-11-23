import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 560
export const alt =
    'Paired benchmark comparison between FP16/BF16 baseline and Q4_K_M quantized checkpoint across four tasks. Both score 3 out of 4 (75%), yet Q4_K_M fails critical JSON schema validation while gaining a pass on long-context needle recall. Bar lengths and pass/fail indicators show why aggregate accuracy hides regressions.'

const label = (
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 700,
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={size}
            fontWeight={weight}
            color={color}
            align={align}
        />
    </CanvasItem>
)

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = c.info
    const green = c.positive
    const red = c.critical
    const warm = c.warning

    const cases = [
        { name: 'json_tool_schema', base: true, quant: false, delta: 'REGRESSED', dcol: red },
        { name: 'mmlu_core', base: true, quant: true, delta: 'unchanged', dcol: c.textSecondary },
        { name: 'gsm8k_exact', base: true, quant: true, delta: 'unchanged', dcol: c.textSecondary },
        { name: 'long_ctx_recall', base: false, quant: true, delta: 'improved', dcol: warm },
    ]
    const rowY = (i: number) => 152 + i * 62

    const geometry = AxisPlot({
        c,
        width,
        height,
        xMin: 0,
        xMax: width,
        yMin: 0,
        yMax: height,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        children: [
            SvgFrame({
                c,
                x: 24,
                y: 106,
                width: 852,
                height: 304,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...cases.map((r, i) =>
                SvgFrame({
                    c,
                    x: 40,
                    y: rowY(i),
                    width: 820,
                    height: 50,
                    rx: 8,
                    fill: c.bgCardAlt,
                    stroke: i === 0 ? red : c.borderSubtle,
                    strokeWidth: i === 0 ? 2 : 1,
                }),
            ),
            // Summary pass bars
            SvgFrame({
                c,
                x: 24,
                y: 428,
                width: 852,
                height: 112,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 256,
                y: 448,
                width: 376,
                height: 28,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 256,
                y: 490,
                width: 376,
                height: 28,
                rx: 6,
                fill: red,
                stroke: red,
                strokeWidth: 1,
            }),
        ],
    })

    const pointsOverlay = AxisPlot({
        c,
        width,
        height,
        xMin: 0,
        xMax: width,
        yMin: 0,
        yMax: height,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        points: cases.flatMap((r, i) => {
            const cy = height - (rowY(i) + 25)
            return [
                { x: 382, y: cy, fill: r.base ? green : red, r: 9 },
                { x: 562, y: cy, fill: r.quant ? green : red, r: 9 },
            ]
        }),
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: (
            <Board c={c} width={width} height={height} background="transparent">
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {geometry}
                </CanvasItem>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {pointsOverlay}
                </CanvasItem>

                {label(
                    c,
                    'Paired checks catch regressions hidden by accuracy',
                    20,
                    14,
                    860,
                    42,
                    31,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(
                    c,
                    'Compare BF16 vs. Q4_K_M task-by-task on identical prompts',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, 'Task check', 52, 114, 280, 34, 28, c.textSecondary, 'left', 750)}
                {label(c, 'BF16', 360, 114, 150, 34, 28, blue, 'center', 800)}
                {label(c, 'Q4_K_M', 540, 114, 150, 34, 28, warm, 'center', 800)}
                {label(c, 'Diff', 706, 114, 140, 34, 28, c.textSecondary, 'center', 750)}

                {cases.map((r, i) => (
                    <React.Fragment key={r.name}>
                        {label(c, r.name, 52, rowY(i) + 8, 286, 34, 28, c.textPrimary, 'left', 700)}
                        {label(
                            c,
                            r.base ? 'Pass' : 'Fail',
                            404,
                            rowY(i) + 8,
                            96,
                            34,
                            28,
                            r.base ? green : red,
                            'left',
                            750,
                        )}
                        {label(
                            c,
                            r.quant ? 'Pass' : 'Fail',
                            584,
                            rowY(i) + 8,
                            96,
                            34,
                            28,
                            r.quant ? green : red,
                            'left',
                            750,
                        )}
                        {label(c, r.delta, 686, rowY(i) + 8, 168, 34, 28, r.dcol, 'center', 750)}
                    </React.Fragment>
                ))}

                {label(c, 'BF16 total', 44, 444, 200, 34, 28, blue, 'left', 750)}
                {label(c, '3 / 4 (75%)', 648, 444, 212, 34, 28, c.textPrimary, 'left', 750)}
                {label(c, 'Q4_K_M total', 44, 486, 200, 34, 28, red, 'left', 750)}
                {label(c, '3 / 4 (blocks!)', 648, 486, 212, 34, 28, red, 'left', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
