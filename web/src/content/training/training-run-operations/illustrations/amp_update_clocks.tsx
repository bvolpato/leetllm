import {
    BadgePill,
    Board,
    CanvasItem,
    Panel,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getToneColor,
} from 'vizmatic'
import { createElement } from 'react'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 640
export const height = 830
export const opaqueBackground = true
export const alt =
    'An authored three-window FP16 GradScaler trace uses 64 examples per accumulation window and a scheduler indexed by successful optimizer updates. Window 1 is finite: the optimizer and scheduler advance to 1. Window 2 consumes the next 64 examples but has nonfinite gradients: the optimizer step is skipped, the successful-update and scheduler counters stay at 1, and the scaler backs off. Window 3 is finite: the optimizer and scheduler advance to 2. The counters distinguish attempted windows, consumed examples, and successful parameter updates.'

type Cell = {
    x: number
    y: number
    w: number
    h: number
    text: string
    color: string
    size?: number
    weight?: number
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const tone = (name: ToneName) => getToneColor(name, c)
    const left = 176
    const colW = 132
    const colGap = 22
    const stateX = (index: number) => left + index * (colW + colGap)
    const rowYs = [410, 478, 546, 614]
    const rows = [
        { label: 'Attempts', values: ['1', '2', '3'], tone: 'blue' as ToneName },
        { label: 'Examples', values: ['64', '128', '192'], tone: 'cyan' as ToneName },
        { label: 'Updates', values: ['1', '1', '2'], tone: 'green' as ToneName },
        { label: 'LR step*', values: ['1', '1', '2'], tone: 'purple' as ToneName },
    ]
    const counters = rows.flatMap((row, rowIndex) => [
        CanvasItem({
            x: 12,
            y: rowYs[rowIndex],
            width: 154,
            height: 40,
            children: TextLabel({
                c,
                text: row.label,
                fontSize: 22,
                fontWeight: 600,
                color: c.textPrimary,
                align: 'right',
                width: 154,
            }),
        }),
        ...row.values.map((value, colIndex) =>
            CanvasItem({
                x: stateX(colIndex),
                y: rowYs[rowIndex],
                width: colW,
                height: 44,
                children: BadgePill({
                    c,
                    text: value,
                    tone: row.tone,
                    width: colW,
                    height: 42,
                    fontSize: 25,
                }),
            }),
        ),
    ])
    const eventCards = [
        { title: 'W1', body: ['finite', '64 used', 'step → 1'], color: 'green' as ToneName },
        {
            title: 'W2',
            body: ['overflow', '64 used', 'step held', 'scale ↓'],
            color: 'warm' as ToneName,
        },
        { title: 'W3', body: ['finite', '64 used', 'step → 2'], color: 'green' as ToneName },
    ].map((event, index) =>
        CanvasItem({
            x: stateX(index),
            y: 202,
            width: colW,
            height: 170,
            children: Panel({
                c,
                title: event.title,
                titleFontSize: 24,
                tone: event.color,
                width: colW,
                height: 170,
                padding: 6,
                gap: 2,
                align: 'center',
                children: event.body.map((line) =>
                    TextLabel({
                        c,
                        text: line,
                        fontSize: 22,
                        fontWeight: line.includes('step') ? 700 : 500,
                        color: c.textPrimary,
                        align: 'center',
                        width: 112,
                    }),
                ),
            }),
        }),
    )

    const connectors = createElement(
        'svg',
        { width: 640, height: 830, viewBox: '0 0 640 830' },
        ...[0, 1].map((index) =>
            VectorArrow({
                x1: stateX(index) + colW + 2,
                y1: 268,
                x2: stateX(index + 1) - 3,
                y2: 268,
                color: index === 1 ? tone('warm') : c.textMuted,
                strokeWidth: 3,
                arrowSize: 6,
            }),
        ),
    )

    const notes: Cell[] = [
        {
            x: 22,
            y: 684,
            w: 596,
            h: 32,
            text: '64 examples consumed · update stays at 1.',
            color: c.textPrimary,
            size: 22,
            weight: 700,
        },
        {
            x: 22,
            y: 722,
            w: 596,
            h: 32,
            text: 'The scaler backs off after nonfinite gradients.',
            color: c.textPrimary,
            size: 22,
        },
        {
            x: 22,
            y: 760,
            w: 596,
            h: 34,
            text: '*The LR schedule follows successful updates.',
            color: c.textSecondary,
            size: 22,
        },
    ]

    return Board({
        c,
        width: 640,
        height: 830,
        background: c.bg,
        children: [
            CanvasItem({
                x: 20,
                y: 16,
                width: 600,
                height: 46,
                children: TextLabel({
                    c,
                    text: 'One overflow moves only some clocks',
                    fontSize: 29,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                    width: 600,
                }),
            }),
            CanvasItem({
                x: 20,
                y: 62,
                width: 600,
                height: 34,
                children: TextLabel({
                    c,
                    text: 'Authored FP16 trace · 64 examples per window',
                    fontSize: 22,
                    color: c.textSecondary,
                    align: 'center',
                    width: 600,
                }),
            }),
            CanvasItem({
                x: 20,
                y: 112,
                width: 600,
                height: 34,
                children: TextLabel({
                    c,
                    text: 'Attempts  ·  examples consumed  ·  updates applied',
                    width: 600,
                    fontSize: 22,
                    color: c.textPrimary,
                    align: 'center',
                }),
            }),
            ...eventCards,
            CanvasItem({ x: 0, y: 0, width: 640, height: 830, children: connectors }),
            CanvasItem({
                x: 16,
                y: 380,
                width: 608,
                height: 28,
                children: TextLabel({
                    c,
                    text: 'Cumulative counts after each window',
                    fontSize: 22,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                    width: 608,
                }),
            }),
            ...counters,
            ...notes.map((note) =>
                CanvasItem({
                    x: note.x,
                    y: note.y,
                    width: note.w,
                    height: note.h,
                    children: TextLabel({
                        c,
                        text: note.text,
                        fontSize: note.size ?? 22,
                        fontWeight: note.weight ?? 500,
                        color: note.color,
                        align: 'center',
                        width: note.w,
                    }),
                }),
            ),
        ],
    })
}

export default create('dark')
