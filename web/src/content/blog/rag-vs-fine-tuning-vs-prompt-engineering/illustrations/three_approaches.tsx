import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 370
export const alt =
    'Two semantic bands converge onto the Generator. The top Per-request Input Context band combines Prompt Rules (schema and examples) and Indexed Docs (scoped v2.5 chunks) into Input Context at inference time. The bottom Offline SFT/LoRA Weights band trains a LoRA Adapter from an SFT Dataset to modify Generator weights and produce a Grounded Answer.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const warm = f.tone('warm')
    const green = f.tone('green')

    const drawNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        detail: string,
        tone: string,
    ) => {
        f.rect(x, y, w, h, {
            fill: tint(tone, c.bg, 0.13),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 9,
        })
        f.text(x + w / 2, y + h * 0.36, title, {
            size: 15,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 14,
        })
        f.text(x + w / 2, y + h * 0.7, detail, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            width: w - 14,
        })
    }

    // Band 1 (Top): Per-request Input Context
    f.rect(14, 16, 526, 206, {
        fill: tint(blue, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 12,
    })
    f.text(28, 36, 'Per-request Input Context · updated at query time', {
        size: 14,
        weight: 700,
        color: blue,
    })

    const nPrompt = { x: 30, y: 56, w: 184, h: 66 }
    const nRag = { x: 30, y: 140, w: 184, h: 66 }
    const nCtx = { x: 316, y: 96, w: 204, h: 76 }

    // Band 2 (Bottom): Offline SFT / LoRA Weights
    f.rect(14, 240, 526, 114, {
        fill: tint(warm, c.bg, 0.06),
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 12,
    })
    f.text(28, 260, 'Offline SFT / LoRA Weights · updated in training', {
        size: 14,
        weight: 700,
        color: warm,
    })

    const nSft = { x: 30, y: 278, w: 184, h: 62 }
    const nLora = { x: 316, y: 278, w: 204, h: 62 }

    // Right: Generator + Grounded Answer
    const nGen = { x: 604, y: 118, w: 180, h: 150 }

    // Edges inside Band 1
    f.path(`M${nPrompt.x + nPrompt.w} ${nPrompt.y + 33} H264 V120 H${nCtx.x - 8}`, {
        color: blue,
        width: 1.7,
    })
    f.arrow(nCtx.x - 16, 120, nCtx.x - 2, 120, { color: blue, width: 1.7, head: 6 })

    f.path(`M${nRag.x + nRag.w} ${nRag.y + 33} H264 V148 H${nCtx.x - 8}`, {
        color: purple,
        width: 1.7,
    })
    f.arrow(nCtx.x - 16, 148, nCtx.x - 2, 148, { color: purple, width: 1.7, head: 6 })

    // Edge inside Band 2
    f.arrow(nSft.x + nSft.w, 309, nLora.x - 2, 309, { color: warm, width: 1.75, head: 6 })
    f.text((nSft.x + nSft.w + nLora.x) / 2, 294, 'trains', {
        size: 12.5,
        weight: 600,
        color: warm,
        align: 'center',
    })

    // Convergence edges into Generator
    f.path(`M${nCtx.x + nCtx.w} 134 H568 V164 H${nGen.x - 8}`, {
        color: blue,
        width: 1.85,
    })
    f.arrow(nGen.x - 16, 164, nGen.x - 2, 164, { color: blue, width: 1.85, head: 6 })
    f.text(572, 118, 'context', { size: 12.5, weight: 600, color: blue, align: 'center' })

    f.path(`M${nLora.x + nLora.w} 309 H568 V224 H${nGen.x - 8}`, {
        color: warm,
        width: 1.85,
    })
    f.arrow(nGen.x - 16, 224, nGen.x - 2, 224, { color: warm, width: 1.85, head: 6 })
    f.text(572, 326, 'weights', { size: 12.5, weight: 600, color: warm, align: 'center' })

    // Draw nodes
    drawNode(nPrompt.x, nPrompt.y, nPrompt.w, nPrompt.h, 'Prompt Rules', 'schema + examples', blue)
    drawNode(nRag.x, nRag.y, nRag.w, nRag.h, 'Indexed Docs', 'scoped v2.5 chunks', purple)
    drawNode(nCtx.x, nCtx.y, nCtx.w, nCtx.h, 'Input Context', 'question + evidence', c.textPrimary)
    drawNode(nSft.x, nSft.y, nSft.w, nSft.h, 'SFT Dataset', 'labeled traces', warm)
    drawNode(nLora.x, nLora.y, nLora.w, nLora.h, 'LoRA Adapter', 'parameter delta', warm)

    // Generator box with embedded Grounded Answer output pill
    f.rect(nGen.x, nGen.y, nGen.w, nGen.h, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 2,
        radius: 12,
    })
    f.text(nGen.x + nGen.w / 2, nGen.y + 34, 'Generator', {
        size: 17,
        weight: 700,
        color: green,
        align: 'center',
    })
    f.text(nGen.x + nGen.w / 2, nGen.y + 62, 'base + LoRA weights', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })
    f.rect(nGen.x + 16, nGen.y + 94, nGen.w - 32, 36, {
        fill: tint(green, c.bg, 0.24),
        stroke: green,
        strokeWidth: 1.4,
        radius: 8,
    })
    f.text(nGen.x + nGen.w / 2, nGen.y + 112, 'Grounded Answer', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    return f.render()
}

export default create('dark')
