import type { ThemeMode, ToneName } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'Nested pixel regions show one activation’s receptive field growing from 1 by 1 at the input to 3 by 3, 5 by 5, 6 by 6 after pooling, and 10 by 10 after the next convolution. Below, proportional isometric tensor blocks show spatial resolution shrinking from 224 by 224 down to 108 by 108 while channel depth expands from 3 to 64.'

export const width = 800
export const height = 516

const stages = [
    { operation: 'input', channels: 3, side: 224, field: 1, jump: 1, tone: 'green' as ToneName },
    { operation: 'conv 3×3', channels: 16, side: 222, field: 3, jump: 1, tone: 'cyan' as ToneName },
    { operation: 'conv 3×3', channels: 32, side: 220, field: 5, jump: 1, tone: 'purple' as ToneName },
    { operation: 'pool 2×2', channels: 32, side: 110, field: 6, jump: 2, tone: 'warm' as ToneName },
    { operation: 'conv 3×3', channels: 64, side: 108, field: 10, jump: 2, tone: 'blue' as ToneName },
]

let checkedSide = stages[0]!.side
let checkedField = stages[0]!.field
let checkedJump = stages[0]!.jump
for (const stage of stages.slice(1)) {
    const kernel = stage.operation.startsWith('pool') ? 2 : 3
    const stride = stage.operation.startsWith('pool') ? 2 : 1
    checkedSide = Math.floor((checkedSide - kernel) / stride) + 1
    checkedField += (kernel - 1) * checkedJump
    checkedJump *= stride
    if (checkedSide !== stage.side || checkedField !== stage.field || checkedJump !== stage.jump) {
        throw new Error('CNN receptive-field progression diverges from layer sequence.')
    }
}

function regionIndex(row: number, col: number): number {
    if (row === 0 && col === 0) return 0 // 1x1
    if (row < 3 && col < 3) return 1 // 3x3
    if (row < 5 && col < 5) return 2 // 5x5
    if (row < 6 && col < 6) return 3 // 6x6
    return 4 // 10x10
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const ringColors = [
        fig.tone('green'),
        fig.tone('cyan'),
        fig.tone('purple'),
        isLight ? '#d97706' : '#f2b84b',
        fig.tone('blue'),
    ] as const
    const ringText = [
        fig.tone('green'),
        fig.tone('cyan'),
        fig.tone('purple'),
        isLight ? '#9a5204' : '#f2b84b',
        fig.tone('blue'),
    ] as const
    const ringFills = ringColors.map((col, idx) =>
        tint(col, c.bg, isLight ? (idx === 0 ? 0.65 : 0.34) : idx === 0 ? 0.85 : 0.45),
    )

    // ── Top Section: Nested 10x10 Receptive Field Rings ─────────────────────
    fig.text(24, 24, '1. Receptive field widens across layers', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })

    const gx0 = 28
    const gy0 = 54
    const cell = 16
    const gap = 2
    const step = cell + gap

    for (let r = 0; r < 10; r++) {
        for (let col = 0; col < 10; col++) {
            const idx = regionIndex(r, col)
            fig.rect(gx0 + col * step, gy0 + r * step, cell, cell, {
                fill: ringFills[idx],
                stroke: ringColors[idx],
                strokeWidth: 0.9,
                radius: 2,
            })
        }
    }

    // Crisp nested boundary outlines for 1x1, 3x3, 5x5, 6x6, 10x10
    for (let i = stages.length - 1; i >= 0; i--) {
        const f = stages[i]!.field
        const span = f * step - gap + 2
        fig.rect(gx0 - 1, gy0 - 1, span, span, {
            stroke: ringColors[i],
            strokeWidth: i === 0 ? 2 : 1.7,
            radius: 3,
        })
    }

    // Right-side progression table
    const tx = 242
    fig.text(tx + 28, 66, 'Stage', { size: 17, color: c.textSecondary, weight: 650 })
    fig.text(tx + 178, 66, 'RF size', { size: 17, color: c.textSecondary, weight: 650 })
    fig.text(tx + 288, 66, 'Jump j', { size: 17, color: c.textSecondary, weight: 650 })
    fig.text(tx + 402, 66, 'Tensor shape', { size: 17, color: c.textSecondary, weight: 650 })
    fig.line(tx, 82, 776, 82, { color: c.border, width: 1.25 })

    stages.forEach((st, i) => {
        const ry = 104 + i * 31
        fig.rect(tx, ry - 9, 18, 18, {
            fill: ringFills[i],
            stroke: ringColors[i],
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(tx + 28, ry, st.operation, {
            size: 18,
            weight: 650,
            color: ringText[i],
        })
        fig.text(tx + 178, ry, `${st.field}×${st.field}`, {
            size: 18,
            mono: true,
            weight: 700,
            color: c.textPrimary,
        })
        fig.text(tx + 288, ry, `j = ${st.jump}`, {
            size: 18,
            mono: true,
            color: st.jump > 1 ? ringText[i] : c.textSecondary,
            weight: st.jump > 1 ? 700 : 500,
        })
        fig.text(tx + 402, ry, `${st.side}² × ${st.channels}`, {
            size: 18,
            mono: true,
            color: c.textPrimary,
            weight: 600,
        })
    })

    // Divider
    fig.line(24, 256, width - 24, 256, { color: c.borderSubtle, width: 1.25 })

    // ── Bottom Section: Proportional 3D Isometric Tensor Volume Blocks ──────
    fig.text(24, 282, '2. Spatial maps shrink while channels expand', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })

    const drawIsoBlock = (
        xLeft: number,
        yBottom: number,
        faceSize: number,
        depth: number,
        color: string,
    ) => {
        const dx = Math.round(faceSize * 0.34)
        const dy = Math.round(faceSize * 0.24)
        const frontFill = tint(color, c.bg, isLight ? 0.22 : 0.32)
        const topFill = tint(color, c.bg, isLight ? 0.36 : 0.48)
        const sideFill = tint(color, c.bg, isLight ? 0.5 : 0.62)

        const x0 = xLeft
        const y0 = yBottom - faceSize

        // Front face (depth wide x faceSize tall)
        fig.rect(x0, y0, depth, faceSize, {
            fill: frontFill,
            stroke: color,
            strokeWidth: 1.6,
        })
        // Top parallelogram
        fig.path(
            `M${x0} ${y0} L${x0 + dx} ${y0 - dy} L${x0 + dx + depth} ${y0 - dy} L${x0 + depth} ${y0} Z`,
            { fill: topFill, color, width: 1.5 },
        )
        // Right side parallelogram (spatial HxW face)
        fig.path(
            `M${x0 + depth} ${y0} L${x0 + depth + dx} ${y0 - dy} L${x0 + depth + dx} ${yBottom - dy} L${x0 + depth} ${yBottom} Z`,
            { fill: sideFill, color, width: 1.5 },
        )
        return { rightEdge: x0 + depth + dx, centerX: x0 + (depth + dx) / 2, topY: y0 - dy }
    }

    const volumes = [
        { face: 86, depth: 8, x: 46 },
        { face: 84, depth: 18, x: 180 },
        { face: 82, depth: 30, x: 326 },
        { face: 46, depth: 32, x: 500 },
        { face: 44, depth: 56, x: 644 },
    ] as const

    const yBase = 442
    const boxes = volumes.map((v, i) =>
        drawIsoBlock(v.x, yBase, v.face, v.depth, ringColors[i]!),
    )

    // Stage labels above and tensor shapes below
    stages.forEach((st, i) => {
        const b = boxes[i]!
        fig.text(b.centerX, 318, st.operation, {
            size: 17,
            color: ringText[i],
            align: 'center',
            weight: 700,
        })
        fig.text(b.centerX, yBase + 22, `${st.side}²`, {
            size: 17,
            mono: true,
            color: c.textSecondary,
            align: 'center',
            weight: 600,
        })
        fig.text(b.centerX, yBase + 46, `C = ${st.channels}`, {
            size: 18,
            mono: true,
            color: ringText[i],
            align: 'center',
            weight: 750,
        })
        if (i < stages.length - 1) {
            const nextX = volumes[i + 1]!.x
            const arrowY = yBase - 34
            fig.arrow(b.rightEdge + 8, arrowY, nextX - 8, arrowY, {
                color: c.textMuted,
                width: 2,
                head: 6,
            })
        }
    })

    return fig.render()
}

export default create('dark')
