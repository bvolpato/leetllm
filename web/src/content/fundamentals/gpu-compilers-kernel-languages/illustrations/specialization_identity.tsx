import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 410
export const alt =
    'Left side shows vector_add.cu unchanged while scale.cuh changes SCALE from 1 to 2 for inputs 4 and 5: a source-only key returns stale hit 9, whereas a dependency-aware key misses and rebuilds 18; below, identical shape 1000 misses when stride changes from 1 to 2. Right side flows four key groups (source plus transitive headers, toolchain plus ordered flags and target, shape plus stride and dtype, block plus warps and stages) into a SHA-256 recipe digest.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('red')

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        tone: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, isLight ? 0.14 : 0.24),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(x + w / 2, y + h / 2 - 8, title, {
            size: 12.5,
            weight: 700,
            color: tone,
            align: 'center',
        })
        fig.text(x + w / 2, y + h / 2 + 9, sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // === Left: Concrete invalidation cases ===
    fig.text(24, 22, 'Why incomplete cache keys fail', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Case 1: Header edit
    fig.text(24, 52, 'A. Header scale.cuh changes SCALE: 1 -> 2', {
        size: 13,
        weight: 700,
        color: warm,
    })
    fig.text(24, 70, 'vector_add.cu unchanged; inputs 4 + 5 should produce 18', {
        size: 11.5,
        color: c.textSecondary,
    })

    const lx = 24
    const lw = 166
    const rx = 228
    const rw = 172

    box(lx, 86, lw, 48, 'Source-only key', 'ignores .cuh', c.textSecondary)
    fig.arrow(lx + lw + 4, 110, rx - 4, 110, { color: red, width: 2, head: 6 })
    box(rx, 86, rw, 48, 'Stale hit -> 9', 'wrong (old ×1)', red)

    box(lx, 148, lw, 48, 'Header-aware key', 'hashes .cu + .cuh', blue)
    fig.arrow(lx + lw + 4, 172, rx - 4, 172, { color: green, width: 2, head: 6 })
    box(rx, 148, rw, 48, 'Miss -> rebuild 18', 'correct (new ×2)', green)

    // Separator between Case A and Case B
    fig.line(24, 222, 404, 222, { color: c.borderSubtle, width: 1 })

    // Case 2: Same shape, different stride
    fig.text(24, 246, 'B. Identical shape (1000,), changed stride', {
        size: 13,
        weight: 700,
        color: blue,
    })
    fig.text(24, 264, 'Contiguous vs strided layout changes generated load code', {
        size: 11.5,
        color: c.textSecondary,
    })

    box(lx, 282, lw, 48, 'stride = 1', 'key K1 cached', green)
    fig.arrow(lx + lw + 4, 306, rx - 4, 306, { color: warm, width: 2, head: 6 })
    box(rx, 282, rw, 48, 'stride = 2', 'misses K1 -> new', warm)

    // Vertical hairline separating Left examples from Right SHA-256 recipe
    fig.line(426, 20, 426, height - 20, { color: c.borderSubtle, width: 1 })

    // === Right: Complete SHA-256 recipe key ===
    const kx = 448
    const kw = 288
    fig.text(kx, 22, 'Complete SHA-256 recipe inputs', {
        size: 15,
        weight: 700,
        color: purple,
    })

    const inputs = [
        { title: '1. Source + transitive headers', sub: 'vector_add.cu + scale.cuh', tone: blue },
        { title: '2. Toolchain + flags + target', sub: 'nvcc/triton, flags, sm_90/90a', tone: cyan },
        { title: '3. Tensor shape + stride + dtype', sub: '(1000,), stride=2, fp32', tone: warm },
        { title: '4. Launch & tile parameters', sub: 'BLOCK=256, warps, stages', tone: purple },
    ]
    inputs.forEach((inp, i) => {
        const y = 48 + i * 62
        box(kx, y, kw, 48, inp.title, inp.sub, inp.tone)
    })

    // Converging arrow to SHA-256 digest
    fig.arrow(kx + kw / 2, 290, kx + kw / 2, 326, { color: green, width: 2.2, head: 6 })
    box(kx, 330, kw, 52, 'Unique SHA-256 recipe digest', 'exact cache lookup key K', green)

    return fig.render()
}

export default create('dark')
