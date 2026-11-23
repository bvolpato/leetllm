import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
    type Canvas,
} from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 358
export const alt =
    'Two decode data paths show packed INT4 weights read from HBM into a fused unpack, rescale, and FP16 multiply, alongside a standalone dequantization path that writes a full FP16 matrix to HBM and reads it again. The simplified weight-read comparison is 2 bytes per BF16 weight versus 0.5 code bytes plus scale metadata. The A100 roofline values give a ridge of about 153 FLOPs per byte; intensity one reaches 0.65 percent of nominal FP16 peak. KV-cache storage remains a separate budget.'

function memory(s: Canvas, x: number, y: number, w: number, a: string, b: string) {
    const k = s.k
    s.rect(x, y, w, 52, { fill: tint(k.state, 0.12), stroke: k.state })
    s.text(x + w / 2, y + 17, a, { align: 'center', w, color: k.state, weight: 700 })
    s.text(x + w / 2, y + 36, b, { align: 'center', w })
}

function compute(s: Canvas, x: number, y: number, w: number, a: string, b: string) {
    const k = s.k
    s.rect(x, y, w, 52, { fill: tint(k.decode, 0.12), stroke: k.decode })
    s.text(x + w / 2, y + 17, a, { align: 'center', w, weight: 700 })
    s.text(x + w / 2, y + 36, b, {
        align: 'center',
        w,
        color: b === 'multiply' ? k.ink : k.mid,
        weight: b === 'multiply' ? 700 : 500,
    })
}

interface Device {
    spec: string
    peakShare: number
    peakLabel: string
    ridge: string
}

export function drawMemoryPaths(theme: ThemeMode, device: Device) {
    const k = pk(theme)
    const s = canvas(k, width, height)

    // Line weight stands for bytes per weight crossing the memory bus.
    s.text(8, 12, 'Fused kernel', { weight: 700 })
    const y1 = 28
    memory(s, 8, y1, 112, 'HBM', 'codes + scales')
    s.arrow(122, y1 + 34, 256, y1 + 34, k.state, { width: 1.25 })
    s.text(189, y1 + 18, '0.5 byte + scales', {
        align: 'center',
        color: k.state,
        weight: 600,
        w: 132,
    })
    compute(s, 260, y1, 208, 'One fused kernel', 'unpack, rescale, multiply')
    s.arrow(470, y1 + 26, 490, y1 + 26, k.decode)
    s.text(494, y1 + 26, 'Y', { weight: 700, w: 14 })

    s.line(8, 98, 502, 98, k.line)
    s.text(8, 116, 'Standalone path', { weight: 700 })
    const y2 = 132
    memory(s, 8, y2, 80, 'HBM', 'packed W')
    s.arrow(90, y2 + 26, 110, y2 + 26, k.state)
    compute(s, 112, y2, 86, 'Dequantize', 'to FP16')
    s.arrow(200, y2 + 26, 234, y2 + 26, k.state, { width: 6 })
    memory(s, 236, y2, 94, 'HBM', 'FP16 matrix')
    s.arrow(332, y2 + 26, 366, y2 + 26, k.state, { width: 6 })
    compute(s, 368, y2, 100, 'FP16', 'multiply')
    s.arrow(470, y2 + 26, 490, y2 + 26, k.decode)
    s.text(494, y2 + 26, 'Y', { weight: 700, w: 14 })
    s.text(8, y2 + 70, '2 bytes per weight, written and then read again', {
        color: k.state,
        weight: 600,
    })

    s.line(8, 222, 502, 222, k.line)
    s.text(8, 242, device.spec, { color: k.faint, w: 490 })
    s.rect(8, 258, 494, 16, { fill: tint(k.prefill, 0.18), stroke: tint(k.prefill, 0.5) })
    s.rect(8, 258, Math.max(494 * device.peakShare, 3), 16, { fill: k.state })
    s.text(8, 290, `Memory ceiling at 1 FLOP/byte: ${device.peakLabel} of peak`, {
        color: k.state,
        weight: 700,
    })
    s.text(502, 290, 'Compute', { align: 'right', color: k.prefill, weight: 700 })
    s.text(8, 316, `The ridge sits near ${device.ridge} FLOPs per byte.`, { color: k.mid })
    s.text(8, 340, 'KV-cache precision is a separate budget.', { color: k.mid })
    return s.render()
}

export function create(theme: ThemeMode = 'dark') {
    return drawMemoryPaths(theme, {
        spec: 'A100 FP16: 312 TFLOP/s of compute and 2.039 TB/s of memory',
        peakShare: 0.0065,
        peakLabel: '0.65%',
        ridge: '153',
    })
}
