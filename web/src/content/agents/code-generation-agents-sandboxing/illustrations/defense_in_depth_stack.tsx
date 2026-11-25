import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 405
export const alt =
    'Concentric defense-in-depth sandbox layers surrounding an unprivileged UID 10001 worker with capabilities dropped. Surrounding kernel limits enforce cgroups v2 (0.5 CPU, 512 MiB RAM, 64 PIDs), disabled networking (loopback only), read-only pinned root filesystem, and a 64 MiB noexec/nosuid /tmp mount, all supervised by an external 30-second hard watchdog.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('red')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')

    // Outer Layer 1: External Supervisor Watchdog (Hard 30s deadline)
    fig.rect(24, 18, 852, 370, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.05 : 0.08),
        stroke: purple,
        strokeWidth: 2,
        radius: 14,
    })
    fig.text(44, 42, 'Layer 1 · External Watchdog Supervisor', {
        size: 15,
        weight: 700,
        color: purple,
    })
    fig.text(856, 42, 'Hard 30s wall-clock kill · out-of-band host process', {
        size: 13,
        mono: true,
        color: c.textSecondary,
        align: 'right',
    })

    // Middle Layer 2: Kernel & OS Containment Envelope (4 explicit boundary quadrants around core)
    fig.rect(52, 68, 796, 298, {
        fill: tint(c.borderSubtle, c.bg, theme === 'light' ? 0.14 : 0.14),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 12,
    })

    const wall = (x: number, y: number, w: number, h: number, title: string, detail: string, tone: string) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.11 : 0.17),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(x + w / 2, y + 22, title, { size: 14, weight: 700, color: tone, align: 'center' })
        fig.text(x + w / 2, y + 44, detail, { size: 12.5, mono: true, color: c.textPrimary, align: 'center' })
    }

    // 4 Containment Walls framing the worker core
    wall(74, 86, 356, 62, 'cgroups v2 Resource Quotas', '0.5 CPU · 512 MiB RAM · 64 PIDs', green)
    wall(470, 86, 356, 62, 'Network Namespace Isolated', 'net: none (loopback only)', red)
    wall(74, 286, 356, 62, 'Read-Only Root Filesystem', 'Pinned image digest + /app RO', green)
    wall(470, 286, 356, 62, 'Bounded Scratch /tmp Mount', '64 MiB · noexec, nosuid, nodev', warm)

    // Inner Core: Unprivileged Worker Process
    fig.rect(256, 172, 388, 90, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.15 : 0.24),
        stroke: blue,
        strokeWidth: 2.2,
        radius: 10,
    })
    fig.text(450, 200, 'Unprivileged Worker Process', {
        size: 16,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(450, 224, 'UID 10001 · all Linux capabilities dropped', {
        size: 13.5,
        mono: true,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(450, 246, 'Untrusted agent code executes here', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Subtle inward enforcement arrows from the 4 containment walls
    fig.arrow(252, 148, 310, 170, { color: green, width: 1.5, head: 5.5 })
    fig.arrow(648, 148, 590, 170, { color: red, width: 1.5, head: 5.5 })
    fig.arrow(252, 286, 310, 264, { color: green, width: 1.5, head: 5.5 })
    fig.arrow(648, 286, 590, 264, { color: warm, width: 1.5, head: 5.5 })

    return fig.render()
}

export default create('dark')
