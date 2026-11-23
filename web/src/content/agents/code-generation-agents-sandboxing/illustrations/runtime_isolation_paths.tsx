import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'
import type { ToneName } from 'vizmatic'

export const width = 680
export const height = 760
export const alt =
    'Comparison across four sandbox runtimes showing container namespaces sharing the host kernel, gVisor intercepting syscalls via Sentry, Firecracker isolating a guest kernel over KVM, and WebAssembly enforcing checked linear memory with an import-free 1000-fuel lab returning run(41) = 42.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.85)
    const tier = (
        title: string,
        tone: ToneName,
        guest: string,
        boundary: string,
        hostLink: string,
        surfaceBadge: string,
    ) =>
        Panel({
            c,
            title,
            tone,
            width: 648,
            padding: 10,
            titleFontSize: 20,
            children: Row({
                gap: 8,
                justify: 'space-between',
                align: 'center',
                children: [
                    Row({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({ c, text: guest, fontSize: 20 }),
                            FlowArrow({ c, direction: 'right', length: 16, tone }),
                            TextLabel({ c, text: boundary, fontSize: 20, mono: true }),
                            FlowArrow({ c, direction: 'right', length: 16, tone }),
                            TextLabel({ c, text: hostLink, fontSize: 20 }),
                        ],
                    }),
                    BadgePill({ c, text: surfaceBadge, tone, fontSize: 20 }),
                ],
            }),
        })

    return Scene({
        c,
        title: 'Execution Isolation Tiers: Syscall Mediation Depth',
        padding: 16,
        gap: 10,
        contentWidth: 648,
        children: [
            tier(
                '1. Docker / runc (Namespaces + seccomp)',
                'red',
                'Process',
                'seccomp-bpf',
                'Host Kernel',
                'Shared OS',
            ),
            tier(
                '2. gVisor (User-Space Kernel)',
                'warm',
                'Process',
                'Sentry + Gofer',
                'Host Kernel',
                'Narrowed ABI',
            ),
            tier(
                '3. Firecracker (Hardware Virtualization)',
                'blue',
                'Guest VM',
                'Guest Kernel',
                'KVM + VMM',
                'Own Kernel',
            ),
            Panel({
                c,
                title: '4. WebAssembly (Wasmtime Guest Sandbox)',
                tone: 'green',
                width: 648,
                padding: 10,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        Row({
                            gap: 8,
                            justify: 'space-between',
                            align: 'center',
                            children: [
                                Row({
                                    gap: 8,
                                    align: 'center',
                                    children: [
                                        TextLabel({ c, text: 'WAT <= 4 KiB', fontSize: 20 }),
                                        FlowArrow({
                                            c,
                                            direction: 'right',
                                            length: 16,
                                            tone: 'green',
                                        }),
                                        TextLabel({
                                            c,
                                            text: 'Fuel: 1k · 64 KiB',
                                            fontSize: 20,
                                            mono: true,
                                        }),
                                    ],
                                }),
                                BadgePill({
                                    c,
                                    text: 'Imports: 0 -> run(41)=42',
                                    tone: 'green',
                                    fontSize: 20,
                                }),
                            ],
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
