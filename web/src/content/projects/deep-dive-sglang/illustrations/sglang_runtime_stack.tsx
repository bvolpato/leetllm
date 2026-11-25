import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 395
export const alt =
    'Frontend or HTTP operations enter tokenization, then scheduler-owned prefix lookup and a repeating scheduler, model-runner, and sampling loop. Generated IDs also flow to detokenization and streaming. TTFT spans the initial path; ITL includes repeated scheduling and output work.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const muted = c.textSecondary

    const stage = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        tone: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, 0.11),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 8,
        })
        fig.text(x + w / 2, y + h * 0.36, title, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 12,
        })
        fig.text(x + w / 2, y + h * 0.7, sub, {
            size: 12,
            color: muted,
            align: 'center',
            width: w - 12,
        })
    }

    // --- Highlighted Per-Token Loop Region ---
    fig.rect(368, 22, 448, 250, {
        fill: tint(purple, c.bg, 0.04),
        stroke: tint(purple, c.bg, 0.45),
        strokeWidth: 1.25,
        radius: 12,
    })
    fig.text(592, 40, 'Repeating Per-Token Decode Loop', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
        width: 300,
    })

    // Once-per-request label on the left
    fig.text(182, 40, 'Runs Once Per Request', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'center',
        width: 240,
    })

    // Top row: Ingress -> Tokenize -> Radix Scheduler -> Model Runner
    const topY = 64
    const boxH = 74
    stage(24, topY, 134, boxH, '1. Ingress', 'HTTP / API', blue)
    stage(188, topY, 150, boxH, '2. Tokenize', 'Prompt -> IDs', cyan)
    stage(390, topY, 184, boxH, '3. Radix Scheduler', 'Prefix match + batch', purple)
    stage(608, topY, 186, boxH, '4. Model Runner', 'Forward + KV update', green)

    // Arrows along top path
    fig.arrow(158, topY + boxH / 2, 185, topY + boxH / 2, { color: cyan, width: 2, head: 5 })
    fig.arrow(338, topY + boxH / 2, 387, topY + boxH / 2, { color: purple, width: 2, head: 5 })
    fig.arrow(574, topY + boxH / 2, 605, topY + boxH / 2, { color: green, width: 2, head: 5 })

    // Bottom row: Detokenize & Stream <- Grammar Sampler (below Model Runner)
    const botY = 182
    stage(518, botY, 276, boxH, '5. Sampling & Constraints', 'Logits -> next token ID', warm)
    stage(144, botY, 194, boxH, '6. Detokenize & Stream', 'Incremental UTF-8 SSE', blue)

    // Client pill on far left
    fig.rect(24, botY + 14, 88, 46, {
        fill: tint(blue, c.bg, 0.08),
        stroke: c.border,
        strokeWidth: 1.25,
        radius: 23,
    })
    fig.text(68, botY + 37, 'Client', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        width: 76,
    })

    // Model Runner -> Sampler (vertical down)
    fig.arrow(701, topY + boxH, 701, botY - 3, { color: warm, width: 2, head: 6 })

    // Sampler -> Scheduler feedback loop (L-shaped curved path inside loop box)
    fig.path(`M518 ${botY + 22}L470 ${botY + 22}Q454 ${botY + 22},454 ${botY + 6}L454 ${topY + boxH + 8}`, {
        color: warm,
        width: 2.25,
    })
    fig.arrow(454, topY + boxH + 16, 454, topY + boxH + 2, { color: warm, width: 2.25, head: 6 })
    fig.text(444, 162, 'Next token', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'right',
    })

    // Sampler -> Detokenize -> Client
    fig.arrow(518, botY + 48, 341, botY + 48, { color: blue, width: 2, head: 6 })
    fig.text(430, botY + 62, 'token IDs', {
        size: 12,
        weight: 600,
        color: blue,
        align: 'center',
        width: 110,
    })
    fig.arrow(144, botY + 37, 115, botY + 37, { color: blue, width: 2, head: 5 })

    // --- Bottom Latency Span Bars (TTFT vs ITL) ---
    fig.line(24, 294, 816, 294, { color: c.borderSubtle, width: 1 })

    // TTFT bar
    const ttftY = 318
    fig.text(24, ttftY + 11, 'TTFT', { size: 14, weight: 700, color: cyan, mono: true })
    fig.rect(86, ttftY, 730, 22, {
        fill: tint(cyan, c.bg, 0.16),
        stroke: cyan,
        strokeWidth: 1.25,
        radius: 5,
    })
    fig.text(451, ttftY + 11, 'Ingress -> Tokenize -> Radix Match -> First Prefill -> Sample -> Stream', {
        size: 12,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
        width: 710,
    })

    // ITL bar
    const itlY = 352
    fig.text(24, itlY + 11, 'ITL', { size: 14, weight: 700, color: green, mono: true })
    fig.rect(368, itlY, 448, 22, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.25,
        radius: 5,
    })
    fig.text(592, itlY + 11, 'Schedule -> Model Runner -> Sample -> Stream (every token)', {
        size: 12,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
        width: 434,
    })

    return fig.render()
}

export default create()
