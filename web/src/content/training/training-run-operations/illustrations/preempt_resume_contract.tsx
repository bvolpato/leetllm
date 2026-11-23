import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import { createElement } from 'react'
import type { ThemeMode } from 'vizmatic'

export const width = 860
export const height = 520
export const opaqueBackground = true
export const alt =
    'An authored checkpoint swimlane shows the same interval across GPU live state, an immutable host snapshot, and durable storage with its recovery pointer. At microbatch 5 of 8, finish batches 6 through 8 and apply update 1841 once. The GPU may continue while a copied snapshot keeps the model, AdamW moments, scheduler, scaler, RNG, and data cursor fixed at 1841. Its shards are written and the manifest is validated while the durable pointer remains at 1840. Success publishes 1841; failure keeps 1840. The authored 120-second warning estimate allocates 20 seconds to finish the window, 90 seconds to save and publish, and 10 seconds of margin.'

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
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const geometry = [
        // Stage Column Headers (y = 76)
        frame(c, 190, 76, 204, 30, blue, `${blue}15`, 6, 1),
        frame(c, 406, 76, 224, 30, purple, `${purple}15`, 6, 1),
        frame(c, 642, 76, 194, 30, green, `${green}15`, 6, 1),

        // Swimlane 1: GPU Live State (y = 114, h = 92)
        frame(c, 24, 114, 154, 92, blue, `${blue}10`, 8, 1.5),
        frame(c, 190, 114, 646, 92, blue, `${blue}06`, 8, 1.2),
        // Stage blocks in Lane 1
        frame(c, 198, 122, 188, 76, c.borderSubtle, c.bgCard, 6, 1),
        frame(c, 414, 122, 208, 76, blue, `${blue}15`, 6, 1.2),
        frame(c, 650, 122, 178, 76, c.borderSubtle, c.bgCard, 6, 1),

        // Swimlane 2: Host Snapshot (y = 218, h = 92)
        frame(c, 24, 218, 154, 92, purple, `${purple}10`, 8, 1.5),
        frame(c, 190, 218, 646, 92, purple, `${purple}06`, 8, 1.2),
        // Stage blocks in Lane 2
        frame(c, 198, 226, 188, 76, c.borderSubtle, c.bgCard, 6, 1),
        frame(c, 414, 226, 208, 76, purple, `${purple}15`, 6, 1.2),
        frame(c, 650, 226, 178, 76, purple, `${purple}18`, 6, 1.2),

        // Swimlane 3: Durable Storage Pointer (y = 322, h = 92)
        frame(c, 24, 322, 154, 92, green, `${green}10`, 8, 1.5),
        frame(c, 190, 322, 646, 92, green, `${green}06`, 8, 1.2),
        // Stage blocks in Lane 3
        frame(c, 198, 330, 188, 76, c.borderSubtle, c.bgCard, 6, 1),
        frame(c, 414, 330, 208, 76, warm, `${warm}15`, 6, 1.2),
        frame(c, 650, 330, 178, 76, green, `${green}18`, 6, 1.2),

        // Bottom Summary Frame
        frame(c, 24, 426, 812, 60, c.borderSubtle, c.bgCard, 8, 1),
    ]

    const arrows = [
        // GPU state clone to Host Snapshot
        VectorArrow({
            x1: 518,
            y1: 198,
            x2: 518,
            y2: 226,
            color: purple,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        // Host Snapshot writing to Storage
        VectorArrow({
            x1: 739,
            y1: 302,
            x2: 739,
            y2: 330,
            color: green,
            strokeWidth: 2,
            arrowSize: 6,
        }),
    ]

    const labels = [
        // Main Header
        label(
            c,
            'Preemption Handling & Atomic Checkpoint Contract',
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
            'Coordinating GPU execution, immutable host snapshot, and durable storage within a 120s warning window',
            24,
            44,
            812,
            20,
            13,
            muted,
            500,
        ),

        // Stage Column Headers
        label(c, 'Stage 1 · Finish Window (20s)', 190, 82, 204, 18, 12, blue, 700, 'center'),
        label(c, 'Stage 2 · Save & Validate (90s)', 406, 82, 224, 18, 12, purple, 700, 'center'),
        label(c, 'Stage 3 · Atomic Commit (10s)', 642, 82, 194, 18, 12, green, 700, 'center'),

        // Lane 1 Left Label
        label(c, 'GPU Live State', 34, 136, 134, 20, 14, blue, 700),
        label(c, 'Active HBM & Kernels', 34, 158, 134, 16, 11, muted, 400),
        // Lane 1 Content
        label(c, 'Warning arrives at m5/8', 206, 132, 172, 16, 11, warm, 700),
        label(
            c,
            'Finish micro-batches 6–8;\napply optimizer update 1841.',
            206,
            150,
            172,
            32,
            10,
            c.textPrimary,
            400,
        ),
        label(c, 'Fast Memory Clone', 422, 132, 192, 16, 11, blue, 700),
        label(
            c,
            'Clone parameters, moments & cursor\nto host RAM (completes in ~2s).',
            422,
            150,
            192,
            32,
            10,
            c.textPrimary,
            400,
        ),
        label(c, 'Safe Shutdown', 658, 132, 162, 16, 11, c.textPrimary, 700),
        label(
            c,
            'GPU may halt cleanly;\nno uncommitted steps lost.',
            658,
            150,
            162,
            32,
            10,
            muted,
            400,
        ),

        // Lane 2 Left Label
        label(c, 'Host Snapshot', 34, 240, 134, 20, 14, purple, 700),
        label(c, 'Pinned System RAM', 34, 262, 134, 16, 11, muted, 400),
        // Lane 2 Content
        label(c, 'Idle / Awaiting Boundary', 206, 240, 172, 16, 11, muted, 600),
        label(
            c,
            'Host waits for completed\noptimizer step boundary.',
            206,
            258,
            172,
            32,
            10,
            muted,
            400,
        ),
        label(c, 'Fixed State at Step 1841', 422, 236, 192, 16, 11, purple, 700),
        label(
            c,
            'Immutable copy of weights, AdamW,\nscheduler, RNG, and data pointer.',
            422,
            254,
            192,
            32,
            10,
            c.textPrimary,
            400,
        ),
        label(c, 'Validate Manifest', 658, 236, 162, 16, 11, purple, 700),
        label(
            c,
            'Verify sharded file checksums\nand manifest integrity before swap.',
            658,
            254,
            162,
            32,
            10,
            c.textPrimary,
            400,
        ),

        // Lane 3 Left Label
        label(c, 'Durable Pointer', 34, 344, 134, 20, 14, green, 700),
        label(c, 'Cloud Storage / S3', 34, 366, 134, 16, 11, muted, 400),
        // Lane 3 Content
        label(c, 'Active: Step 1840', 206, 344, 172, 16, 11, green, 700),
        label(
            c,
            'Previous completed checkpoint\nremains safe recovery target.',
            206,
            362,
            172,
            32,
            10,
            muted,
            400,
        ),
        label(c, 'Writing to Staging Path', 422, 340, 192, 16, 11, warm, 700),
        label(
            c,
            'Shards upload to temp prefix.\nActive pointer STILL at 1840!',
            422,
            358,
            192,
            32,
            10,
            c.textPrimary,
            400,
        ),
        label(c, 'Atomic Swap -> Step 1841', 658, 340, 162, 16, 11, green, 700),
        label(
            c,
            'Atomic manifest rename publishes 1841.\nIf preemption kills node earlier: resume 1840.',
            658,
            358,
            162,
            40,
            10,
            c.textPrimary,
            400,
        ),

        // Bottom Summary Labels
        label(
            c,
            'Graceful Preemption Time Budget (120s total)',
            36,
            434,
            788,
            18,
            13,
            c.textPrimary,
            700,
        ),
        label(
            c,
            '20s (finish current accumulation window) + 90s (write sharded checkpoint & validate manifest) + 10s (atomic commit margin) = 120s.',
            36,
            456,
            788,
            18,
            12,
            green,
            600,
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
