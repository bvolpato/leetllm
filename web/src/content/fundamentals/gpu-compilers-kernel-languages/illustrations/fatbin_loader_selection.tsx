import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'Loader flow for a fatbin containing sm_90 cubin and compute_90 PTX. A compatible cubin jumps straight to native GPU load, which stays lazy by default. A cubin miss checks embedded PTX against the driver max ISA, running driver JIT and compute cache write before native load, or failing load if neither matches. Right column lists CUDA_FORCE_PTX_JIT=1, CUDA_CACHE_DISABLE=1, and CUDA_DISABLE_PTX_JIT=1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
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
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(x + w / 2, y + h / 2 - 8, title, {
            size: 13,
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

    // === Left: Fatbin image selection flow ===
    fig.text(24, 22, 'Fatbin image selection at module load', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Node 1: Host fatbin
    const colL = 24
    const colR = 264
    const nw = 186
    const nh = 48

    box(colL, 48, 220, nh, 'Host fatbin', 'sm_90 cubin + compute_90 PTX', blue)
    fig.arrow(134, 98, 134, 126, { color: blue, width: 2, head: 6 })

    // Node 2: Cubin match?
    box(colL, 130, 220, nh, 'Compatible cubin?', 'same major arch', warm)

    // Yes branch -> Native load (right)
    fig.arrow(colL + 224, 154, colR + 18, 154, { color: green, width: 2.2, head: 6 })
    fig.text(colL + 236, 141, 'Yes', { size: 12, weight: 700, color: green })
    box(colR + 22, 130, 174, nh, 'Native GPU load', 'lazy by default', green)

    // No branch -> Embedded PTX?
    fig.arrow(134, 180, 134, 214, { color: warm, width: 2, head: 6 })
    fig.text(146, 198, 'No (cubin miss)', { size: 12, weight: 600, color: warm })
    box(colL, 218, 220, nh, 'Embedded PTX valid?', 'PTX ISA <= driver max', warm)

    // PTX Yes -> Driver JIT -> Native load
    fig.arrow(colL + 224, 242, colR + 18, 242, { color: purple, width: 2, head: 6 })
    fig.text(colL + 236, 229, 'Yes', { size: 12, weight: 700, color: purple })
    box(colR + 22, 218, 174, nh, 'Driver PTX JIT', 'compile + write cache', purple)

    // Arrow from JIT up to Native load
    fig.arrow(colR + 109, 216, colR + 109, 182, { color: green, width: 2, head: 6 })

    // PTX No -> Load fails
    fig.arrow(134, 268, 134, 304, { color: red, width: 2, head: 6 })
    fig.text(146, 286, 'No image', { size: 12, weight: 700, color: red })
    box(colL, 308, 220, nh, 'Module load fails', 'CUDA_ERROR_NO_BINARY_FOR_GPU', red)

    // Summary note under left flow
    fig.text(24, 388, 'Fast path hits cubin directly; PTX fallback preserves forward compatibility.', {
        size: 12,
        color: c.textSecondary,
    })

    // === Vertical hairline divider ===
    fig.line(482, 20, 482, height - 20, { color: c.borderSubtle, width: 1 })

    // === Right: Runtime environment controls ===
    const rx = 502
    const rw = 234
    fig.text(rx, 22, 'Runtime override switches', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const drawControl = (
        y: number,
        h: number,
        title: string,
        vars: string[],
        note: string,
        tone: string,
    ) => {
        fig.rect(rx, y, rw, h, {
            fill: tint(tone, c.bg, isLight ? 0.1 : 0.18),
            stroke: tone,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(rx + 12, y + 18, title, { size: 13, weight: 700, color: tone })
        vars.forEach((v, i) => {
            fig.text(rx + 12, y + 38 + i * 18, v, {
                size: 11.5,
                weight: 600,
                color: c.textPrimary,
                mono: true,
            })
        })
        fig.text(rx + 12, y + h - 14, note, { size: 11.5, color: c.textSecondary })
    }

    drawControl(
        52,
        102,
        'Force uncached PTX path',
        ['CUDA_FORCE_PTX_JIT=1', 'CUDA_CACHE_DISABLE=1'],
        'Bypasses cubin & disk cache',
        purple,
    )

    drawControl(
        174,
        88,
        'Require compatible cubin',
        ['CUDA_DISABLE_PTX_JIT=1'],
        'Fails immediately on cubin miss',
        red,
    )

    drawControl(
        282,
        84,
        'Lazy module loading',
        ['CUDA_MODULE_LOADING=LAZY'],
        'First kernel call pays load cost',
        c.textSecondary,
    )

    return fig.render()
}

export default create('dark')
