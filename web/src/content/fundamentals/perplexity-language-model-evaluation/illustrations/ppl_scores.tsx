import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 540
export const alt =
    'Perplexity comparison across context lengths on wikitext-eval-v3 using tokenizer bpe-v7 and stride 512. At 2048 tokens of context, checkpoint 0400 scores PPL 3.18 and checkpoint 0800 scores PPL 2.31, cleanly isolating weight changes. A shorter 512-token context run sits on a different curve and cannot be compared directly.'

const ckpt0400 = [
    { x: 512, y: 3.92 },
    { x: 1024, y: 3.45 },
    { x: 2048, y: 3.18 },
]

const ckpt0800 = [
    { x: 512, y: 2.95 },
    { x: 1024, y: 2.54 },
    { x: 2048, y: 2.31 },
]

const yTicks = [
    { y: 4.5, label: '4.5' },
    { y: 3.0, label: '3.0' },
    { y: 1.5, label: '1.5' },
]

const xTicks = [
    { x: 512, label: '512 ctx', tone: 'warm' as const, bold: false },
    { x: 1024, label: '1024 ctx', tone: 'neutral' as const, bold: false },
    { x: 2048, label: '2048 ctx', tone: 'green' as const, bold: true },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const boardW = 636
    const boardH = 304
    const plotX = 72
    const plotY = 14
    const plotW = 514
    const plotH = 248
    const pad = 18
    const xMin = 512
    const xMax = 2048
    const yMin = 1.5
    const yMax = 4.5
    const innerW = plotW - pad * 2
    const innerH = plotH - pad * 2
    const sx = (x: number) => plotX + pad + ((x - xMin) / (xMax - xMin)) * innerW
    const sy = (y: number) => plotY + pad + innerH - ((y - yMin) / (yMax - yMin)) * innerH

    const gridH = yTicks.map(({ y }) => ({
        points: [
            { x: xMin, y },
            { x: xMax, y },
        ],
        tone: 'neutral' as const,
        strokeWidth: y === yMin ? 2 : 1,
        opacity: y === yMin ? 0.65 : 0.32,
    }))
    const gridV = xTicks.map(({ x }) => ({
        points: [
            { x, y: yMin },
            { x, y: yMax },
        ],
        tone: 'neutral' as const,
        strokeWidth: x === xMin ? 2 : 1,
        opacity: x === xMin ? 0.65 : 0.32,
    }))

    return Scene({
        c,
        title: 'Compare checkpoints under one scoring protocol',
        contentWidth: 636,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Compare checkpoints under one scoring protocol',
                        fontSize: 22,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'wikitext-eval-v3 · tokenizer bpe-v7 · fixed stride 512',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
            Board({
                c,
                width: boardW,
                height: boardH,
                children: [
                    ...yTicks.map(({ y, label }) =>
                        CanvasItem({
                            x: 0,
                            y: sy(y) - 12,
                            width: plotX - 6,
                            height: 24,
                            children: TextLabel({
                                c,
                                text: label,
                                width: plotX - 6,
                                fontSize: 19,
                                mono: true,
                                align: 'right',
                                color: c.textMuted,
                            }),
                        }),
                    ),
                    CanvasItem({
                        x: plotX,
                        y: plotY,
                        width: plotW,
                        height: plotH,
                        children: AxisPlot({
                            c,
                            width: plotW,
                            height: plotH,
                            padding: pad,
                            xMin,
                            xMax,
                            yMin,
                            yMax,
                            showGrid: false,
                            showAxes: false,
                            paths: [
                                ...gridH,
                                ...gridV,
                                { points: ckpt0400, tone: 'blue', strokeWidth: 4 },
                                { points: ckpt0800, tone: 'purple', strokeWidth: 4 },
                                {
                                    points: [
                                        { x: 2048, y: 1.5 },
                                        { x: 2048, y: 4.5 },
                                    ],
                                    tone: 'green',
                                    dashed: true,
                                    strokeWidth: 2,
                                },
                            ],
                            points: [
                                { x: 512, y: 3.92, tone: 'warm', r: 8 },
                                { x: 1024, y: 3.45, tone: 'blue', r: 6 },
                                { x: 2048, y: 3.18, tone: 'blue', r: 8 },
                                { x: 512, y: 2.95, tone: 'purple', r: 6 },
                                { x: 1024, y: 2.54, tone: 'purple', r: 6 },
                                { x: 2048, y: 2.31, tone: 'green', r: 9 },
                            ],
                            ariaLabel:
                                'Checkpoint 0400 and checkpoint 0800 compared at matched 2048-token context (3.18 vs 2.31), while 512-token context changes the conditioning regime',
                        }),
                    }),
                    ...xTicks.map(({ x, label, tone, bold }) =>
                        CanvasItem({
                            x: sx(x) - 50,
                            y: plotY + plotH - pad / 2 + 6,
                            width: 100,
                            height: 26,
                            children: TextLabel({
                                c,
                                text: label,
                                width: 100,
                                fontSize: 19,
                                mono: true,
                                fontWeight: bold ? 700 : 400,
                                align: 'center',
                                color:
                                    tone === 'neutral'
                                        ? c.textMuted
                                        : getReadableToneColor(tone, c),
                            }),
                        }),
                    ),
                ],
            }),
            Column({
                gap: 4,
                align: 'center',
                children: [
                    Row({
                        gap: 14,
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Blue: ckpt-0400 (3.18)',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('blue', c),
                            }),
                            TextLabel({
                                c,
                                text: 'Purple: ckpt-0800 (2.31) @ 2048',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('purple', c),
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Orange: 512 context changes conditioning (not compared)',
                        fontSize: 19,
                        fontWeight: 700,
                        color: getReadableToneColor('warm', c),
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
