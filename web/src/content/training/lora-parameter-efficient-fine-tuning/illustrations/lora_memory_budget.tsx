import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 556
export const alt =
    'A 65B comparison on one shared 0 to 800 GB scale: full fine-tuning states use 780 GB under a 12-byte-per-parameter recipe (weights 130, gradients 130, Adam moments 260 each), the frozen FP16 base uses 130 GB, and an ideal NF4 base plus nested scales uses 33.5 GB, inside a 48 GB device line. A second 0 to 48 GB scale splits the ideal quantized base into 32.5 GB of NF4 values and 1.0 GB of nested scales, leaving 14.5 GB for omitted allocations. Adapters, gradients, optimizer state, activations, and temporary buffers are excluded from the lower bars.'

const segments: { label: string; value: number; tone: ToneName }[] = [
    { label: 'W 130', value: 130, tone: 'blue' },
    { label: 'G 130', value: 130, tone: 'warm' },
    { label: 'm 260', value: 260, tone: 'purple' },
    { label: 'v 260', value: 260, tone: 'cyan' },
]

export const layoutHeight = (L: Layout) => (L.print ? 250 : 556)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const nameW = L.print ? 150 : 0
    const ax0 = nameW + (L.print ? 4 : 10)
    const ax1 = L.W - 30
    const map = (gb: number) => ax0 + (gb / 800) * (ax1 - ax0)
    const top = L.print ? 24 : 34
    const rowH = L.print ? 38 : 84
    const barH = L.print ? 24 : 36
    const barY = (row: number) => top + row * rowH + (L.print ? 6 : 34)
    const rows = ['Full fine-tuning', 'Frozen 16-bit base', 'NF4 base + scales']
    const axisY = top + rows.length * rowH + (L.print ? 4 : 12)
    const gpu = k.ink('critical')

    rows.forEach((name, row) => {
        if (L.print) k.mid(6, barY(row), nameW, barH, name, { weight: 600 })
        else
            k.t(map(48) + 8, top + row * rowH, L.W - map(48) - 20, name, {
                weight: 600,
                size: L.S,
            })
    })
    let start = 0
    segments.forEach((segment) => {
        k.rect(map(start), barY(0), map(segment.value) - map(0), barH, {
            fill: k.tint(segment.tone, 0.38),
            stroke: k.ink(segment.tone),
            rx: 0,
        })
        const textX = start === 0 ? map(48) : map(start)
        k.mid(textX, barY(0), map(start + segment.value) - textX, barH, segment.label, {
            size: L.S,
            align: 'center',
        })
        start += segment.value
    })
    k.rect(map(0), barY(1), map(130) - map(0), barH, {
        fill: k.tint('blue', 0.38),
        stroke: k.ink('blue'),
        rx: 0,
    })
    k.mid(map(130) + 8, barY(1), 180, barH, '130 GB', { size: L.S, weight: 600 })
    k.rect(map(0), barY(2), map(33.5) - map(0), barH, {
        fill: k.tint('green', 0.5),
        stroke: k.ink('green'),
        rx: 0,
    })
    k.dot(map(33.5), barY(2) + barH / 2, L.print ? 2.5 : 3.5, {
        fill: k.ink('green'),
    })
    k.mid(map(48) + 8, barY(2), 180, barH, '33.5 GB', {
        size: L.S,
        weight: 600,
        tone: 'green',
    })
    k.t(
        map(780) - 130,
        top - L.S * 1.45 + (L.print ? 4 : 0),
        130 + (ax1 - map(780)) + 10,
        '780 GB',
        { size: L.S, weight: 600, align: 'right' },
    )

    k.line(ax0, axisY, ax1, axisY, { stroke: c.textMuted })
    ;[0, 200, 400, 600, 800].forEach((gb) => {
        k.line(map(gb), axisY, map(gb), axisY + 5, { stroke: c.textMuted })
        k.t(map(gb) - 26, axisY + 6, 52, String(gb), {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })
    k.line(map(48), top - 6, map(48), axisY + 5, { stroke: gpu, strokeWidth: 2 })
    k.dot(map(48), axisY, L.print ? 3 : 4, { fill: gpu })
    k.t(map(48) + 6, top - L.S * 1.45 + (L.print ? 4 : 0), 170, '48 GB GPU', {
        size: L.S,
        color: gpu,
        weight: 600,
    })

    // Zoomed strip on its own 0 to 48 GB scale.
    const zoomY = axisY + (L.print ? 36 : 60)
    const z0 = L.print ? ax0 : 10
    const zmap = (gb: number) => z0 + (gb / 48) * (ax1 - z0)
    const zoomH = L.print ? 26 : 40
    if (L.print) k.mid(6, zoomY, nameW, zoomH, 'Zoom: 0 to 48 GB', { weight: 600 })
    else
        k.t(10, zoomY - 30, L.W - 20, 'Zoom: 0 to 48 GB', {
            weight: 600,
            size: L.S,
        })
    k.rect(zmap(0), zoomY, zmap(32.5) - zmap(0), zoomH, {
        fill: k.tint('green', 0.42),
        stroke: k.ink('green'),
        rx: 0,
    })
    k.rect(zmap(32.5), zoomY, zmap(33.5) - zmap(32.5), zoomH, {
        fill: k.ink('warm'),
        rx: 0,
    })
    k.rect(zmap(33.5), zoomY, zmap(48) - zmap(33.5), zoomH, {
        stroke: gpu,
        dash: '4 3',
        rx: 0,
    })
    k.arrow(zmap(33.5) + 4, zoomY - (L.print ? 6 : 12), zmap(48) - 2, zoomY - (L.print ? 6 : 12), {
        stroke: gpu,
        strokeWidth: 1.5,
    })
    k.mid(zmap(0), zoomY, zmap(32.5) - zmap(0), zoomH, 'NF4 values 32.5', {
        size: L.S,
        align: 'center',
    })
    k.mid(zmap(33.5), zoomY, zmap(48) - zmap(33.5), zoomH, '14.5 left', {
        size: L.S,
        align: 'center',
        color: gpu,
    })
    k.t(zmap(33) - 90, zoomY + zoomH + 4, 180, 'scales 1.0', {
        size: L.S,
        align: 'center',
        tone: 'warm',
    })
    k.t(zmap(0), zoomY + zoomH + 4, 40, '0', {
        size: L.S,
        color: c.textSecondary,
    })
    k.t(zmap(48) - 40, zoomY + zoomH + 4, 40, '48', {
        size: L.S,
        align: 'right',
        color: c.textSecondary,
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
