import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 395
export const alt =
    'Synchronized LoRA adapter reference-count plot and VRAM slot residency timeline. First, gateway authorization and alias resolution map docs-current to immutable docs-v2 before cache lookup. Active batch execution pins docs-v2 at refcount 1, blocking LRU eviction when Tenant B requests the slot (forcing Tenant B to wait or reroute). Once Batch A completes, refcount drops to 0, making the slot idle and eligible for eviction so Adapter B can load and pin at refcount 1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const onBlue = getReadableTextColor(blue, c, c.bg)
    const onPurple = getReadableTextColor(purple, c, c.bg)
    const soft = (hex: string, la = 0.1, da = 0.16) => tint(hex, c.bg, theme === 'light' ? la : da)
    const rim = (hex: string) => tint(hex, c.bg, theme === 'light' ? 0.45 : 0.55)

    // Shared horizontal timeline x = 136..788 mapped to t = 0..10
    const plot = fig.plot({ x: 136, y: 66, width: 652, height: 120 }, { x: [0, 10], y: [0, 1.35] })

    // Phase markers along t = [0, 1.8, 4.2, 6.4, 7.6, 10]
    const tAuth = 1.8
    const tContend = 4.2
    const tRetire = 6.4
    const tSwap = 7.6

    for (const [t, col] of [
        [tAuth, blue],
        [tContend, warm],
        [tRetire, green],
        [tSwap, purple],
    ] as const) {
        fig.line(plot.px(t), 52, plot.px(t), 312, {
            color: col,
            width: 1.2,
            dash: '4 3',
            opacity: 0.75,
        })
    }

    // Top track: Refcount step plot (y = 0 and y = 1)
    fig.text(122, plot.py(1), 'ref = 1', {
        size: 13,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
        mono: true,
        width: 80,
    })
    fig.text(122, plot.py(0), 'ref = 0', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
        mono: true,
        width: 80,
    })
    fig.text(24, 34, 'SLOT REFCOUNT', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 120,
    })

    // Horizontal guide lines at y=0 and y=1
    fig.line(plot.px(0), plot.py(1), plot.px(10), plot.py(1), {
        color: c.borderSubtle,
        width: 1,
        dash: '2 3',
    })
    fig.line(plot.px(0), plot.py(0), plot.px(10), plot.py(0), {
        color: c.textMuted,
        width: 1.25,
    })
    fig.line(plot.px(0), plot.py(1.25), plot.px(0), plot.py(0), {
        color: c.textMuted,
        width: 1.25,
    })

    // Step function: docs-v2 (blue)
    plot.curve(
        [
            [0, 0],
            [tAuth, 0],
            [tAuth, 1],
            [tRetire, 1],
            [tRetire, 0],
            [tSwap, 0],
        ],
        { color: blue, width: 2.8 },
    )
    // Shaded active pin area for docs-v2
    fig.rect(
        plot.px(tAuth),
        plot.py(1),
        plot.px(tRetire) - plot.px(tAuth),
        plot.py(0) - plot.py(1),
        { fill: blue, opacity: theme === 'light' ? 0.1 : 0.16 },
    )

    // Step function: Adapter B (purple)
    plot.curve(
        [
            [tSwap, 0],
            [tSwap, 1],
            [10, 1],
        ],
        { color: purple, width: 2.8 },
    )
    fig.rect(
        plot.px(tSwap),
        plot.py(1),
        plot.px(10) - plot.px(tSwap),
        plot.py(0) - plot.py(1),
        { fill: purple, opacity: theme === 'light' ? 0.1 : 0.16 },
    )

    // Key transition dots
    plot.point(tAuth, 1, { color: blue, r: 5 })
    plot.point(tContend, 1, { color: red, r: 5.5 })
    plot.point(tRetire, 0, { color: green, r: 5 })
    plot.point(tSwap, 1, { color: purple, r: 5 })

    // Top event annotations (cleanly spaced across horizontal bands)
    fig.text(plot.px(tAuth), 34, '1. Auth & pin docs-v2', {
        size: 13,
        color: blue,
        align: 'center',
        weight: 700,
        width: 160,
    })
    fig.text(plot.px(tContend), 34, '2. Tenant B requests', {
        size: 13,
        color: warm,
        align: 'center',
        weight: 700,
        width: 155,
    })
    fig.text(plot.px(tRetire), 34, '3. Batch A done', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
        width: 120,
    })
    fig.text(plot.px(8.85), 34, '4. Evict & load B', {
        size: 13,
        color: purple,
        align: 'center',
        weight: 700,
        width: 140,
    })

    // Contention callout right inside the pinned region
    fig.rect(plot.px(tContend) - 72, plot.py(0.55) - 22, 144, 44, {
        fill: c.bg,
        stroke: red,
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text(plot.px(tContend), plot.py(0.55) - 9, 'Eviction blocked', {
        size: 13,
        color: red,
        align: 'center',
        weight: 700,
        width: 132,
    })
    fig.text(plot.px(tContend), plot.py(0.55) + 10, 'Wait or reroute B', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 132,
    })

    // Bottom track: Synchronized VRAM Slot Residency Bar
    const slotY = 236
    const slotH = 54
    fig.text(122, slotY + 18, 'VRAM Slot', {
        size: 14,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
        width: 100,
    })
    fig.text(122, slotY + 38, 'residency', {
        size: 12,
        color: c.textSecondary,
        align: 'right',
        width: 100,
    })

    // Segment 1: Auth & alias resolve (0..tAuth)
    fig.rect(plot.px(0), slotY, plot.px(tAuth) - plot.px(0) - 3, slotH, {
        fill: soft(blue, 0.08, 0.14),
        stroke: rim(blue),
        strokeWidth: 1.2,
        radius: 6,
    })
    fig.text(plot.px(tAuth / 2), slotY + 19, 'Auth gate', {
        size: 13,
        color: blue,
        align: 'center',
        weight: 700,
        width: 108,
    })
    fig.text(plot.px(tAuth / 2), slotY + 38, 'alias -> v2', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
        width: 108,
    })

    // Segment 2: docs-v2 PINNED (tAuth..tRetire)
    fig.rect(plot.px(tAuth), slotY, plot.px(tRetire) - plot.px(tAuth) - 3, slotH, {
        fill: blue,
        radius: 6,
    })
    fig.text(plot.px((tAuth + tRetire) / 2), slotY + 19, 'Adapter A (docs-v2) · PINNED', {
        size: 13,
        color: onBlue,
        align: 'center',
        weight: 700,
        width: 280,
    })
    fig.text(plot.px((tAuth + tRetire) / 2), slotY + 38, 'base-v3 + docs-v2 locked in VRAM', {
        size: 12,
        color: onBlue,
        align: 'center',
        width: 280,
    })

    // Segment 3: Idle / LRU eligible (tRetire..tSwap)
    fig.rect(plot.px(tRetire), slotY, plot.px(tSwap) - plot.px(tRetire) - 3, slotH, {
        fill: soft(green, 0.12, 0.18),
        stroke: green,
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text(plot.px((tRetire + tSwap) / 2), slotY + 19, 'Idle', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
        width: 72,
    })
    fig.text(plot.px((tRetire + tSwap) / 2), slotY + 38, 'LRU OK', {
        size: 12,
        color: green,
        align: 'center',
        width: 72,
    })

    // Segment 4: Adapter B PINNED (tSwap..10)
    fig.rect(plot.px(tSwap), slotY, plot.px(10) - plot.px(tSwap), slotH, {
        fill: purple,
        radius: 6,
    })
    fig.text(plot.px((tSwap + 10) / 2), slotY + 19, 'Adapter B · PINNED', {
        size: 13,
        color: onPurple,
        align: 'center',
        weight: 700,
        width: 148,
    })
    fig.text(plot.px((tSwap + 10) / 2), slotY + 38, 'DMA loaded', {
        size: 12,
        color: onPurple,
        align: 'center',
        width: 148,
    })

    // Bottom time arrow & invariant summary
    fig.arrow(plot.px(0), 328, plot.px(10), 328, { color: c.textMuted, width: 1.4, head: 6 })
    fig.text(plot.px(5), 348, 'Execution timeline', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        width: 160,
    })
    fig.text(plot.px(0), 372, 'Permission verified before cache lookup · Eviction waits for ref = 0', {
        size: 13,
        color: c.textSecondary,
        width: 520,
    })

    return fig.render()
}
