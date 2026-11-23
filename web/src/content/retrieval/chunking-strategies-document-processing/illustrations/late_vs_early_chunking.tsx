import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const preset = 'default'
export const width = 860
export const height = 520
export const alt =
    'Side-by-side comparison of early and late chunking on an eight-word sentence split into spans of three, three, and two words. On the left (early), attention is constrained to block-diagonal spans so pooled states h4 to h6 lack sentence context. On the right (late), full cross-attention allows pooled states h4 to h6 to carry context from the entire sentence.'

const boardWidth = 860
const boardHeight = 520
const words = ['The', 'engineer', 'checks', 'each', 'runbook', 'before', 'every', 'deployment.']
const groups = [0, 0, 0, 1, 1, 1, 2, 2]
const selectedStart = 3
const selectedLength = 3
const cell = 18
const gap = 3
const gridSize = words.length * cell + (words.length - 1) * gap

if (words.length !== 8 || groups.length !== words.length) {
    throw new Error('Late-chunking display requires eight words grouped 3/3/2.')
}

function label(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 14,
    color = c.textPrimary,
    weight = 600,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * 1.4,
        children: TextLabel({
            c,
            text,
            width: w,
            fontSize: size,
            color,
            fontWeight: weight,
            align,
            mono,
            math: false,
        }),
    })
}

function pooledStates(c: ThemeColors, panelX: number, y: number, tone: string, isLate: boolean) {
    const widths = [48, 48, 48]
    const startOffset = 50
    const starts = [panelX + startOffset, panelX + startOffset + 56, panelX + startOffset + 112]
    const states = ['h₄', 'h₅', 'h₆']
    const arrowStart = panelX + startOffset + 168
    const arrowEnd = arrowStart + 36
    const pooledStart = arrowEnd + 12
    const pooledWidth = 88

    const geometry = createElement(
        'svg',
        {
            width: boardWidth,
            height: 40,
            viewBox: `0 0 ${boardWidth} 40`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...starts.map((x, index) =>
            createElement('rect', {
                key: `state-${panelX}-${index}`,
                x,
                y: 4,
                width: widths[index],
                height: 30,
                rx: 6,
                fill: tone,
                fillOpacity: 0.14,
                stroke: tone,
                strokeWidth: 1.5,
            }),
        ),
        VectorArrow({
            x1: arrowStart,
            y1: 19,
            x2: arrowEnd,
            y2: 19,
            color: tone,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        createElement('rect', {
            key: `pooled-${panelX}`,
            x: pooledStart,
            y: 4,
            width: pooledWidth,
            height: 30,
            rx: 6,
            fill: tone,
            fillOpacity: 0.25,
            stroke: tone,
            strokeWidth: 2,
        }),
    )
    return [
        CanvasItem({ x: 0, y, width: boardWidth, height: 40, children: geometry }),
        ...states.map((state, index) =>
            label(c, starts[index], y + 7, widths[index], state, 14, tone, 700, 'center', true),
        ),
        label(
            c,
            pooledStart,
            y + 7,
            pooledWidth,
            isLate ? 'contextual' : 'mean pool',
            13,
            tone,
            700,
            'center',
        ),
    ]
}

function matrix(c: ThemeColors, originX: number, originY: number, late: boolean, colors: string[]) {
    const groupBounds = [0, 3, 6, 8]
    const cells = Array.from({ length: words.length }, (_, row) =>
        Array.from({ length: words.length }, (_, column) => {
            const sameSpan = groups[row] === groups[column]
            const active = late || sameSpan
            const selectedRow = row >= selectedStart && row < selectedStart + selectedLength
            const fill = active ? colors[groups[row]] : c.textMuted
            return createElement('rect', {
                key: `${late ? 'late' : 'early'}-${row}-${column}`,
                x: originX + column * (cell + gap),
                y: originY + row * (cell + gap),
                width: cell,
                height: cell,
                rx: 3,
                fill,
                fillOpacity: active ? (selectedRow ? 0.85 : 0.6) : 0.08,
                stroke: active ? fill : c.borderLight,
                strokeOpacity: active ? 0.7 : 0.3,
                strokeWidth: 1,
            })
        }),
    )

    const separators = groupBounds.slice(1, -1).flatMap((position) => {
        const offset = position * (cell + gap) - gap / 2
        return [
            createElement('line', {
                key: `col-sep-${late ? 'l' : 'e'}-${position}`,
                x1: originX + offset,
                x2: originX + offset,
                y1: originY - 2,
                y2: originY + gridSize + 2,
                stroke: c.textMuted,
                strokeWidth: 1.5,
                strokeDasharray: '3 3',
                opacity: 0.7,
            }),
            createElement('line', {
                key: `row-sep-${late ? 'l' : 'e'}-${position}`,
                x1: originX - 2,
                x2: originX + gridSize + 2,
                y1: originY + offset,
                y2: originY + offset,
                stroke: c.textMuted,
                strokeWidth: 1.5,
                strokeDasharray: '3 3',
                opacity: 0.7,
            }),
        ]
    })

    const selectedY = originY + selectedStart * (cell + gap) - 2
    const selectedHeight = selectedLength * cell + (selectedLength - 1) * gap + 4
    const geometry = createElement(
        'svg',
        {
            width: boardWidth,
            height: boardHeight,
            viewBox: `0 0 ${boardWidth} ${boardHeight}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...cells.flat(),
        ...separators,
        createElement('rect', {
            key: `pooled-band-${late ? 'l' : 'e'}`,
            x: originX - 3,
            y: selectedY,
            width: gridSize + 6,
            height: selectedHeight,
            rx: 5,
            fill: 'none',
            stroke: getReadableToneColor('cyan', c),
            strokeWidth: 2,
            strokeDasharray: '5 4',
        }),
    )

    const groupTexts = [
        { x: originX, width: 3 * cell + 2 * gap, text: '1–3' },
        { x: originX + 3 * (cell + gap), width: 3 * cell + 2 * gap, text: '4–6' },
        { x: originX + 6 * (cell + gap), width: 2 * cell + gap, text: '7–8' },
    ]
    const rowStarts = groupBounds.slice(0, -1).map((start, index) => ({
        y:
            originY +
            start * (cell + gap) +
            ((groupBounds[index + 1] - start) * (cell + gap)) / 2 -
            8,
        text: ['1–3', '4–6', '7–8'][index],
    }))

    return [
        CanvasItem({ x: 0, y: 0, width: boardWidth, height: boardHeight, children: geometry }),
        ...groupTexts.map((group) =>
            label(
                c,
                group.x,
                originY - 20,
                group.width,
                group.text,
                12,
                c.textSecondary,
                600,
                'center',
                true,
            ),
        ),
        ...rowStarts.map((row) =>
            label(c, originX - 34, row.y, 28, row.text, 12, c.textSecondary, 600, 'right', true),
        ),
        label(c, originX, originY - 34, gridSize, 'Input tokens', 12, c.textMuted, 600, 'center'),
        label(c, originX - 44, originY - 34, 40, 'Out', 12, c.textMuted, 600, 'right'),
    ]
}

const illustration = defineIllustration((c) => {
    const colors = [
        getReadableToneColor('blue', c),
        getReadableToneColor('cyan', c),
        getReadableToneColor('purple', c),
    ]

    const geometry = createElement(
        'svg',
        {
            width: boardWidth,
            height: boardHeight,
            viewBox: `0 0 ${boardWidth} ${boardHeight}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Top sentence spans
        ...[
            { x: 30, y: 44, w: 250, text: 'The engineer checks (1–3)', color: colors[0] },
            { x: 295, y: 44, w: 270, text: 'each runbook before (4–6)', color: colors[1] },
            { x: 580, y: 44, w: 250, text: 'every deployment. (7–8)', color: colors[2] },
        ].map((span, idx) =>
            createElement('rect', {
                key: `top-span-${idx}`,
                x: span.x,
                y: span.y,
                width: span.w,
                height: 26,
                rx: 6,
                fill: span.color,
                fillOpacity: 0.12,
                stroke: span.color,
                strokeWidth: 1.5,
            }),
        ),
        // Central divider
        createElement('line', {
            key: 'center-divider',
            x1: 430,
            x2: 430,
            y1: 82,
            y2: 495,
            stroke: c.borderLight,
            strokeWidth: 1,
            strokeDasharray: '4 4',
        }),
    )

    return Scene({
        c,
        padding: 12,
        gap: 0,
        contentWidth: boardWidth,
        children: Board({
            c,
            width: boardWidth,
            height: boardHeight,
            background: 'transparent',
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width: boardWidth,
                    height: boardHeight,
                    children: geometry,
                }),
                // Top header
                label(
                    c,
                    30,
                    16,
                    800,
                    'Document Spans: 8-word sentence split into 3, 3, and 2 tokens',
                    15,
                    c.textPrimary,
                    700,
                ),
                label(c, 40, 48, 230, '1–3: The engineer checks', 13, colors[0], 700),
                label(c, 305, 48, 250, '4–6: each runbook before', 13, colors[1], 700),
                label(c, 590, 48, 230, '7–8: every deployment.', 13, colors[2], 700),

                // Left Panel: Early Chunking
                label(c, 30, 88, 370, 'EARLY · Split first, encode each chunk', 16, colors[0], 800),
                label(
                    c,
                    30,
                    110,
                    370,
                    'Self-attention restricted within chunk boundaries',
                    13,
                    c.textSecondary,
                    500,
                ),
                ...matrix(c, 130, 170, false, colors),
                label(
                    c,
                    30,
                    360,
                    370,
                    'Mean-pool middle span (tokens 4–6):',
                    13,
                    c.textSecondary,
                    600,
                ),
                ...pooledStates(c, 24, 385, colors[1], false),
                label(
                    c,
                    30,
                    440,
                    370,
                    'Result: States h₄–h₆ contain zero context from words 1–3 or 7–8.',
                    12,
                    c.textMuted,
                    500,
                ),

                // Right Panel: Late Chunking
                label(
                    c,
                    450,
                    88,
                    370,
                    'LATE · Encode full document, then pool spans',
                    16,
                    colors[2],
                    800,
                ),
                label(
                    c,
                    450,
                    110,
                    370,
                    'Full bidirectional cross-attention across all tokens',
                    13,
                    c.textSecondary,
                    500,
                ),
                ...matrix(c, 550, 170, true, colors),
                label(
                    c,
                    450,
                    360,
                    370,
                    'Mean-pool middle span (tokens 4–6):',
                    13,
                    c.textSecondary,
                    600,
                ),
                ...pooledStates(c, 444, 385, colors[2], true),
                label(
                    c,
                    450,
                    440,
                    370,
                    'Result: States h₄–h₆ carry rich sentence-wide context across chunk boundaries.',
                    12,
                    c.textMuted,
                    500,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
