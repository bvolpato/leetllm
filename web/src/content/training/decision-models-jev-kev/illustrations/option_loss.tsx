import { createElement } from 'react'
import {
    SvgFrame,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    stableSoftmax,
    type ThemeMode,
    type ToneName,
} from 'vizmatic'
import { figure, label, math } from './decision_canvas'

export const width = 860
export const height = 520
export const preset = 'engineering'
export const alt =
    'Signed gradients and probability shifts for a three-choice decision update with target B. For initial logits [2.0, 1.0, 0.0], softmax yields probabilities [0.665, 0.245, 0.090]. Cross-entropy gradients evaluate to +0.665 for A, -0.755 for target B, and +0.090 for C. Applying gradient descent with step size 0.5 updates logits to [1.667, 1.378, -0.045], raising target B probability from 0.245 to 0.388 while reducing choice A from 0.665 to 0.518.'

const logits = [2.0, 1.0, 0.0]
const target = 1
const learningRate = 0.5
const before = stableSoftmax(logits)

export const records = [
    { id: 'A', name: 'Gradient overflow', tone: 'blue' as ToneName },
    { id: 'B', name: 'Memory allocation OOM [Target]', tone: 'green' as ToneName },
    { id: 'C', name: 'Insufficient telemetry', tone: 'warm' as ToneName },
].map((r, i) => ({
    ...r,
    logit: logits[i],
    before: before[i],
    gradient: before[i] - Number(i === target),
}))

export const updatedLogits = records.map((r) => r.logit - learningRate * r.gradient)
const after = stableSoftmax(updatedLogits)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const critical = getReadableToneColor('critical', c)

    const geometry = []
    const labels = []

    const line = (
        id: string,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color = c.border,
        width = 1.5,
    ) =>
        createElement(
            'g',
            { id },
            VectorSegment({
                x1,
                y1,
                x2,
                y2,
                color,
                strokeWidth: width,
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

    // Left Panel: Signed Gradients
    geometry.push(box('grad-box', leftX, topY, cardW, cardH, purple))
    labels.push(
        label(
            c,
            'title-grad',
            '1. Loss Gradients on Logits (dL/dz = p - y)',
            leftX + 16,
            topY + 16,
            cardW - 32,
            {
                size: 15,
                weight: 700,
                color: purple,
            },
        ),
        label(
            c,
            'sub-grad',
            'Target receives negative gradient (-0.755) to increase logit',
            leftX + 16,
            topY + 38,
            cardW - 32,
            {
                size: 13,
                color: c.textSecondary,
            },
        ),
    )

    // Zero center line for gradients: gradient scale [-1, 1] mapped to [leftX + 40, leftX + cardW - 40]
    const gZeroX = leftX + cardW / 2
    geometry.push(line('grad-zero-line', gZeroX, topY + 80, gZeroX, topY + 340, c.border, 2))
    labels.push(
        label(c, 'grad-zero-lbl', '0.0', gZeroX - 15, topY + 68, 30, {
            size: 11,
            align: 'center',
            color: c.textSecondary,
        }),
        label(c, 'grad-neg-lbl', '-1.0', leftX + 40, topY + 68, 40, {
            size: 11,
            align: 'left',
            color: c.textSecondary,
        }),
        label(c, 'grad-pos-lbl', '+1.0', leftX + cardW - 70, topY + 68, 40, {
            size: 11,
            align: 'right',
            color: c.textSecondary,
        }),
    )

    // Gradient bars
    const gScale = 140 // 1 unit = 140px
    records.forEach((r, i) => {
        const ry = topY + 115 + i * 80
        const barW = Math.abs(r.gradient) * gScale
        const barX = r.gradient >= 0 ? gZeroX : gZeroX - barW
        const tone = r.gradient < 0 ? green : blue

        geometry.push(
            createElement(
                'g',
                { id: `grad-bar-${r.id}` },
                SvgFrame({
                    c,
                    x: barX,
                    y: ry,
                    width: Math.max(barW, 2),
                    height: 36,
                    rx: 4,
                    fill: r.gradient < 0 ? green : blue,
                    stroke: tone,
                    strokeWidth: 1.5,
                }),
            ),
        )

        const signStr = r.gradient > 0 ? `+${r.gradient.toFixed(3)}` : r.gradient.toFixed(3)
        labels.push(
            label(c, `grad-opt-${r.id}`, `Choice ${r.id}`, leftX + 16, ry + 8, 80, {
                size: 13,
                weight: 700,
                color: c.textPrimary,
            }),
            label(
                c,
                `grad-val-${r.id}`,
                signStr,
                r.gradient >= 0 ? barX + barW + 8 : barX - 60,
                ry + 8,
                55,
                {
                    size: 13,
                    weight: 600,
                    align: r.gradient >= 0 ? 'left' : 'right',
                    color: tone,
                },
            ),
            label(c, `grad-detail-${r.id}`, `${r.name}`, leftX + 16, ry + 42, cardW - 32, {
                size: 11,
                color: c.textSecondary,
            }),
        )
    })

    // Gradient summary
    labels.push(
        label(
            c,
            'grad-formula',
            'Update rule: z_new = z - 0.5 * grad',
            leftX + 16,
            topY + 365,
            cardW - 32,
            {
                size: 12,
                align: 'center',
                mono: true,
                color: c.textSecondary,
            },
        ),
    )

    // Right Panel: Probability Distribution Shift
    geometry.push(box('prob-box', rightX, topY, cardW, cardH, green))
    labels.push(
        label(
            c,
            'title-prob',
            '2. Softmax Probability Shift (T = 1.0)',
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
            'sub-prob',
            'Target B rises from 24.5% to 38.8%; choice A drops from 66.5% to 51.8%',
            rightX + 16,
            topY + 38,
            cardW - 32,
            {
                size: 13,
                color: c.textSecondary,
            },
        ),
    )

    // Probability bars comparison
    const pScale = 220
    records.forEach((r, i) => {
        const ry = topY + 105 + i * 88
        const pBefore = r.before
        const pAfter = after[i]

        // Before bar (dimmer)
        geometry.push(
            createElement(
                'g',
                { id: `prob-before-${r.id}` },
                SvgFrame({
                    c,
                    x: rightX + 90,
                    y: ry,
                    width: Math.max(pBefore * pScale, 2),
                    height: 20,
                    rx: 3,
                    fill: c.bg,
                    stroke: c.textSecondary,
                    strokeWidth: 1,
                }),
            ),
            // After bar (filled)
            createElement(
                'g',
                { id: `prob-after-${r.id}` },
                SvgFrame({
                    c,
                    x: rightX + 90,
                    y: ry + 25,
                    width: Math.max(pAfter * pScale, 2),
                    height: 22,
                    rx: 3,
                    fill: i === target ? green : blue,
                    stroke: i === target ? green : blue,
                    strokeWidth: 1.5,
                }),
            ),
        )

        labels.push(
            label(c, `p-lbl-${r.id}`, `Choice ${r.id}`, rightX + 16, ry + 12, 70, {
                size: 13,
                weight: 700,
                color: c.textPrimary,
            }),
            label(
                c,
                `p-before-val-${r.id}`,
                `${(pBefore * 100).toFixed(1)}%`,
                rightX + 95 + pBefore * pScale,
                ry + 2,
                50,
                {
                    size: 11,
                    color: c.textSecondary,
                },
            ),
            label(
                c,
                `p-after-val-${r.id}`,
                `${(pAfter * 100).toFixed(1)}%`,
                rightX + 95 + pAfter * pScale,
                ry + 27,
                50,
                {
                    size: 12,
                    weight: 600,
                    color: i === target ? green : c.textPrimary,
                },
            ),
            label(c, `p-desc-${r.id}`, r.name, rightX + 16, ry + 54, cardW - 32, {
                size: 11,
                color: c.textSecondary,
            }),
        )
    })

    // Probability legend & loss
    const lossBefore = -Math.log(before[target])
    const lossAfter = -Math.log(after[target])
    labels.push(
        label(
            c,
            'p-legend',
            'Top bar: before update | Bottom bar: after single step',
            rightX + 16,
            topY + 360,
            cardW - 32,
            {
                size: 12,
                align: 'center',
                color: c.textSecondary,
            },
        ),
        label(
            c,
            'p-loss',
            `Cross-Entropy Loss: ${lossBefore.toFixed(3)} -> ${lossAfter.toFixed(3)} (-${(lossBefore - lossAfter).toFixed(3)})`,
            rightX + 16,
            topY + 382,
            cardW - 32,
            {
                size: 12,
                weight: 700,
                align: 'center',
                color: green,
            },
        ),
    )

    // Top Header
    labels.push(
        label(
            c,
            'header-main',
            'Single Gradient Step on Option Logits: Gradients and Softmax Shift',
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
