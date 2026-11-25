import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 420
export const alt =
    'CUDA block 0 thread 1 lowers through NVVM IR and LLVM IR while Triton pid 0 offset 1 mask 1 lowers through TTIR, TTGIR, and LLVM IR into PTX. PTX loads x[1]=0.25 into %f1 and y[1]=-2 into %f2, adds to %f3=-1.75, and stores out[1]=-1.75. Toolkit ptxas allocates physical registers to build a target ELF cubin for GPU driver execution or nvdisasm SASS disassembly.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const cyan = fig.tone('cyan')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string | undefined,
        tone: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, isLight ? 0.14 : 0.24),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 6,
        })
        if (sub) {
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
        } else {
            fig.text(x + w / 2, y + h / 2, title, {
                size: 12.5,
                weight: 700,
                color: tone,
                align: 'center',
            })
        }
    }

    // === Band 1: Source Frontends (CUDA & Triton -> LLVM IR) ===
    fig.text(24, 20, '1. Frontends lower index i = 1 to LLVM IR', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    // CUDA row
    const r1Y = 38
    fig.text(24, r1Y + 21, 'CUDA', { size: 13.5, weight: 700, color: cyan })
    box(92, r1Y, 152, 42, 'block 0, thread 1', 'i = 1', cyan)
    fig.arrow(248, r1Y + 21, 286, r1Y + 21, { color: cyan, width: 1.8, head: 5 })
    box(290, r1Y, 176, 42, 'NVVM IR', 'device subset', cyan)
    fig.arrow(470, r1Y + 21, 566, r1Y + 21, { color: blue, width: 1.8, head: 5 })
    box(570, r1Y, 166, 42, 'LLVM IR', 'NVPTX target', blue)

    // Triton row
    const r2Y = 92
    fig.text(24, r2Y + 21, 'Triton', { size: 13.5, weight: 700, color: purple })
    box(92, r2Y, 152, 42, 'pid 0 · offset 1', 'mask[1] = 1', purple)
    fig.arrow(248, r2Y + 21, 272, r2Y + 21, { color: purple, width: 1.8, head: 5 })
    box(276, r2Y, 126, 42, 'TTIR', 'block IR', purple)
    fig.arrow(406, r2Y + 21, 430, r2Y + 21, { color: purple, width: 1.8, head: 5 })
    box(434, r2Y, 112, 42, 'TTGIR', 'layout IR', purple)
    fig.arrow(550, r2Y + 21, 566, r2Y + 21, { color: blue, width: 1.8, head: 5 })
    box(570, r2Y, 166, 42, 'LLVM IR', 'lowered', blue)

    // Converging down arrow into PTX
    fig.line(24, 152, width - 24, 152, { color: c.borderSubtle, width: 1 })
    fig.arrow(653, 136, 653, 166, { color: warm, width: 2, head: 6 })

    // === Band 2: PTX Virtual Registers ===
    fig.text(24, 174, '2. PTX virtual registers  (x[1] = 0.25, y[1] = -2.0)', {
        size: 14,
        weight: 700,
        color: warm,
    })

    const ptxY = 194
    const pw = 160
    const pGap = 24
    const p1 = 24
    const p2 = p1 + pw + pGap
    const p3 = p2 + pw + pGap
    const p4 = p3 + pw + pGap

    box(p1, ptxY, pw, 48, 'ld.f32 %f1', '0.25 <- x[1]', warm)
    fig.arrow(p1 + pw + 3, ptxY + 24, p2 - 3, ptxY + 24, { color: warm, width: 1.8, head: 5 })
    box(p2, ptxY, pw, 48, 'ld.f32 %f2', '-2.0 <- y[1]', warm)
    fig.arrow(p2 + pw + 3, ptxY + 24, p3 - 3, ptxY + 24, { color: warm, width: 1.8, head: 5 })
    box(p3, ptxY, pw, 48, 'add.f32 %f3', '%f1 + %f2 = -1.75', warm)
    fig.arrow(p3 + pw + 3, ptxY + 24, p4 - 3, ptxY + 24, { color: green, width: 1.8, head: 5 })
    box(p4, ptxY, pw, 48, 'st.f32 out[1]', '-1.75 -> mem', green)

    // === Band 3: Assembly -> Binary -> Execution / Disassembly ===
    fig.line(24, 266, width - 24, 266, { color: c.borderSubtle, width: 1 })
    fig.arrow(p4 + pw / 2, ptxY + 50, p4 + pw / 2, 280, { color: green, width: 2, head: 6 })

    fig.text(24, 288, '3. Physical register allocation & machine binary', {
        size: 14,
        weight: 700,
        color: green,
    })

    const b3Y = 324
    box(24, b3Y, 174, 52, 'ptxas', 'physical reg alloc', warm)
    fig.arrow(202, b3Y + 26, 240, b3Y + 26, { color: green, width: 2, head: 6 })
    box(244, b3Y, 188, 52, 'cubin (ELF)', 'target SASS binary', green)

    // Fork into GPU driver & nvdisasm
    const forkX = 456
    fig.line(432, b3Y + 26, forkX, b3Y + 26, { color: green, width: 1.8 })
    fig.line(forkX, b3Y - 6, forkX, b3Y + 56, { color: c.border, width: 1.6 })
    fig.arrow(forkX, b3Y - 6, 488, b3Y - 6, { color: green, width: 1.8, head: 5 })
    fig.arrow(forkX, b3Y + 56, 488, b3Y + 56, { color: c.textSecondary, width: 1.8, head: 5 })

    box(492, b3Y - 28, 244, 44, 'GPU driver', 'load & execute cubin', green)
    box(492, b3Y + 34, 244, 44, 'nvdisasm', 'inspect machine SASS', c.textSecondary)

    return fig.render()
}

export default create('dark')
