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
export const height = 700
export const alt =
    'Comparison between Linux Bubblewrap plus Landlock and macOS Seatbelt sandbox profiles across workspace source files, Git metadata, system binaries, temporary scratch storage, and home credential directories showing that whole-project macOS profiles must explicitly block writes to .git metadata.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.85)
    const boundaryRow = (pathLabel: string, ruleText: string, tone: ToneName) =>
        Row({
            gap: 10,
            justify: 'space-between',
            align: 'center',
            children: [
                TextLabel({ c, text: pathLabel, fontSize: 20, mono: true }),
                Row({
                    gap: 8,
                    align: 'center',
                    children: [
                        FlowArrow({ c, direction: 'right', tone, length: 16 }),
                        BadgePill({ c, text: ruleText, tone, fontSize: 20 }),
                    ],
                }),
            ],
        })

    return Scene({
        c,
        title: 'Host-Native Filesystem Boundaries: Linux vs. macOS',
        padding: 16,
        gap: 12,
        contentWidth: 648,
        children: [
            Panel({
                c,
                title: 'Linux · Bubblewrap Namespaces + Landlock LSM',
                tone: 'green',
                width: 648,
                padding: 12,
                titleFontSize: 21,
                children: Column({
                    gap: 8,
                    children: [
                        boundaryRow('src/ (source)', 'RW bind mount', 'green'),
                        boundaryRow('.git/ (metadata)', 'RO bind mount', 'green'),
                        boundaryRow('/usr, /bin, /lib', 'RO bind mount', 'blue'),
                        boundaryRow('/tmp & ~/.ssh', 'Fresh tmpfs / unmounted', 'green'),
                    ],
                }),
            }),
            Panel({
                c,
                title: 'macOS · Seatbelt Profile (Explicit Subpath Denies)',
                tone: 'warm',
                width: 648,
                padding: 12,
                titleFontSize: 21,
                children: Column({
                    gap: 8,
                    children: [
                        boundaryRow('src/ (source)', 'Allow file-write* subpath', 'blue'),
                        boundaryRow('.git/hooks, config', 'Deny write* rule mandatory', 'red'),
                        boundaryRow('/usr, /System', 'Read-only system rule', 'blue'),
                        boundaryRow('/tmp & ~/.ssh', 'Scoped tmp / denied subpath', 'warm'),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
