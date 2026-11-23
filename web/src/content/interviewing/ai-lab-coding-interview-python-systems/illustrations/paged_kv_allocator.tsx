import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 760
export const alt =
    'Paged KV-cache Copy-on-Write block allocation diagram. Sequence A and forked Sequence B share immutable prefix block B0 (ref=2), while both sequences call the locked free pool to allocate private blocks B2 and B3 cleanly.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.0)
    return (
        <Scene c={c} padding={14} gap={0}>
            <GraphDiagram
                c={c}
                width={632}
                height={732}
                layout="manual"
                padding={18}
                nodeWidth={196}
                nodeHeight={76}
                labelFontSize={22}
                detailFontSize={20}
                arrowSize={5}
                nodes={[
                    {
                        id: 'seqa',
                        label: 'Sequence A',
                        detail: 'Prefix + decode A',
                        x: 0.22,
                        y: 0.14,
                        tone: 'blue',
                    },
                    {
                        id: 'b0',
                        label: 'Block B0 (ref=2)',
                        detail: 'Shared RO KV',
                        x: 0.78,
                        y: 0.14,
                        tone: 'cyan',
                    },
                    {
                        id: 'pool',
                        label: 'Locked Pool',
                        detail: 'Atomic pop (B4 free)',
                        x: 0.22,
                        y: 0.5,
                        tone: 'warm',
                    },
                    {
                        id: 'seqb',
                        label: 'Sequence B',
                        detail: 'Forked beam',
                        x: 0.78,
                        y: 0.5,
                        tone: 'purple',
                    },
                    {
                        id: 'b2',
                        label: 'Block B2 (ref=1)',
                        detail: 'Seq A tail',
                        x: 0.22,
                        y: 0.86,
                        tone: 'green',
                    },
                    {
                        id: 'b3',
                        label: 'Block B3 (ref=1)',
                        detail: 'Seq B CoW tail',
                        x: 0.78,
                        y: 0.86,
                        tone: 'green',
                    },
                ]}
                edges={[
                    {
                        from: 'seqa',
                        to: 'b0',
                        fromSide: 'right',
                        toSide: 'left',
                        label: 'use',
                        tone: 'blue',
                    },
                    {
                        from: 'seqb',
                        to: 'b0',
                        fromSide: 'top',
                        toSide: 'bottom',
                        label: 'fork',
                        tone: 'purple',
                    },
                    {
                        from: 'seqa',
                        to: 'pool',
                        fromSide: 'bottom',
                        toSide: 'top',
                        label: 'append',
                        tone: 'warm',
                    },
                    {
                        from: 'seqb',
                        to: 'pool',
                        fromSide: 'left',
                        toSide: 'right',
                        label: 'CoW write',
                        tone: 'purple',
                    },
                    {
                        from: 'pool',
                        to: 'b2',
                        fromSide: 'bottom',
                        toSide: 'top',
                        label: 'pop B2',
                        tone: 'green',
                    },
                    {
                        from: 'pool',
                        to: 'b3',
                        fromSide: 'bottom',
                        toSide: 'left',
                        label: 'pop B3',
                        tone: 'green',
                    },
                ]}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
