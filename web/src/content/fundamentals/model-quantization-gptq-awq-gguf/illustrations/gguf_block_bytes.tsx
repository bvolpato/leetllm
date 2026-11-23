import type { ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 340
export const alt =
    'A GGUF file lays out a header, typed key-value metadata, tensor descriptors containing names, shapes, types, and offsets, then aligned tensor payloads. The enlarged Q4_K superblock contains 256 weights in eight groups of 32, 128 code bytes, 12 packed bytes for eight six-bit scale and minimum pairs, and two FP16 super-scales totaling four bytes. The complete 144-byte block stores 4.5 bits per weight and reconstructs values with d times s_i times q minus d_min times m_i.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    // File layout, schematic widths.
    s.text(8, 12, 'The whole file, widths not to scale', { color: k.faint })
    const parts: Array<[string, number, string]> = [
        ['header', 58, k.mid],
        ['typed metadata', 120, k.state],
        ['tensor descriptors', 148, k.wait],
        ['tensor payloads', 168, k.prefill],
    ]
    let x = 8
    let payloadX = 0
    parts.forEach(([name, w, color]) => {
        if (color === k.prefill) payloadX = x
        s.rect(x, 28, w - 2, 34, { fill: tint(color, 0.14), stroke: color })
        s.text(x + 6, 45, name)
        x += w
    })
    s.text(186, 78, 'name, shape, type, offset', { color: k.wait, mono: true })
    s.rect(payloadX + 134, 33, 26, 24, { stroke: k.ink, width: 1.25 })
    s.arrow(payloadX + 147, 58, payloadX + 147, 106, k.ink)

    // One block, to scale in bytes.
    s.text(8, 118, 'One Q4_K block, to scale in bytes', { weight: 700 })
    const UNIT = 494 / 144
    const Y = 134
    s.rect(8, Y, 128 * UNIT - 1.5, 40, { fill: tint(k.prefill, 0.22), stroke: k.prefill })
    for (let g = 1; g < 8; g++) {
        s.line(8 + g * 16 * UNIT, Y, 8 + g * 16 * UNIT, Y + 8, k.prefill)
        s.line(8 + g * 16 * UNIT, Y + 32, 8 + g * 16 * UNIT, Y + 40, k.prefill)
    }
    s.text(8 + 64 * UNIT, Y + 20, '128 code bytes: 8 groups of 32 weights', {
        align: 'center',
        weight: 600,
        w: 400,
    })
    s.rect(8 + 128 * UNIT, Y, 12 * UNIT - 1.5, 40, { fill: tint(k.state, 0.3), stroke: k.state })
    s.rect(8 + 140 * UNIT, Y, 4 * UNIT, 40, { fill: tint(k.wait, 0.5), stroke: k.wait })

    s.line(8 + 134 * UNIT, Y + 42, 8 + 134 * UNIT, Y + 49, k.state)
    s.text(8 + 134 * UNIT + 6, Y + 58, '12 bytes: 8 pairs of 6-bit scale, minimum', {
        align: 'right',
        color: k.state,
        weight: 600,
        w: 340,
    })
    s.line(8 + 142 * UNIT, Y + 42, 8 + 142 * UNIT, Y + 71, k.wait)
    s.text(8 + 142 * UNIT + 4, Y + 80, '4 bytes: 2 FP16 super-scales', {
        align: 'right',
        color: k.wait,
        weight: 600,
        w: 240,
    })

    s.line(8, 232, 502, 232, k.line)
    s.text(8, 252, '144 bytes × 8 / 256 weights = 4.5 bits per weight', { weight: 700 })
    s.text(8, 276, 'Each value rebuilds as', { color: k.mid })
    s.text(176, 276, 'd · s_i · q − d_min · m_i', { mono: true })
    s.text(8, 300, 'Default alignment is 32 bytes.', { color: k.mid })
    s.text(8, 324, 'Q4_K_M files may mix tensor types.', { color: k.mid })
    return s.render()
}
