import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 405
export const alt =
    'Side-by-side isolation stack across four sandbox runtimes: Docker/runc shares the host kernel behind seccomp-bpf, gVisor mediates syscalls through user-space Sentry and Gofer, Firecracker isolates a dedicated guest kernel over KVM, and WebAssembly runs import-free guest code inside checked 64 KiB linear memory with a 1,000-fuel cap.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const red = fig.tone('red')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const green = fig.tone('green')

    const cols = [
        {
            title: '1. Docker / runc',
            badge: 'Shared OS',
            tone: red,
            layers: [
                { label: 'Agent Process', sub: 'namespaces', isBoundary: false },
                { label: 'seccomp-bpf', sub: 'syscall filter', isBoundary: true },
                { label: 'Shared Host Kernel', sub: 'direct kernel ABI', isBoundary: false },
                { label: 'Host Hardware', sub: 'bare metal / VM', isBoundary: false },
            ],
        },
        {
            title: '2. gVisor',
            badge: 'Narrowed ABI',
            tone: warm,
            layers: [
                { label: 'Agent Process', sub: 'intercepted syscalls', isBoundary: false },
                { label: 'Sentry + Gofer', sub: 'user-space kernel', isBoundary: true },
                { label: 'Host Kernel', sub: 'small host subset', isBoundary: false },
                { label: 'Host Hardware', sub: 'bare metal / VM', isBoundary: false },
            ],
        },
        {
            title: '3. Firecracker',
            badge: 'Own Kernel',
            tone: blue,
            layers: [
                { label: 'Guest VM Process', sub: 'microVM workload', isBoundary: false },
                { label: 'Guest Linux Kernel', sub: 'isolated kernel', isBoundary: false },
                { label: 'KVM + VMM', sub: 'hardware virt wall', isBoundary: true },
                { label: 'Host Hardware', sub: 'VT-x / SEV', isBoundary: false },
            ],
        },
        {
            title: '4. WebAssembly',
            badge: 'Zero Imports',
            tone: green,
            layers: [
                { label: 'WAT <= 4 KiB', sub: 'run(41) = 42', isBoundary: false },
                { label: 'Wasmtime Sandbox', sub: '1k fuel · 64 KiB mem', isBoundary: true },
                { label: 'No Host Syscalls', sub: 'imports: 0', isBoundary: false },
                { label: 'Host Process', sub: 'in-proc linear mem', isBoundary: false },
            ],
        },
    ]

    // Left stratum labels
    const strata = ['Workload', 'Mediation', 'Kernel / Mem', 'Substrate']
    const startY = 82
    const boxH = 60
    const rowGap = 14
    strata.forEach((st, r) => {
        fig.text(14, startY + r * (boxH + rowGap) + boxH / 2, st, {
            size: 12.5,
            weight: 700,
            color: c.textSecondary,
        })
    })

    const colW = 184
    const colGap = 14
    const startX = 104

    cols.forEach((col, i) => {
        const x = startX + i * (colW + colGap)
        const cx = x + colW / 2

        // Column header + surface badge
        fig.text(cx, 22, col.title, { size: 14.5, weight: 700, color: col.tone, align: 'center' })
        fig.rect(cx - 56, 38, 112, 24, {
            fill: tint(col.tone, c.bg, theme === 'light' ? 0.14 : 0.22),
            stroke: col.tone,
            strokeWidth: 1.2,
            radius: 12,
        })
        fig.text(cx, 50, col.badge, { size: 12, weight: 700, color: col.tone, align: 'center' })

        col.layers.forEach((lv, r) => {
            const y = startY + r * (boxH + rowGap)
            const fill = lv.isBoundary
                ? tint(col.tone, c.bg, theme === 'light' ? 0.18 : 0.28)
                : tint(c.borderSubtle, c.bg, theme === 'light' ? 0.22 : 0.2)
            const stroke = lv.isBoundary ? col.tone : c.borderSubtle
            fig.rect(x, y, colW, boxH, {
                fill,
                stroke,
                strokeWidth: lv.isBoundary ? 2.2 : 1.1,
                radius: 8,
            })
            fig.text(cx, y + 21, lv.label, {
                size: 13,
                weight: 700,
                color: lv.isBoundary ? col.tone : c.textPrimary,
                align: 'center',
            })
            fig.text(cx, y + 42, lv.sub, {
                size: 12,
                mono: true,
                color: c.textSecondary,
                align: 'center',
            })
        })
    })

    // Bottom spectrum arrow
    fig.arrow(104, 384, 876, 384, { color: c.textMuted, width: 1.5, head: 6 })
    fig.text(104, 372, 'Broader kernel surface', { size: 12, color: red })
    fig.text(876, 372, 'Stronger / narrower isolation boundary', { size: 12, color: green, align: 'right' })

    return fig.render()
}

export default create('dark')
