import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 520
export const alt =
    'A three-stage FSDP2 lifecycle diagram follows one rank across forward, backward, and optimizer update. Phase 1 shows the forward all-gather to reconstruct full BF16 parameters followed by immediate resharding. Phase 2 shows backward all-gather and reduce-scatter returning reduced gradient shard dW_r. Phase 3 executes local AdamW updates on the owned shard P_r and clears gradients. Top bar illustrates persistent 1 GB FP32 shard residency.'

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

function frame(
    c: Colors,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    fill: string,
    rx = 8,
    strokeWidth = 1.5,
) {
    return SvgFrame({ c, x, y, width: w, height: h, rx, fill, stroke: color, strokeWidth })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const geometry = [
        // Persistent Shard Bar
        frame(c, 24, 70, 812, 44, green, `${green}12`, 8, 1.5),

        // Phase 1: Forward Pass
        frame(c, 24, 126, 258, 332, blue, `${blue}0a`, 10, 1.5),
        frame(c, 36, 172, 234, 66, c.borderSubtle, c.bgCard, 6, 1),
        frame(c, 36, 246, 234, 66, blue, `${blue}15`, 6, 1.2),
        frame(c, 36, 320, 234, 66, warm, `${warm}15`, 6, 1.2),
        frame(c, 36, 394, 234, 52, c.borderSubtle, c.bgCard, 6, 1),

        // Phase 2: Backward Pass
        frame(c, 301, 126, 258, 332, purple, `${purple}0a`, 10, 1.5),
        frame(c, 313, 172, 234, 66, purple, `${purple}15`, 6, 1.2),
        frame(c, 313, 246, 234, 66, warm, `${warm}15`, 6, 1.2),
        frame(c, 313, 320, 234, 66, purple, `${purple}18`, 6, 1.2),
        frame(c, 313, 394, 234, 52, c.borderSubtle, c.bgCard, 6, 1),

        // Phase 3: Optimizer Step
        frame(c, 578, 126, 258, 332, green, `${green}0a`, 10, 1.5),
        frame(c, 590, 172, 234, 78, green, `${green}15`, 6, 1.2),
        frame(c, 590, 258, 234, 78, green, `${green}15`, 6, 1.2),
        frame(c, 590, 344, 234, 102, c.borderSubtle, c.bgCard, 6, 1),
    ]

    const arrows = [
        // Arrow from Phase 1 to Phase 2
        VectorArrow({
            x1: 282,
            y1: 292,
            x2: 301,
            y2: 292,
            color: blue,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        // Arrow from Phase 2 to Phase 3
        VectorArrow({
            x1: 559,
            y1: 292,
            x2: 578,
            y2: 292,
            color: purple,
            strokeWidth: 2,
            arrowSize: 6,
        }),
    ]

    const labels = [
        // Title & Header
        label(
            c,
            'FSDP2 Unit Lifecycle Across a Training Step',
            24,
            14,
            812,
            28,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Parameter unshard, forward compute, reshard, backward compute, reduce-scatter, and optimizer step for 1B unit across 4 ranks',
            24,
            44,
            812,
            20,
            13,
            muted,
            500,
        ),

        // Persistent Shard Bar
        label(
            c,
            'RESIDENT STATE: Owned FP32 Parameter Shard Pᵣ (1 GB) remains in GPU HBM throughout the entire step',
            36,
            82,
            788,
            20,
            13,
            green,
            700,
            'center',
        ),

        // Phase 1: Forward Pass
        label(c, '1 · Forward Pass', 36, 138, 234, 22, 15, blue, 700),
        label(c, 'Step 1 · Rest State', 44, 178, 218, 16, 12, c.textPrimary, 600),
        label(
            c,
            'Only owned shard Pᵣ (1 GB) resident.\n.grad is None, activations clear.',
            44,
            196,
            218,
            34,
            11,
            muted,
            400,
        ),

        label(c, 'Step 2 · Forward All-Gather', 44, 252, 218, 16, 12, blue, 600),
        label(
            c,
            'Gathers shards from all 4 ranks.\nFull unit (2 GB BF16) materialized.',
            44,
            270,
            218,
            34,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'Step 3 · Forward Compute', 44, 326, 218, 16, 12, warm, 600),
        label(
            c,
            'Runs Y = Layer(X) forward kernel.\nSaves activations needed for backward.',
            44,
            344,
            218,
            34,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'Step 4 · Post-Forward Reshard', 44, 400, 218, 16, 12, c.textPrimary, 600),
        label(
            c,
            'Full 2 GB BF16 weights immediately freed!\nOnly Pᵣ shard and activations remain.',
            44,
            416,
            218,
            28,
            11,
            muted,
            400,
        ),

        // Phase 2: Backward Pass
        label(c, '2 · Backward Pass', 313, 138, 234, 22, 15, purple, 700),
        label(c, 'Step 5 · Backward All-Gather', 321, 178, 218, 16, 12, purple, 600),
        label(
            c,
            'Full BF16 unit gathered again.\nWeights needed to compute dX = dY Wᵀ.',
            321,
            196,
            218,
            34,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'Step 6 · Backward Compute', 321, 252, 218, 16, 12, warm, 600),
        label(
            c,
            'Computes input gradient dX and\nlocal unreduced weight gradient dW.',
            321,
            270,
            218,
            34,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'Step 7 · Reduce-Scatter', 321, 326, 218, 16, 12, purple, 600),
        label(
            c,
            'Sums dW across ranks; leaves each\nrank only its assigned shard dWᵣ.',
            321,
            344,
            218,
            34,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'Step 8 · Post-Backward Reshard', 321, 400, 218, 16, 12, c.textPrimary, 600),
        label(
            c,
            'Full weights freed. Rank holds only\nowned weight shard Pᵣ and gradient dWᵣ.',
            321,
            416,
            218,
            28,
            11,
            muted,
            400,
        ),

        // Phase 3: Optimizer Step
        label(c, '3 · Optimizer Step', 590, 138, 234, 22, 15, green, 700),
        label(c, 'Step 9 · Local AdamW Update', 598, 180, 218, 16, 12, green, 600),
        label(
            c,
            'Updates owned FP32 shard Pᵣ using dWᵣ\nand local moment buffers mᵣ and vᵣ.\nZero cross-rank communication required!',
            598,
            198,
            218,
            46,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'Step 10 · zero_grad()', 598, 266, 218, 16, 12, green, 600),
        label(
            c,
            'zero_grad(set_to_none=True) clears\ngradient memory references, restoring\nexact baseline rest state for next step.',
            598,
            284,
            218,
            46,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'Memory Wall Defeated', 598, 352, 218, 16, 12, c.textPrimary, 600),
        label(
            c,
            'Peak weight memory bounded to one unit\nat a time, rather than the full 70B model.\nCommunication is overlapped via CUDA streams.',
            598,
            372,
            218,
            64,
            11,
            muted,
            400,
        ),

        // Footer Note
        label(
            c,
            'Prefetching: FSDP2 enqueues All-Gather of unit i+1 on a communication stream during compute of unit i to hide transfer latency.',
            24,
            474,
            812,
            20,
            12,
            muted,
            500,
            'center',
        ),
    ]

    const svg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...geometry,
        ...arrows,
    )
    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [CanvasItem({ x: 0, y: 0, width, height, children: svg }), ...labels],
    })
}

export default create('dark')
