import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 780
export const alt =
    'Defense-in-depth container worker diagram placing a 30-second supervisor watchdog over a rootless UID 10001 worker with read-only root filesystem, 0.5 CPU quota, 512 MiB memory cap, 64 PID limit, network disabled, and 64 MiB noexec nosuid nodev temporary directory.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    return Scene({
        c,
        padding: 10,
        gap: 6,
        children: GraphDiagram({
            c,
            width: 656,
            height: 750,
            direction: 'TB',
            nodeWidth: 262,
            nodeHeight: 68,
            labelFontSize: 21,
            detailFontSize: 20,
            arrowSize: 6,
            padding: 8,
            nodeGap: 20,
            rankGap: 18,
            routing: 'dagre',
            nodes: [
                {
                    id: 'sup',
                    label: '1. External Watchdog',
                    detail: 'Hard 30s wall deadline',
                    tone: 'purple',
                    icon: 'lock',
                },
                {
                    id: 'proc',
                    label: '2. Unprivileged Worker',
                    detail: 'UID 10001 · caps dropped',
                    tone: 'blue',
                    icon: 'container',
                },
                {
                    id: 'cgroups',
                    label: '3a. cgroups v2 Limits',
                    detail: '0.5 CPU · 512 MiB · 64 PIDs',
                    tone: 'green',
                    icon: 'firewall',
                },
                {
                    id: 'net',
                    label: '3b. Network Isolated',
                    detail: 'net: none (loopback)',
                    tone: 'critical',
                    icon: 'network',
                },
                {
                    id: 'rootfs',
                    label: '4a. Read-Only Root FS',
                    detail: 'Pinned digest + /app',
                    tone: 'green',
                    icon: 'storage',
                },
                {
                    id: 'tmpfs',
                    label: '4b. Temp /tmp Mount',
                    detail: '64 MiB noexec,nosuid',
                    tone: 'warm',
                    icon: 'file',
                },
            ],
            edges: [
                { from: 'sup', to: 'proc', label: 'supervises', tone: 'purple' },
                { from: 'proc', to: 'cgroups', tone: 'green' },
                { from: 'proc', to: 'net', tone: 'critical' },
                { from: 'cgroups', to: 'rootfs', tone: 'green' },
                { from: 'net', to: 'tmpfs', tone: 'warm' },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
