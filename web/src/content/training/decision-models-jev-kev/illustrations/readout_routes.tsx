import { createElement } from 'react'
import {
    SvgFrame,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    mapNumberLine,
    type ThemeMode,
} from 'vizmatic'
import { figure, label } from './decision_canvas'

export const width = 860
export const height = 520
export const preset = 'engineering'
export const alt =
    'Two-dimensional vector projection for decision routing with decision state vector d=[1, 0] and candidate option vectors A=[0, 1], B=[2, 0], and C=[0.5, 0.5]. Projected dot products evaluate to 0 for A, 2 for B, and 0.5 for C, yielding scaled logits [0.0, 1.414, 0.354] with scaling factor 1/sqrt(2). Softmax probabilities at temperature T=1.0 assign [0.153, 0.629, 0.218], while temperature T=2.0 softens the distribution to [0.237, 0.480, 0.283], preserving choice B as the predicted winner.'

export const decision = [1, 0] as const
export const options = [
    { id: 'A', name: 'Option A', vector: [0, 1], tone: 'blue' },
    { id: 'B', name: 'Option B [Winner]', vector: [2, 0], tone: 'green' },
    { id: 'C', name: 'Option C', vector: [0.5, 0.5], tone: 'purple' },
].map((r, index) => ({
    ...r,
    index,
    dot: r.vector[0] * decision[0] + r.vector[1] * decision[1],
}))

export const logits = options.map((r) => r.dot / Math.sqrt(2))

const softmax = (temperature: number) => {
    const maxZ = Math.max(...logits)
    const weights = logits.map((z) => Math.exp((z - maxZ) / temperature))
    const total = weights.reduce((a, b) => a + b, 0)
    return weights.map((w) => w / total)
}

export const probabilities = { t1: softmax(1.0), t2: softmax(2.0) }

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)

    const geometry = []
    const labels = []

    const arrow = (
        id: string,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        strokeWidth = 2.5,
    ) =>
        createElement(
            'g',
            { id },
            VectorArrow({ x1, y1, x2, y2, color, strokeWidth, arrowSize: 7 }),
        )

    const segment = (
        id: string,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color = c.border,
        dashed = false,
    ) =>
        createElement(
            'g',
            { id, ...(dashed ? { strokeDasharray: '5 4' } : {}) },
            VectorSegment({
                x1,
                y1,
                x2,
                y2,
                color,
                strokeWidth: 1.5,
                showStartDot: false,
                showEndDot: false,
            }),
        )

    const box = (id: string, x: number, y: number, w: number, h: number, tone: string) =>
        createElement(
            'g',
            { id },
            SvgFrame({
                c,
                x,
                y,
                width: w,
                height: h,
                rx: 8,
                fill: c.bgSubtle,
                stroke: tone,
                strokeWidth: 1.5,
            }),
        )

    // Panels
    const cardW = 394
    const leftX = 24
    const rightX = 442
    const topY = 70
    const cardH = 410

    // Left Panel: 2D Embedding Projection
    geometry.push(box('geom-box', leftX, topY, cardW, cardH, warm))
    labels.push(
        label(
            c,
            'title-geom',
            '1. State & Option Vectors in Embedding Space',
            leftX + 16,
            topY + 16,
            cardW - 32,
            {
                size: 15,
                weight: 700,
                color: warm,
            },
        ),
        label(
            c,
            'sub-geom',
            'Decision vector d projected against candidate option vectors',
            leftX + 16,
            topY + 38,
            cardW - 32,
            {
                size: 13,
                color: c.textSecondary,
            },
        ),
    )

    // Coordinate axis for vector space
    // Origin at (leftX + 70, topY + 330)
    const oX = leftX + 80
    const oY = topY + 330
    const scaleX = 120 // 1 unit = 120px
    const scaleY = 180 // 1 unit = 180px

    const toPlotX = (x: number) => oX + x * scaleX
    const toPlotY = (y: number) => oY - y * scaleY

    // Axes
    geometry.push(
        segment('x-axis', oX - 10, oY, toPlotX(2.2), oY, c.textSecondary),
        segment('y-axis', oX, oY + 10, oX, toPlotY(1.2), c.textSecondary),
    )
    labels.push(
        label(c, 'x-axis-lbl', 'Dim 0', toPlotX(2.2) + 6, oY - 8, 50, {
            size: 11,
            color: c.textSecondary,
        }),
        label(c, 'y-axis-lbl', 'Dim 1', oX - 15, toPlotY(1.2) - 18, 50, {
            size: 11,
            color: c.textSecondary,
        }),
    )

    // Grid marks
    for (const val of [0.5, 1.0, 1.5, 2.0]) {
        geometry.push(segment(`gx-${val}`, toPlotX(val), oY - 4, toPlotX(val), oY + 4, c.border))
        labels.push(
            label(c, `tx-${val}`, `${val}`, toPlotX(val) - 10, oY + 8, 20, {
                size: 10,
                align: 'center',
                color: c.textSecondary,
            }),
        )
    }
    for (const val of [0.5, 1.0]) {
        geometry.push(segment(`gy-${val}`, oX - 4, toPlotY(val), oX + 4, toPlotY(val), c.border))
        labels.push(
            label(c, `ty-${val}`, `${val}`, oX - 28, toPlotY(val) - 7, 24, {
                size: 10,
                align: 'right',
                color: c.textSecondary,
            }),
        )
    }

    // Vectors
    // Decision vector d = [1, 0]
    geometry.push(arrow('vec-d', oX, oY, toPlotX(1.0), toPlotY(0), warm, 3))
    labels.push(
        label(c, 'lbl-d', 'd = [1, 0] (State)', toPlotX(1.0) - 20, oY + 22, 130, {
            size: 12,
            weight: 700,
            color: warm,
        }),
    )

    // Option A: [0, 1]
    geometry.push(arrow('vec-a', oX, oY, toPlotX(0), toPlotY(1.0), blue, 2))
    labels.push(
        label(c, 'lbl-a', 'A [0, 1]', toPlotX(0) + 8, toPlotY(1.0) - 10, 80, {
            size: 12,
            weight: 600,
            color: blue,
        }),
    )

    // Option B: [2, 0]
    geometry.push(arrow('vec-b', oX, oY, toPlotX(2.0), toPlotY(0), green, 2.5))
    labels.push(
        label(c, 'lbl-b', 'B [2, 0]', toPlotX(2.0) - 10, oY - 24, 80, {
            size: 12,
            weight: 700,
            color: green,
        }),
    )

    // Option C: [0.5, 0.5]
    geometry.push(arrow('vec-c', oX, oY, toPlotX(0.5), toPlotY(0.5), purple, 2))
    labels.push(
        label(c, 'lbl-c', 'C [0.5, 0.5]', toPlotX(0.5) + 6, toPlotY(0.5) - 14, 90, {
            size: 12,
            weight: 600,
            color: purple,
        }),
    )

    // Projection dashed lines to decision vector axis
    geometry.push(
        segment('proj-c', toPlotX(0.5), toPlotY(0.5), toPlotX(0.5), oY, purple, true),
        segment('proj-a', toPlotX(0), toPlotY(1.0), toPlotX(0), oY, blue, true),
    )

    labels.push(
        label(
            c,
            'geom-note',
            'Dot product d · o projects candidates onto state dimension 0',
            leftX + 16,
            topY + 372,
            cardW - 32,
            {
                size: 11,
                align: 'center',
                color: c.textSecondary,
            },
        ),
    )

    // Right Panel: Logits and Softmax Readout
    geometry.push(box('readout-box', rightX, topY, cardW, cardH, green))
    labels.push(
        label(
            c,
            'title-readout',
            '2. Projected Logits & Temperature Softmax',
            rightX + 16,
            topY + 16,
            cardW - 32,
            {
                size: 15,
                weight: 700,
                color: green,
            },
        ),
        label(
            c,
            'sub-readout',
            'Logit z = (d · o) / sqrt(d_k), comparing T = 1.0 vs T = 2.0',
            rightX + 16,
            topY + 38,
            cardW - 32,
            {
                size: 13,
                color: c.textSecondary,
            },
        ),
    )

    // Table / Rows for A, B, C
    const rowY = (i: number) => topY + 95 + i * 88
    options.forEach((opt, i) => {
        const ry = rowY(i)
        const tone = opt.tone === 'blue' ? blue : opt.tone === 'green' ? green : purple
        const z = logits[i]
        const pT1 = probabilities.t1[i]
        const pT2 = probabilities.t2[i]

        geometry.push(
            createElement(
                'g',
                { id: `card-row-${opt.id}` },
                SvgFrame({
                    c,
                    x: rightX + 12,
                    y: ry,
                    width: cardW - 24,
                    height: 76,
                    rx: 6,
                    fill: c.bg,
                    stroke: tone,
                    strokeWidth: 1.5,
                }),
            ),
        )

        labels.push(
            label(
                c,
                `opt-title-${opt.id}`,
                `Choice ${opt.id}: ${opt.name}`,
                rightX + 22,
                ry + 8,
                220,
                {
                    size: 13,
                    weight: 700,
                    color: tone,
                },
            ),
            label(
                c,
                `opt-stat-${opt.id}`,
                `dot=${opt.dot.toFixed(1)} -> logit z=${z.toFixed(3)}`,
                rightX + 22,
                ry + 28,
                220,
                {
                    size: 11,
                    mono: true,
                    color: c.textSecondary,
                },
            ),
            label(
                c,
                `opt-t1-${opt.id}`,
                `T=1.0: ${(pT1 * 100).toFixed(1)}%`,
                rightX + 250,
                ry + 12,
                110,
                {
                    size: 12,
                    weight: 600,
                    align: 'right',
                    color: tone,
                },
            ),
            label(
                c,
                `opt-t2-${opt.id}`,
                `T=2.0: ${(pT2 * 100).toFixed(1)}%`,
                rightX + 250,
                ry + 32,
                110,
                {
                    size: 12,
                    align: 'right',
                    color: c.textSecondary,
                },
            ),
        )

        // Progress bar for T=1
        const barScale = 140
        geometry.push(
            createElement(
                'g',
                { id: `bar-t1-${opt.id}` },
                SvgFrame({
                    c,
                    x: rightX + 22,
                    y: ry + 52,
                    width: Math.max(pT1 * barScale, 2),
                    height: 12,
                    rx: 2,
                    fill: tone,
                    stroke: tone,
                    strokeWidth: 1,
                }),
            ),
        )
    })

    // Readout summary note
    labels.push(
        label(
            c,
            'readout-note',
            'Higher temperature softens confidence without changing option rank order',
            rightX + 16,
            topY + 372,
            cardW - 32,
            {
                size: 11,
                align: 'center',
                color: c.textSecondary,
            },
        ),
    )

    // Top Header
    labels.push(
        label(
            c,
            'header-main',
            'Pointer Readout Architecture: Geometric Projections and Temperature Scaling',
            24,
            20,
            812,
            {
                size: 18,
                weight: 700,
                color: c.textPrimary,
            },
        ),
    )

    return figure(c, width, height, geometry, labels)
}

export default create('dark')
