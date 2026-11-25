import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 370
export const alt =
    'Dataflow diagram of a Mamba selective SSM block: input x[t] of width D passes through a linear projection of width 2E and splits into two branches. The upper branch runs a causal 1D convolution (k=4) and SiLU, generates input-dependent Delta_t, B_t, and C_t parameters for the selective scan with D skip connection, and multiplies elementwise with the lower SiLU(z) gating branch before output projection back to y[t] of width D.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'
    const fillAmt = isLight ? 0.1 : 0.18

    const neutral = c.textSecondary
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string | null,
        color: string,
        isNeutral = false,
    ) => {
        fig.rect(x, y, w, h, {
            fill: isNeutral ? (isLight ? '#f4f2ec' : '#161922') : tint(color, c.bg, fillAmt),
            stroke: isNeutral ? c.border : color,
            strokeWidth: 1.4,
            radius: 9,
        })
        if (sub) {
            fig.text(x + w / 2, y + h * 0.36, title, {
                size: 14.5,
                weight: 700,
                color: isNeutral ? c.textPrimary : color,
                align: 'center',
            })
            fig.text(x + w / 2, y + h * 0.7, sub, {
                size: 13,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        } else {
            fig.text(x + w / 2, y + h / 2, title, {
                size: 14.5,
                weight: 700,
                color: isNeutral ? c.textPrimary : color,
                align: 'center',
            })
        }
    }

    // Coordinates
    const midY = 200
    const upperY = 166
    const selectY = 34
    const lowerY = 286

    // 1. Input x[t]
    box(18, midY - 30, 82, 60, 'x[t]', 'width D', neutral, true)

    // 2. Linear Projection (2E)
    box(130, midY - 30, 96, 60, 'Linear', 'proj 2E', blue)
    fig.arrow(100, midY, 128, midY, { color: blue, width: 1.8, head: 6 })

    // Split point after Linear
    const splitX = 248
    fig.line(226, midY, splitX, midY, { color: blue, width: 1.8 })

    // Upper branch: Conv1D + SiLU
    fig.path(`M${splitX} ${midY} L${splitX} ${upperY} L276 ${upperY}`, {
        color: blue,
        width: 1.8,
    })
    fig.arrow(266, upperY, 278, upperY, { color: blue, width: 1.8, head: 6 })
    box(280, upperY - 32, 114, 64, 'Conv1D', 'k=4 · SiLU', blue)

    // Branch up from Conv1D output into Select (Delta, B, C)
    const convOutX = 394
    const forkX = 418
    fig.line(convOutX, upperY, forkX, upperY, { color: green, width: 1.8 })

    // Up to Select box
    const selBoxX = 446
    const selBoxW = 132
    const selBoxH = 66
    fig.path(`M${forkX} ${upperY} L${forkX} ${selectY + selBoxH / 2} L${selBoxX - 4} ${selectY + selBoxH / 2}`, {
        color: warm,
        width: 1.8,
    })
    fig.arrow(selBoxX - 14, selectY + selBoxH / 2, selBoxX - 2, selectY + selBoxH / 2, {
        color: warm,
        width: 1.8,
        head: 6,
    })

    // Select box with real TeX Δ_t, B_t, C_t
    fig.rect(selBoxX, selectY, selBoxW, selBoxH, {
        fill: tint(warm, c.bg, fillAmt),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 9,
    })
    fig.text(selBoxX + selBoxW / 2, selectY + 21, 'Select params', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.math(selBoxX + selBoxW / 2, selectY + 46, '\\Delta_t,\\; B_t,\\; C_t', {
        size: 15,
        color: c.textPrimary,
        align: 'center',
    })

    // Selective Scan (SSM + D)
    const ssmX = 446
    const ssmW = 132
    const ssmH = 68
    fig.arrow(forkX, upperY, ssmX - 2, upperY, { color: green, width: 1.8, head: 6 })
    fig.arrow(selBoxX + selBoxW / 2, selectY + selBoxH, selBoxX + selBoxW / 2, upperY - ssmH / 2 - 2, {
        color: warm,
        width: 1.8,
        head: 6,
    })
    box(ssmX, upperY - ssmH / 2, ssmW, ssmH, 'Selective SSM', 'Scan + D·x', green)

    // Lower gating branch: SiLU(z)
    fig.path(`M${splitX} ${midY} L${splitX} ${lowerY} L336 ${lowerY}`, {
        color: purple,
        width: 1.8,
    })
    fig.arrow(326, lowerY, 338, lowerY, { color: purple, width: 1.8, head: 6 })
    fig.text(258, lowerY - 14, 'z (E)', {
        size: 12.5,
        color: purple,
        mono: true,
    })
    box(340, lowerY - 28, 120, 56, 'SiLU(z)', 'gating branch', purple)

    // Elementwise Multiply circle (⊙)
    const mulX = 626
    const mulY = 222
    const mulR = 22
    fig.circle(mulX, mulY, mulR, {
        fill: tint(green, c.bg, isLight ? 0.14 : 0.24),
        stroke: green,
        width: 1.6,
    })
    fig.math(mulX, mulY, '\\odot', { size: 22, color: green, align: 'center' })

    // Route SSM -> Mul (top)
    fig.path(`M${ssmX + ssmW} ${upperY} L${mulX} ${upperY} L${mulX} ${mulY - mulR - 2}`, {
        color: green,
        width: 1.8,
    })
    fig.arrow(mulX, mulY - mulR - 12, mulX, mulY - mulR - 1, {
        color: green,
        width: 1.8,
        head: 6,
    })

    // Route Gate -> Mul (bottom)
    fig.path(`M460 ${lowerY} L${mulX} ${lowerY} L${mulX} ${mulY + mulR + 2}`, {
        color: purple,
        width: 1.8,
    })
    fig.arrow(mulX, mulY + mulR + 12, mulX, mulY + mulR + 1, {
        color: purple,
        width: 1.8,
        head: 6,
    })

    // Mul -> Out Proj -> y[t]
    fig.arrow(mulX + mulR, mulY, 664, mulY, { color: green, width: 1.8, head: 6 })
    box(666, mulY - 32, 76, 64, 'Out', 'y[t] (D)', neutral, true)

    // Subtle branch role captions (compact, no prose wall)
    fig.text(280, 118, 'x branch (width E)', { size: 12.5, color: blue, mono: true })
    fig.text(626, mulY - mulR - 22, 'y ⊙ gate', { size: 12.5, color: c.textSecondary, align: 'center', mono: true })

    return fig.render()
}

export default create('dark')
