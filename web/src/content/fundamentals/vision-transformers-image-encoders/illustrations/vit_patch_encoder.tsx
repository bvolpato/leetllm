import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/vit-patch-film'

export const width = 760
export const height = 365
export const alt =
    'A 4 by 4 street-scene RGB crop splits into four exploded 2 by 2 patches (P1 sky, P2 crimson speed sign, P3 foliage, P4 road). Each patch flattens into a row vector and projects linearly into token matrix Z_0 (4x3, with P2 highlighted at [0.60, 0.80, -0.40]), paired with a learnable [CLS] token prepended before the Transformer encoder.'

const SKY = '#58a6e8'
const CLOUD = '#c4e0f8'
const SIGN_RED = '#dc3838'
const SIGN_TXT = '#f5f5f5'
const LEAF = '#40985c'
const ROAD = '#3a424e'
const STRIPE = '#e8c448'

const rgbGrid: readonly (readonly string[])[] = [
    [SKY, CLOUD, SIGN_RED, SIGN_TXT],
    [SKY, SKY, SIGN_TXT, SIGN_RED],
    [LEAF, LEAF, ROAD, STRIPE],
    [ROAD, ROAD, ROAD, ROAD],
]

export const pixels: number[][] = [
    [0.64, 0.85, 0.48, 0.96],
    [0.62, 0.64, 0.96, 0.48],
    [0.44, 0.46, 0.25, 0.8],
    [0.24, 0.25, 0.24, 0.25],
]

export const patches: number[][] = [
    [pixels[0]![0]!, pixels[0]![1]!, pixels[1]![0]!, pixels[1]![1]!],
    [pixels[0]![2]!, pixels[0]![3]!, pixels[1]![2]!, pixels[1]![3]!],
    [pixels[2]![0]!, pixels[2]![1]!, pixels[3]![0]!, pixels[3]![1]!],
    [pixels[2]![2]!, pixels[2]![3]!, pixels[3]![2]!, pixels[3]![3]!],
]

const projectedTokens: number[][] = [
    [0.5, -0.2, 0.4],
    [0.6, 0.8, -0.4],
    [0.3, 0.5, 0.8],
    [0.7, -0.4, 0.2],
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const red = fig.tone('red')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')

    // =========================================================================
    // Stage 1: 4x4 RGB crop
    // =========================================================================
    const s1X = 24
    const s1Y = 82
    const p1Cell = 36
    const s1Size = p1Cell * 4

    fig.text(s1X + s1Size / 2, 22, '1. RGB crop (4×4)', {
        size: 14.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(s1X + s1Size / 2, 43, 'Street-scene pixels', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 4; col++) {
            fig.rect(s1X + col * p1Cell, s1Y + r * p1Cell, p1Cell - 1.5, p1Cell - 1.5, {
                fill: rgbGrid[r]![col]!,
                stroke: c.bg,
                strokeWidth: 1,
                radius: 3,
            })
        }
    }

    fig.rect(s1X + 20, s1Y + s1Size + 24, s1Size - 40, 28, {
        fill: tint(blue, c.bg, isLight ? 0.1 : 0.18),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 14,
    })
    fig.text(s1X + s1Size / 2, s1Y + s1Size + 38, 'H × W × 3', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    // Arrow Stage 1 -> Stage 2
    fig.arrow(s1X + s1Size + 10, s1Y + s1Size / 2, s1X + s1Size + 44, s1Y + s1Size / 2, {
        color: cyan,
        width: 2,
        head: 7,
    })

    // =========================================================================
    // Stage 2: Four cleanly EXPLODED 2x2 patches
    // =========================================================================
    const s2X = 224
    const s2Y = 74
    const p2Cell = 30
    const p2Gap = 3
    const qSize = p2Cell * 2 + p2Gap
    const explodeGap = 18

    const quadSpecs = [
        { qr: 0, qc: 0, label: 'P1', col: blue },
        { qr: 0, qc: 1, label: 'P2', col: red },
        { qr: 1, qc: 0, label: 'P3', col: green },
        { qr: 1, qc: 1, label: 'P4', col: warm },
    ] as const

    const s2Total = qSize * 2 + explodeGap
    fig.text(s2X + s2Total / 2, 22, '2. Exploded 2×2 patches', {
        size: 14.5,
        weight: 700,
        color: cyan,
        align: 'center',
    })
    fig.text(s2X + s2Total / 2, 43, '4 × (2×2×3) flattened', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    for (const q of quadSpecs) {
        const qx = s2X + q.qc * (qSize + explodeGap)
        const qy = s2Y + q.qr * (qSize + explodeGap)
        // Outer colored patch border
        fig.rect(qx - 4, qy - 4, qSize + 8, qSize + 8, {
            fill: tint(q.col, c.bg, isLight ? 0.08 : 0.18),
            stroke: q.col,
            strokeWidth: 1.8,
            radius: 6,
        })
        for (let r = 0; r < 2; r++) {
            for (let col = 0; col < 2; col++) {
                const hex = rgbGrid[q.qr * 2 + r]![q.qc * 2 + col]!
                fig.rect(qx + col * (p2Cell + p2Gap), qy + r * (p2Cell + p2Gap), p2Cell, p2Cell, {
                    fill: hex,
                    stroke: c.bg,
                    strokeWidth: 1,
                    radius: 3,
                })
            }
        }
        // Patch tag corner pill above/below
        const tagY = q.qr === 0 ? qy - 14 : qy + qSize + 16
        fig.text(qx + qSize / 2, tagY, q.label, {
            size: 12,
            weight: 700,
            color: q.col,
            align: 'center',
            mono: true,
        })
    }

    fig.text(s2X + s2Total / 2, s1Y + s1Size + 38, '4 non-overlapping tiles', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Arrow Stage 2 -> Stage 3
    const a2Start = s2X + s2Total + 12
    const a2End = 456
    fig.arrow(a2Start, s1Y + s1Size / 2, a2End, s1Y + s1Size / 2, {
        color: purple,
        width: 2,
        head: 7,
    })
    fig.text((a2Start + a2End) / 2, s1Y + s1Size / 2 - 16, 'W_E', {
        size: 12,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })

    // =========================================================================
    // Stage 3: Generously padded 4x3 Token Matrix Z_0 + [CLS] row
    // =========================================================================
    const matX = 506
    const matW = 228
    const matY = 112
    const matH = 166

    fig.text(matX + matW / 2, 22, '3. Token matrix Z₀', {
        size: 14.5,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(matX + matW / 2, 43, 'Linear projection + [CLS]', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // [CLS] token bar cleanly prepended above Z_0
    fig.rect(matX, 62, matW, 28, {
        fill: tint(purple, c.bg, isLight ? 0.16 : 0.28),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(matX - 10, 76, '[CLS]', {
        size: 12,
        weight: 700,
        color: purple,
        align: 'right',
        mono: true,
    })
    fig.text(matX + matW / 2, 76, 'learnable class token', {
        size: 12,
        weight: 600,
        color: purple,
        align: 'center',
    })

    // Generous 4x3 matrix: each cell is 73x38 px -> "-0.40" has huge padding!
    fig.heatGrid(
        projectedTokens,
        { x: matX, y: matY, width: matW, height: matH },
        {
            scale: 'diverging',
            domain: [-0.8, 0.8],
            center: 0,
            rowLabels: ['P1', 'P2', 'P3', 'P4'],
            colLabels: ['d0', 'd1', 'd2'],
            labelSize: 12.5,
            valueSize: 13.5,
            showValues: true,
            gap: 5,
            radius: 5,
            highlightRow: 1,
            highlightColor: red,
            rowLabelGap: 10,
            colLabelGap: 11,
        },
    )

    fig.text(matX + matW / 2, matY + matH + 24, 'P2 = speed-sign token (highlighted)', {
        size: 12,
        weight: 600,
        color: red,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
