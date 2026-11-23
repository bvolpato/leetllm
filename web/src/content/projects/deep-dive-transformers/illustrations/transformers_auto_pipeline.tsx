import { createElement, type ReactElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const opaqueBackground = true
export const alt =
    'AutoClass architecture resolution pipeline: config.json model_type enters lazy class mapping before tensor weights are loaded. Model type llama resolves to LlamaForCausalLM. Class selection depends on configuration metadata, while tensor shard compatibility is validated during subsequent weight loading.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

function renderBoard(c: Colors, items: (ReactElement | ReactElement[])[]) {
    const flat = items.flat() as ReactElement[]
    const svg = flat.filter((el) => el?.type !== 'div')
    const html = flat.filter((el) => el?.type === 'div')
    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    { width, height, viewBox: `0 0 ${width} ${height}` },
                    ...svg,
                ),
            }),
            ...html,
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const leftX = 35
    const cardW = 236
    const midX = 312
    const rightX = 589
    const cardY = 75
    const cardH = 345

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            'AutoClass Architecture Resolution Pipeline',
            35,
            18,
            790,
            26,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Configuration metadata determines Python model class before tensor weights are evaluated',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Card 1: Configuration Inspection
        SvgFrame({
            c,
            x: leftX,
            y: cardY,
            width: cardW,
            height: cardH,
            rx: 8,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(57, 197, 207, 0.08)' : 'rgba(26, 127, 139, 0.05)',
        }),
        label(c, '1. Config Inspection', leftX + 16, cardY + 16, cardW - 32, 22, 16, cyan, 700),
        label(
            c,
            'config.json',
            leftX + 16,
            cardY + 40,
            cardW - 32,
            18,
            12,
            muted,
            500,
            'left',
            true,
        ),

        SvgFrame({
            c,
            x: leftX + 16,
            y: cardY + 75,
            width: cardW - 32,
            height: 140,
            rx: 6,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(
            c,
            'model_type: "llama"',
            leftX + 26,
            cardY + 88,
            cardW - 52,
            18,
            12,
            cyan,
            700,
            'left',
            true,
        ),
        label(
            c,
            'architectures: [',
            leftX + 26,
            cardY + 110,
            cardW - 52,
            18,
            11,
            muted,
            500,
            'left',
            true,
        ),
        label(
            c,
            '  "LlamaForCausalLM"',
            leftX + 26,
            cardY + 128,
            cardW - 52,
            18,
            11,
            green,
            600,
            'left',
            true,
        ),
        label(c, ']', leftX + 26, cardY + 146, cardW - 52, 18, 11, muted, 500, 'left', true),
        label(
            c,
            'hidden_size: 2048',
            leftX + 26,
            cardY + 168,
            cardW - 52,
            18,
            11,
            muted,
            500,
            'left',
            true,
        ),
        label(
            c,
            'num_heads: 16',
            leftX + 26,
            cardY + 186,
            cardW - 52,
            18,
            11,
            muted,
            500,
            'left',
            true,
        ),

        label(
            c,
            'Reads JSON metadata only',
            leftX + 16,
            cardY + 235,
            cardW - 32,
            18,
            12,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'No model weights or SafeTensors files are opened in this step',
            leftX + 16,
            cardY + 260,
            cardW - 32,
            36,
            11,
            muted,
        ),

        // Arrow 1 -> 2
        VectorArrow({
            x1: leftX + cardW,
            y1: 247,
            x2: midX,
            y2: 247,
            color: getReadableToneColor('cyan', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Card 2: Lazy Architecture Registry
        SvgFrame({
            c,
            x: midX,
            y: cardY,
            width: cardW,
            height: cardH,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(187, 128, 255, 0.08)' : 'rgba(130, 80, 223, 0.05)',
        }),
        label(c, '2. Registry Resolution', midX + 16, cardY + 16, cardW - 32, 22, 16, purple, 700),
        label(
            c,
            'AutoModelForCausalLM',
            midX + 16,
            cardY + 40,
            cardW - 32,
            18,
            12,
            muted,
            500,
            'left',
            true,
        ),

        SvgFrame({
            c,
            x: midX + 16,
            y: cardY + 75,
            width: cardW - 32,
            height: 140,
            rx: 6,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        // Matched entry
        SvgFrame({
            c,
            x: midX + 22,
            y: cardY + 85,
            width: cardW - 44,
            height: 38,
            rx: 4,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(26, 127, 55, 0.1)',
        }),
        label(
            c,
            'llama → LlamaForCausalLM',
            midX + 28,
            cardY + 96,
            cardW - 56,
            18,
            11,
            green,
            700,
            'left',
            true,
        ),

        label(
            c,
            'gpt2 → GPT2LMHeadModel',
            midX + 28,
            cardY + 135,
            cardW - 56,
            18,
            11,
            muted,
            500,
            'left',
            true,
        ),
        label(
            c,
            'mistral → MistralForCausalLM',
            midX + 28,
            cardY + 165,
            cardW - 56,
            18,
            11,
            muted,
            500,
            'left',
            true,
        ),

        label(
            c,
            'Dynamic Class Import',
            midX + 16,
            cardY + 235,
            cardW - 32,
            18,
            12,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Target module is lazily imported without loading unused model architectures',
            midX + 16,
            cardY + 260,
            cardW - 32,
            36,
            11,
            muted,
        ),

        // Arrow 2 -> 3
        VectorArrow({
            x1: midX + cardW,
            y1: 247,
            x2: rightX,
            y2: 247,
            color: getReadableToneColor('purple', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Card 3: Instantiation & Weight Loading
        SvgFrame({
            c,
            x: rightX,
            y: cardY,
            width: cardW,
            height: cardH,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.05)',
        }),
        label(c, '3. Module & Shards', rightX + 16, cardY + 16, cardW - 32, 22, 16, green, 700),
        label(
            c,
            'from_pretrained()',
            rightX + 16,
            cardY + 40,
            cardW - 32,
            18,
            12,
            muted,
            500,
            'left',
            true,
        ),

        SvgFrame({
            c,
            x: rightX + 16,
            y: cardY + 75,
            width: cardW - 32,
            height: 140,
            rx: 6,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(c, 'A. Allocate Skeleton', rightX + 26, cardY + 88, cardW - 52, 18, 12, green, 700),
        label(
            c,
            'model = LlamaForCausalLM(config)',
            rightX + 26,
            cardY + 110,
            cardW - 52,
            18,
            10,
            muted,
            500,
            'left',
            true,
        ),
        label(
            c,
            'B. Map Safetensors Shards',
            rightX + 26,
            cardY + 138,
            cardW - 52,
            18,
            12,
            warm,
            700,
        ),
        label(
            c,
            'load_checkpoint_and_dispatch()',
            rightX + 26,
            cardY + 160,
            cardW - 52,
            18,
            10,
            muted,
            500,
            'left',
            true,
        ),

        label(
            c,
            'Tensor Verification',
            rightX + 16,
            cardY + 235,
            cardW - 32,
            18,
            12,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Weight and shape mismatches surface during tensor loading, not class resolution',
            rightX + 16,
            cardY + 260,
            cardW - 32,
            36,
            11,
            muted,
        ),

        // Bottom summary frame
        SvgFrame({
            c,
            x: leftX,
            y: 435,
            width: 790,
            height: 42,
            rx: 6,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(c, 'Input: model_type ("llama")', leftX + 20, 447, 240, 20, 12, cyan, 600),
        label(
            c,
            'Resolution: LlamaForCausalLM',
            leftX + 270,
            447,
            260,
            20,
            12,
            purple,
            600,
            'center',
        ),
        label(
            c,
            'Execution: PyTorch Module + Sharded Weights',
            leftX + 530,
            447,
            240,
            20,
            12,
            green,
            600,
            'right',
        ),
    ])
}

export default create()
