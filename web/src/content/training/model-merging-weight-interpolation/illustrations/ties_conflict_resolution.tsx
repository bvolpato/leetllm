import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 735
export const alt =
    'For three authored task vectors, density 0.5 keeps the two largest entries in each row. At p2 the surviving values −0.50, +1.10, and −0.40 sum to +0.20, so sign election keeps only +1.10. At p4 the values +0.80, −0.60, and +0.70 sum to +0.90, so the aligned mean is +0.75. The other two parameter coordinates trim to zero.'
export const numericFixture = {
    density: 0.5,
    rows: {
        code: [0.1, -0.5, 0.02, 0.8],
        math: [-0.1, 1.1, 0.01, -0.6],
        chat: [0.04, -0.4, 0.03, 0.7],
    },
    trimmed: {
        code: [0, -0.5, 0, 0.8],
        math: [0, 1.1, 0, -0.6],
        chat: [0, -0.4, 0, 0.7],
    },
    p2SignedMass: 0.2,
    p2Merged: 1.1,
    p4SignedMass: 0.9,
    p4Merged: 0.75,
}

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
    const code = getReadableToneColor('cyan', c)
    const math = getReadableToneColor('purple', c)
    const chat = getReadableToneColor('green', c)
    const pos = getReadableToneColor('warm', c)
    const neg = getReadableToneColor('blue', c)
    const xLeft = 190
    const xRight = 520
    const min = -0.65
    const max = 1.2
    const map = (v: number) => xLeft + ((v - min) / (max - min)) * (xRight - xLeft)
    const axisY = (sectionY: number) => sectionY + 150
    const names = ['Code', 'Math', 'Chat']
    const colors = [code, math, chat]
    const coordinateShapes = (sectionY: number, id: 'p2' | 'p4', values: number[]) => {
        const rowY = [sectionY + 55, sectionY + 92, sectionY + 129]
        return [
            SvgFrame({
                c,
                x: 18,
                y: sectionY,
                width: 524,
                height: 244,
                rx: 12,
                fill: c.bgSubtle,
                stroke: c.border,
                strokeWidth: 1.4,
            }),
            VectorSegment({
                x1: xLeft,
                y1: axisY(sectionY),
                x2: xRight,
                y2: axisY(sectionY),
                color: c.textSecondary,
                strokeWidth: 1.5,
                showStartDot: false,
                showEndDot: false,
            }),
            ...[-0.5, 0, 0.5, 1].map((v) =>
                VectorSegment({
                    x1: map(v),
                    y1: axisY(sectionY) - 7,
                    x2: map(v),
                    y2: axisY(sectionY) + 7,
                    color: c.textSecondary,
                    strokeWidth: 1.5,
                    showStartDot: false,
                    showEndDot: false,
                }),
            ),
            ...values.map((v, i) =>
                VectorSegment({
                    key: id + '-bar-' + i,
                    x1: map(0),
                    y1: rowY[i],
                    x2: map(v),
                    y2: rowY[i],
                    color: v >= 0 ? pos : neg,
                    strokeWidth: 5,
                    showStartDot: false,
                    showEndDot: false,
                }),
            ),
            ...values.map((v, i) =>
                SvgPoint({
                    key: id + '-point-' + i,
                    cx: map(v),
                    cy: rowY[i],
                    r: 6.5,
                    fill: colors[i],
                    stroke: c.bgCard,
                    strokeWidth: 2,
                }),
            ),
        ]
    }
    const coordinateLabels = (
        sectionY: number,
        id: 'p2' | 'p4',
        values: number[],
        mass: number,
        mode: 'direction' | 'average',
    ) => {
        const rowY = [sectionY + 55, sectionY + 92, sectionY + 129]
        return [
            label(c, `${id} · surviving signed updates`, 30, sectionY + 13, 500, 28, 21),
            ...values.map((v, i) =>
                label(
                    c,
                    `${names[i]}  ${v > 0 ? '+' : ''}${v.toFixed(2)}`,
                    30,
                    rowY[i] - 14,
                    145,
                    29,
                    20,
                    colors[i],
                ),
            ),
            ...[-0.5, 0, 0.5, 1].map((v) =>
                label(
                    c,
                    v === 0 ? '0' : (v > 0 ? '+' : '') + v.toFixed(1),
                    map(v) - 30,
                    axisY(sectionY) + 9,
                    60,
                    25,
                    20,
                    c.textSecondary,
                    'center',
                ),
            ),
            label(
                c,
                `Σ +${mass.toFixed(2)}  →  sign +  →  ${mode === 'direction' ? 'keep +1.10' : 'mean +0.75'}`,
                24,
                sectionY + 191,
                512,
                29,
                20,
                getReadableToneColor('green', c),
                'center',
            ),
        ]
    }
    const art = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...coordinateShapes(114, 'p2', [-0.5, 1.1, -0.4]),
        ...coordinateShapes(376, 'p4', [0.8, -0.6, 0.7]),
    )
    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({ x: 0, y: 0, width, height, children: art }),
                label(
                    c,
                    'TIES trims, elects a sign, then averages',
                    18,
                    10,
                    524,
                    34,
                    24,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Top two magnitudes per task vector · density = 0.5',
                    18,
                    49,
                    524,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
                ...coordinateLabels(
                    114,
                    'p2',
                    [-0.5, 1.1, -0.4],
                    numericFixture.p2SignedMass,
                    'direction',
                ),
                ...coordinateLabels(
                    376,
                    'p4',
                    [0.8, -0.6, 0.7],
                    numericFixture.p4SignedMass,
                    'average',
                ),
                label(
                    c,
                    'p1, p3 → 0 · p2, p4 survive each task vector',
                    22,
                    648,
                    516,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(
                    c,
                    'Evaluate the merged model on held-out tasks.',
                    22,
                    684,
                    516,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
