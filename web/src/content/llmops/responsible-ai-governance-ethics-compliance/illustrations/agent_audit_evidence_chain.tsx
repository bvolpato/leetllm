import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { INNER, area, arrow, box, figure, kit, label, mark, pin, row, wire } from './_kit'

export const width = 680
export const height = 330
export const alt =
    'Two hash chains share a first event, a proposal with hash 6ccbe6c4e204. The original chain continues with a blocked gate decision, hash b8d3f6e6231c, and no effect, hash 656a7a026cf0, which matches a separately protected copy of the head. The rewritten chain changes the gate decision to approved, hash 22211dd15606, and its forged head is a53d81e68bdd, which differs from the protected copy.'

const LINK = 178
const FIRST = 122
const SECOND = 216
const LINK_HEIGHT = 74
const X1 = 46
const X2 = 246
const COMPARE = 569
const AREA_HEIGHT = SECOND + LINK_HEIGHT

/** Hash prefixes printed by the listing this figure belongs to. */
export type ChainValues = {
    gateName: string
    proposal: string
    gate: string
    head: string
    forgedGate: string
    forgedHead: string
}

const REFERENCE: ChainValues = {
    gateName: 'Gate: blocked',
    proposal: '6ccbe6c4e204',
    gate: 'b8d3f6e6231c',
    head: '656a7a026cf0',
    forgedGate: '22211dd15606',
    forgedHead: 'a53d81e68bdd',
}

export function create(theme: ThemeMode = 'dark', v: ChainValues = REFERENCE) {
    const k = kit(theme)
    const link = (name: string, hash: string, color: string) =>
        box(
            k,
            <>
                {label(k, name, { weight: 600, color })}
                {label(k, hash, { mono: true, color: k.mid })}
            </>,
            { color, width: LINK, style: { height: LINK_HEIGHT } },
        )
    const midA = FIRST + LINK_HEIGHT / 2
    const midB = SECOND + LINK_HEIGHT / 2
    const verdict = (y: number, kind: 'yes' | 'no', text: string, color: string) =>
        pin(
            X2 + LINK + 10,
            y - 28,
            row(
                <>
                    {mark(kind, color)}
                    {label(k, text, { weight: 600, color, style: { marginLeft: 5 } })}
                </>,
            ),
        )
    return figure(
        k,
        area(
            INNER,
            AREA_HEIGHT,
            <>
                {pin(0, 0, wire(INNER, AREA_HEIGHT, `M20 ${LINK_HEIGHT} V${midA}`, k.go))}
                {pin(0, 0, wire(INNER, AREA_HEIGHT, `M20 ${midA} V${midB}`, k.stop))}
                {pin(20, midA - 8, arrow(k.go, X1 - 20))}
                {pin(20, midB - 8, arrow(k.stop, X1 - 20))}
                {pin(X1 + LINK, midA - 8, arrow(k.go, X2 - X1 - LINK))}
                {pin(X1 + LINK, midB - 8, arrow(k.stop, X2 - X1 - LINK))}
                {pin(
                    0,
                    0,
                    wire(INNER, AREA_HEIGHT, `M${X2 + LINK} ${midA} H${COMPARE}`, k.go, '5 5'),
                )}
                {pin(
                    0,
                    0,
                    wire(INNER, AREA_HEIGHT, `M${X2 + LINK} ${midB} H${COMPARE}`, k.stop, '5 5'),
                )}
                {pin(0, 0, wire(INNER, AREA_HEIGHT, `M${COMPARE} 104 V${midB}`, k.mid, '5 5'))}
                {pin(0, 0, link('Proposal', v.proposal, k.data))}
                {pin(LINK + 12, 24, label(k, 'shared first event', { color: k.mid }))}
                {pin(
                    474,
                    0,
                    box(
                        k,
                        <>
                            {label(k, 'Protected copy', { weight: 600, align: 'center' })}
                            {label(k, 'of the head', { weight: 600, align: 'center' })}
                            {label(k, v.head, { mono: true, color: k.mid, align: 'center' })}
                        </>,
                        { color: k.ink, fill: true, width: 190 },
                    ),
                )}
                {pin(X1, FIRST, link(v.gateName, v.gate, k.go))}
                {pin(X2, FIRST, link('Effect: none', v.head, k.go))}
                {pin(X1, SECOND, link('Gate: approved', v.forgedGate, k.stop))}
                {pin(X2, SECOND, link('Forged head', v.forgedHead, k.stop))}
                {verdict(midA, 'yes', 'match', k.go)}
                {verdict(midB, 'no', 'differs', k.stop)}
            </>,
        ),
    )
}

export default create('dark')
