import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 778
export const alt =
    'Squares drawn to one scale of area. Static merging stores one dense 14 GB checkpoint for each task: fifty copies use 700 GB. With dynamic serving, each request selects an adapter or none while one 14 GB base is shared. Fifty assumed 128 MB adapters plus the base occupy 20.4 GB as artifacts. Merged inference computes the dense merged weights; dynamic inference adds a scaled low-rank term for the selected adapter.'

const ADAPTER_SIDE = Math.sqrt(128 / 14000)

export const layoutHeight = (L: Layout) => (L.print ? 246 : 778)

function grid(
    k: Kit,
    x: number,
    y: number,
    side: number,
    gap: number,
    columns: number,
    count: number,
    fill: string,
    stroke?: string,
) {
    for (let i = 0; i < count; i++) {
        const cx = x + (i % columns) * (side + gap)
        const cy = y + Math.floor(i / columns) * (side + gap)
        k.rect(cx, cy, side, side, {
            fill,
            ...(stroke ? { stroke, strokeWidth: 1 } : {}),
            rx: 0,
        })
    }
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const unit = L.print ? 26 : 50
    const gap = L.print ? 4 : 8
    const leftX = 6
    const rightX = L.print ? L.W * 0.5 + 12 : 6
    const headH = L.print ? 26 : 38
    const gridH = 5 * unit + 4 * gap
    const y0 = 3

    // Merged: one dense checkpoint per task.
    k.t(leftX, y0, L.W / (L.print ? 2 : 1) - 12, 'Merged: one checkpoint per task', {
        weight: 600,
        size: L.S,
    })
    grid(k, leftX + 1, y0 + headH, unit, gap, 10, 50, k.tint('warm', 0.42), k.ink('warm'))
    const leftText = y0 + headH + gridH + 8
    k.t(leftX, leftText, L.W - 12, '50 × 14 GB = 700 GB', {
        weight: 600,
        tone: 'warm',
        size: L.S,
    })
    k.tex(leftX, leftText + L.S * 1.5, 'W_{\\mathrm{merged}}\\,x', {
        size: L.print ? 17 : 22,
    })

    // Shared base: same square size, with adapters at their true area.
    const rightY = L.print ? y0 : leftText + L.S * 1.5 + 54
    k.t(rightX, rightY, L.print ? L.W * 0.5 - 18 : L.W - 12, 'Shared base with adapters', {
        weight: 600,
        size: L.S,
    })
    k.rect(rightX + 1, rightY + headH, unit, unit, {
        fill: k.tint('blue', 0.42),
        stroke: k.ink('blue'),
        rx: 0,
    })
    k.t(rightX + 1, rightY + headH + unit + 3, unit * 3, '14 GB', {
        size: L.S,
        color: c.textSecondary,
    })
    const adapter = Math.max(1.5, unit * ADAPTER_SIDE)
    const adapterGap = L.print ? 5 : 9
    const adaptersX = rightX + unit + (L.print ? 26 : 40)
    k.arrow(
        adaptersX - (L.print ? 5 : 8),
        rightY + headH + unit / 2,
        rightX + unit + (L.print ? 5 : 8),
        rightY + headH + unit / 2,
        { stroke: k.ink('green'), strokeWidth: 1.75 },
    )
    grid(k, adaptersX, rightY + headH + 2, adapter, adapterGap, 10, 50, k.ink('green'))
    k.dot(adaptersX + adapter / 2, rightY + headH + 2 + adapter / 2, L.print ? 3 : 4.5, {
        stroke: k.ink('green'),
        strokeWidth: 1.25,
    })
    const adaptersBottom = rightY + headH + 2 + 5 * adapter + 4 * adapterGap
    k.t(adaptersX, adaptersBottom + 4, L.print ? 200 : 300, '50 × 128 MB', {
        size: L.S,
        color: c.textSecondary,
    })
    const rightText = L.print ? leftText : adaptersBottom + L.S * 1.6 + 16
    k.t(rightX, rightText, L.print ? L.W * 0.5 - 18 : L.W - 12, '14 GB + 50 × 128 MB = 20.4 GB', {
        weight: 600,
        tone: 'green',
        size: L.S,
    })
    k.tex(rightX, rightText + L.S * 1.5, 'W_0x+\\frac{\\alpha_i}{r_i}B_i(A_ix)', {
        size: L.print ? 17 : 22,
    })
    if (!L.print)
        k.t(
            rightX,
            rightText + L.S * 1.5 + 44,
            L.W - 12,
            'Punica uses SGMV. S-LoRA pages adapter and KV tensors.',
            { size: L.S, color: c.textSecondary },
        )
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
