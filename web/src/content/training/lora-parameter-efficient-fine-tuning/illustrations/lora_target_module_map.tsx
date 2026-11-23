import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 720
export const height = 780

export const qwen2Modules = [
    {
        name: 'q_proj',
        input: 16,
        output: 16,
        queryValue: true,
        attention: true,
        allLinear: true,
    },
    {
        name: 'k_proj',
        input: 16,
        output: 8,
        queryValue: false,
        attention: true,
        allLinear: true,
    },
    {
        name: 'v_proj',
        input: 16,
        output: 8,
        queryValue: true,
        attention: true,
        allLinear: true,
    },
    {
        name: 'o_proj',
        input: 16,
        output: 16,
        queryValue: false,
        attention: true,
        allLinear: true,
    },
    {
        name: 'gate_proj',
        input: 16,
        output: 32,
        queryValue: false,
        attention: false,
        allLinear: true,
    },
    {
        name: 'up_proj',
        input: 16,
        output: 32,
        queryValue: false,
        attention: false,
        allLinear: true,
    },
    {
        name: 'down_proj',
        input: 32,
        output: 16,
        queryValue: false,
        attention: false,
        allLinear: true,
    },
    {
        name: 'lm_head',
        input: 16,
        output: 32,
        queryValue: false,
        attention: false,
        allLinear: false,
    },
] as const

const rank = 2
export const targetTotals = {
    queryValue: qwen2Modules
        .filter((module) => module.queryValue)
        .reduce((sum, module) => sum + rank * (module.input + module.output), 0),
    attention: qwen2Modules
        .filter((module) => module.attention)
        .reduce((sum, module) => sum + rank * (module.input + module.output), 0),
    allLinear: qwen2Modules
        .filter((module) => module.allLinear)
        .reduce((sum, module) => sum + rank * (module.input + module.output), 0),
}

export const alt =
    'A module map for the one-layer Qwen2 CPU example with hidden width 16, intermediate width 32, two query heads, one key/value head, and rank 2. It lists the input and output widths and adapter parameter count for q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, and down_proj. The Q/V, all-attention, and all-linear columns mark the modules selected by each target set and total 112, 224, and 512 adapter parameters. The lm_head output projection is shown separately because PEFT all-linear excludes it for a PreTrainedModel.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: w,
            fontSize,
            color,
            fontWeight,
            align,
            mono,
        }),
    })
}

const coverageColumns = [
    {
        key: 'queryValue',
        x: 418,
        width: 72,
        label: 'Q/V',
        tone: 'purple' as const,
    },
    { key: 'attention', x: 508, width: 80, label: 'Attn', tone: 'cyan' as const },
    {
        key: 'allLinear',
        x: 606,
        width: 92,
        label: 'All\nlinear',
        tone: 'green' as const,
    },
] as const

function isSelected(
    module: (typeof qwen2Modules)[number],
    key: (typeof coverageColumns)[number]['key'],
) {
    return module[key]
}

function addCell(
    c: Colors,
    x: number,
    y: number,
    cellWidth: number,
    selected: boolean,
    tone: ToneName,
) {
    const color = getReadableToneColor(tone, c, getToneFill(tone, c), c.bg)
    const fill = selected ? getToneFill(tone, c) : c.bgCard
    return SvgFrame({
        c,
        x,
        y,
        width: cellWidth,
        height: 34,
        rx: 6,
        fill,
        stroke: selected ? color : c.borderSubtle,
        strokeWidth: selected ? 2 : 1,
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const muted = c.textSecondary
    const tableLeft = 20
    const rowWidth = 680
    const title = label(
        c,
        'Where this Qwen2 block gets LoRA',
        20,
        12,
        680,
        38,
        34,
        c.textPrimary,
        800,
    )
    const setup = label(c, '1 layer · hidden 16 · MLP 32 · rank 2', 22, 52, 676, 32, 26, muted, 650)
    const formula = label(
        c,
        'Per target: r(d_in + d_out) · r = 2',
        22,
        88,
        676,
        32,
        26,
        c.textPrimary,
        700,
        'left',
        true,
    )
    const legend = label(
        c,
        '1 = adapter attached · 0 = module untouched',
        22,
        122,
        676,
        32,
        26,
        muted,
        600,
    )
    const cellValueLabels = qwen2Modules.flatMap((module, index) => {
        const y = index < 4 ? 266 + index * 40 : index < 7 ? 466 + (index - 4) * 40 : 642
        return coverageColumns.map((column) => {
            const selected = isSelected(module, column.key)
            return label(
                c,
                selected ? '1' : '0',
                column.x,
                y + 2,
                column.width,
                30,
                25,
                selected ? c.textPrimary : c.textMuted,
                750,
                'center',
                true,
            )
        })
    })
    const moduleRowLabels = qwen2Modules.flatMap((module, index) => {
        const y = index < 4 ? 266 + index * 40 : index < 7 ? 466 + (index - 4) * 40 : 642
        const mutedRow = module.name === 'lm_head'
        return [
            label(c, module.name, 28, y + 2, 142, 30, 26, mutedRow ? muted : c.textPrimary, 700),
            label(
                c,
                `${module.input}→${module.output}`,
                180,
                y + 2,
                104,
                30,
                26,
                mutedRow ? muted : c.textPrimary,
                650,
                'center',
                true,
            ),
            label(
                c,
                mutedRow ? 'excluded' : String(rank * (module.input + module.output)),
                304,
                y + 2,
                98,
                30,
                mutedRow ? 24 : 26,
                mutedRow ? muted : c.textPrimary,
                700,
                'center',
                !mutedRow,
            ),
        ]
    })

    const shapes = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        SvgFrame({
            c,
            x: tableLeft,
            y: 164,
            width: rowWidth,
            height: 44,
            rx: 7,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: tableLeft,
            y: 230,
            width: rowWidth,
            height: 32,
            rx: 6,
            fill: getToneFill('blue', c),
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: tableLeft,
            y: 430,
            width: rowWidth,
            height: 32,
            rx: 6,
            fill: getToneFill('purple', c),
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: tableLeft,
            y: 602,
            width: rowWidth,
            height: 32,
            rx: 6,
            fill: getToneFill('neutral', c),
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: tableLeft,
            y: 642,
            width: rowWidth,
            height: 40,
            rx: 7,
            fill: c.bgSubtle,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        ...qwen2Modules.flatMap((module, index) => {
            const y = index < 4 ? 266 + index * 40 : index < 7 ? 466 + (index - 4) * 40 : 642
            const fill = module.name === 'lm_head' ? c.bgSubtle : c.bgCard
            const stroke = module.name === 'lm_head' ? c.borderSubtle : c.border
            const row = [
                SvgFrame({
                    c,
                    x: tableLeft,
                    y,
                    width: rowWidth,
                    height: 36,
                    rx: 6,
                    fill,
                    stroke,
                    strokeWidth: 1,
                }),
            ]
            for (const column of coverageColumns) {
                row.push(
                    addCell(
                        c,
                        column.x,
                        y + 1,
                        column.width,
                        isSelected(module, column.key),
                        column.tone,
                    ),
                )
            }
            return row
        }),
    )

    const totalY = 698
    const totalsLabels = [
        { key: 'queryValue', x: 418, width: 72, value: targetTotals.queryValue },
        { key: 'attention', x: 508, width: 80, value: targetTotals.attention },
        { key: 'allLinear', x: 606, width: 92, value: targetTotals.allLinear },
    ]

    return Board({
        background: 'transparent',
        c,
        width,
        height,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapes }),
            title,
            setup,
            formula,
            legend,
            ...moduleRowLabels,
            ...cellValueLabels,
            label(c, 'MODULE', 28, 168, 142, 32, 26, c.textPrimary, 800),
            label(c, 'IN→OUT', 180, 168, 110, 32, 24, c.textPrimary, 800, 'center'),
            label(c, 'PARAMS', 304, 168, 98, 32, 24, c.textPrimary, 800, 'center'),
            label(c, 'Q/V', 418, 168, 72, 32, 26, getReadableToneColor('purple', c), 800, 'center'),
            label(c, 'ATTN', 508, 168, 80, 32, 26, getReadableToneColor('cyan', c), 800, 'center'),
            label(c, 'ALL', 606, 168, 92, 32, 26, getReadableToneColor('green', c), 800, 'center'),
            label(c, 'ATTENTION · 2 Q heads · 1 KV head', 28, 230, 660, 32, 26, c.textPrimary, 800),
            label(c, 'SWIGLU MLP', 28, 430, 660, 32, 26, c.textPrimary, 800),
            label(c, 'OUTPUT PROJECTION', 28, 602, 660, 32, 26, muted, 800),
            label(c, 'TOTAL ADAPTER PARAMS', 28, totalY + 2, 360, 32, 26, c.textPrimary, 800),
            ...totalsLabels.flatMap(({ key, x, width: cellWidth, value }) => [
                label(
                    c,
                    String(value),
                    x,
                    totalY - 2,
                    cellWidth,
                    34,
                    28,
                    getReadableToneColor(
                        coverageColumns.find((column) => column.key === key)!.tone,
                        c,
                    ),
                    800,
                    'center',
                    true,
                ),
            ]),
            label(c, 'PEFT all-linear excludes lm_head.', 22, 742, 676, 32, 26, muted, 650),
        ],
    })
}

export default create('dark')
