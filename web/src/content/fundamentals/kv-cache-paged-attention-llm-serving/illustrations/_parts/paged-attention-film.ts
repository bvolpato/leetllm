import {
    arrow,
    assertEqual,
    column,
    draw,
    fadeIn,
    fadeOut,
    film,
    indicate,
    lagged,
    par,
    place,
    rect,
    sceneArea,
    seq,
    shake,
    text,
    to,
    type Node,
    type Vec,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const TOTAL_BLOCKS = 16
const MAX_SEQ_BLOCKS = 8
const REQ_A_LIVE = 3
const REQ_B_LIVE = 2

const CONTIG_USED = REQ_A_LIVE + REQ_B_LIVE
const CONTIG_WASTED = MAX_SEQ_BLOCKS - REQ_A_LIVE + (MAX_SEQ_BLOCKS - REQ_B_LIVE)
const CONTIG_FREE = TOTAL_BLOCKS - 2 * MAX_SEQ_BLOCKS
const CONTIG_WASTE_PCT = Math.round((CONTIG_WASTED / TOTAL_BLOCKS) * 100)

const PAGED_A = [5, 1, 9] as const
const PAGED_B = [12, 3] as const
const PAGED_C = [7, 14, 11] as const
const PAGED_USED = PAGED_A.length + PAGED_B.length + PAGED_C.length
const PAGED_FREE = TOTAL_BLOCKS - PAGED_USED

const COW_SHARED = [5, 10] as const
const COW_A_PRIVATE = 2
const COW_B_PRIVATE = 13
const COW_PHYSICAL = COW_SHARED.length + 2
const COW_UNSHARED = 3 + 3

interface SlotVisual {
    box: Node
    cx: number
    topY: number
    cy: number
}

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(CONTIG_USED, 5, 'contiguous live blocks')
    assertEqual(CONTIG_WASTED, 11, 'contiguous wasted blocks')
    assertEqual(CONTIG_FREE, 0, 'contiguous free blocks')
    assertEqual(CONTIG_WASTE_PCT, 69, 'contiguous waste percentage')
    assertEqual(PAGED_USED, 8, 'paged live blocks')
    assertEqual(PAGED_FREE, 8, 'paged free blocks')
    assertEqual(COW_PHYSICAL, 4, 'CoW physical blocks')
    assertEqual(COW_UNSHARED - COW_PHYSICAL, 2, 'CoW saved blocks')

    return film(
        {
            title: 'How PagedAttention eliminates KV cache waste',
            description:
                'Compare contiguous max-length KV reservations, paged virtual-to-physical block tables, and copy-on-write prefix sharing on a 16-block GPU pool.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const headingRegion = sceneArea({ left: -880, right: 880, top: -485, bottom: -395 })
            const subtitleRegion = sceneArea({ left: -880, right: 880, top: -392, bottom: -332 })
            const footerRegion = sceneArea({ left: -880, right: 880, top: 344, bottom: 412 })

            const makeHeading = (label: string) =>
                place(text(label, { size: 54, color: 'ink' }), headingRegion, 'center')
            const makeSub = (label: string, color = 'dim') =>
                place(text(label, { size: 30, color }), subtitleRegion, 'center')
            const makeFooter = (label: string, color = 'dim') =>
                place(text(label, { size: 32, color }), footerRegion, 'center')

            // Persistent 16-block physical GPU VRAM strip
            const cellW = 96
            const cellH = 114
            const gap = 13
            const pitch = cellW + gap
            const stripWidth = TOTAL_BLOCKS * cellW + (TOTAL_BLOCKS - 1) * gap
            const stripLeftX = -stripWidth / 2
            const stripCy = 176
            const stripTopY = stripCy - cellH / 2
            const stripBottomY = stripCy + cellH / 2

            const vramCaption = text('Physical GPU KV Pool (16 fixed-size blocks)', {
                size: 27,
                color: 'dim',
            }).moveTo([0, stripBottomY + 66])

            const slots: SlotVisual[] = []
            const baseSlotNodes: Node[] = [vramCaption]

            for (let i = 0; i < TOTAL_BLOCKS; i++) {
                const cx = stripLeftX + cellW / 2 + i * pitch
                const box = rect(cellW, cellH, {
                    fill: 'surface',
                    stroke: 'dim',
                    width: 2.5,
                    radius: 10,
                })
                    .at(cx, stripCy)
                    .set('fillOpacity', 0.45)
                const idxLabel = text(`P${i}`, {
                    font: 'mono',
                    size: 26,
                    color: 'dim',
                }).moveTo([cx, stripBottomY + 26])
                slots.push({ box, cx, topY: stripTopY, cy: stripCy })
                baseSlotNodes.push(box, idxLabel)
            }

            const makeSlotBadge = (
                index: number,
                line1: string,
                line2: string | null,
                color: string,
                dashed = false,
            ): Node[] => {
                const slot = slots[index]!
                const fill = rect(cellW - 4, cellH - 4, {
                    fill: color,
                    stroke: color,
                    width: dashed ? 2.5 : 3.5,
                    dash: dashed ? [8, 6] : undefined,
                    radius: 8,
                })
                    .at(slot.cx, slot.cy)
                    .set('fillOpacity', dashed ? 0.12 : 0.22)

                if (!line2) {
                    const t1 = text(line1, {
                        font: 'mono',
                        size: 28,
                        color,
                    }).moveTo([slot.cx, slot.cy])
                    return [fill, t1]
                }
                const t1 = text(line1, {
                    font: 'mono',
                    size: 27,
                    color,
                }).moveTo([slot.cx, slot.cy - 18])
                const t2 = text(line2, {
                    size: 24,
                    color: dashed ? 'red' : 'ink',
                }).moveTo([slot.cx, slot.cy + 20])
                return [fill, t1, t2]
            }

            // ================================================================
            // CHAPTER 1: Contiguous KV Fragmentation Waste
            // ================================================================
            s.chapter('Contiguous reservation waste')

            let heading = makeHeading('Contiguous reservations strand 69% of VRAM')
            let sub = makeSub('Each request pre-allocates max_seq_len = 8 contiguous blocks up front')
            let footer = makeFooter(
                'Live: 5 / 16 blocks   |   Wasted: 11 / 16 (69%)   |   Free: 0 blocks',
                'red',
            )

            // Contiguous reservation brackets above P0..P7 and P8..P15
            const bracketY = stripTopY - 48
            const reqABracket = rect(8 * pitch - gap + 8, 48, {
                fill: 'blue',
                stroke: 'blue',
                width: 2.5,
                radius: 8,
            })
                .at((slots[0]!.cx + slots[7]!.cx) / 2, bracketY)
                .set('fillOpacity', 0.14)
            const reqABracketText = text('Req A slab: 8 reserved (3 live, 5 idle)', {
                size: 28,
                color: 'blue',
            }).moveTo([(slots[0]!.cx + slots[7]!.cx) / 2, bracketY])

            const reqBBracket = rect(8 * pitch - gap + 8, 48, {
                fill: 'orange',
                stroke: 'orange',
                width: 2.5,
                radius: 8,
            })
                .at((slots[8]!.cx + slots[15]!.cx) / 2, bracketY)
                .set('fillOpacity', 0.14)
            const reqBBracketText = text('Req B slab: 8 reserved (2 live, 6 idle)', {
                size: 28,
                color: 'orange',
            }).moveTo([(slots[8]!.cx + slots[15]!.cx) / 2, bracketY])

            // Top summary cards for Chapter 1
            const ch1Upper = sceneArea({ left: -860, right: 860, top: -310, bottom: -115 })
            const [wasteCardArea, reqCCardArea] = ch1Upper.columns([1.25, 1], 56)

            const wasteFrame = rect(wasteCardArea!.width, 168, {
                fill: 'surface',
                stroke: 'red',
                width: 2.5,
                radius: 14,
            })
                .at(wasteCardArea!.cx, wasteCardArea!.cy)
                .set('fillOpacity', 0.65)
            const wasteInfo = place(
                column(
                    [
                        text('Internal Fragmentation: 11 of 16 blocks (69%)', {
                            size: 32,
                            color: 'red',
                        }),
                        text('Reserved slots stay locked until each request finishes', {
                            size: 27,
                            color: 'dim',
                        }),
                    ],
                    { gap: 18 },
                ),
                wasteCardArea!.inset(24),
                'center',
            )

            const reqCFrame = rect(reqCCardArea!.width, 168, {
                fill: 'surface',
                stroke: 'green',
                width: 2.5,
                radius: 14,
            })
                .at(reqCCardArea!.cx, reqCCardArea!.cy)
                .set('fillOpacity', 0.65)
            const reqCWaiting = place(
                column(
                    [
                        text('Incoming Request C', { size: 32, color: 'green' }),
                        text('Needs 3 blocks to start', { size: 28, color: 'ink' }),
                    ],
                    { gap: 18 },
                ),
                reqCCardArea!.inset(24),
                'center',
            )
            const reqCBlockedFrame = rect(reqCCardArea!.width, 168, {
                fill: 'red',
                stroke: 'red',
                width: 3.5,
                radius: 14,
            })
                .at(reqCCardArea!.cx, reqCCardArea!.cy)
                .set('fillOpacity', 0.16)
            const reqCBlockedText = place(
                column(
                    [
                        text('Request C BLOCKED', { size: 34, color: 'red' }),
                        text('0 free contiguous blocks available', { size: 27, color: 'ink' }),
                    ],
                    { gap: 18 },
                ),
                reqCCardArea!.inset(24),
                'center',
            )

            const ch1ALive: Node[] = []
            const ch1AWaste: Node[] = []
            const ch1BLive: Node[] = []
            const ch1BWaste: Node[] = []

            for (let i = 0; i < 3; i++) ch1ALive.push(...makeSlotBadge(i, `A·L${i}`, 'live', 'blue'))
            for (let i = 3; i < 8; i++)
                ch1AWaste.push(...makeSlotBadge(i, 'A', 'wasted', 'red', true))
            for (let i = 8; i < 10; i++)
                ch1BLive.push(...makeSlotBadge(i, `B·L${i - 8}`, 'live', 'orange'))
            for (let i = 10; i < 16; i++)
                ch1BWaste.push(...makeSlotBadge(i, 'B', 'wasted', 'red', true))

            s.add(heading, sub, ...baseSlotNodes)
            s.caption(
                'Early LLM servers pre-reserve a contiguous max-length KV slab for every incoming request.',
                4.0,
            )
            s.play(
                fadeIn([reqABracket, reqABracketText, ...ch1ALive]),
                fadeIn(ch1AWaste, { lag: 0.04 }),
                { duration: 1.4 },
            )
            s.play(
                fadeIn([reqBBracket, reqBBracketText, ...ch1BLive]),
                fadeIn(ch1BWaste, { lag: 0.04 }),
                { duration: 1.4 },
            )
            s.play(fadeIn([wasteFrame, wasteInfo, footer]), { duration: 0.9 })
            s.wait(1.0)

            s.caption(
                '11 of 16 blocks sit idle (69% fragmentation waste), so Request C is blocked despite 11 unused slots.',
                4.2,
            )
            s.play(fadeIn([reqCFrame, reqCWaiting]), { duration: 0.8 })
            s.wait(0.6)
            s.play(
                seq(
                    fadeOut([reqCFrame, reqCWaiting]),
                    fadeIn([reqCBlockedFrame, reqCBlockedText]),
                ),
                { duration: 0.6 },
            )
            s.play(
                shake(reqCBlockedFrame),
                ...reqCBlockedText.nodes.map((n) => shake(n)),
                { duration: 0.6 },
            )
            s.wait(2.2)

            // Clear Chapter 1 overlays
            const ch1Nodes: Node[] = [
                reqABracket,
                reqABracketText,
                reqBBracket,
                reqBBracketText,
                wasteFrame,
                ...wasteInfo.nodes,
                reqCBlockedFrame,
                ...reqCBlockedText.nodes,
                ...ch1ALive,
                ...ch1AWaste,
                ...ch1BLive,
                ...ch1BWaste,
            ]

            // ================================================================
            // CHAPTER 2: PagedAttention Virtual-to-Physical Block Table
            // ================================================================
            s.chapter('PagedAttention block tables')

            const heading2 = makeHeading('PagedAttention allocates physical blocks on demand')
            const sub2 = makeSub(
                'Each request keeps a logical block table that points to any free physical slot',
            )
            const footer2 = makeFooter(
                'Live: 8 / 16 blocks   |   Wasted reservations: 0   |   Free: 8 blocks remaining',
                'green',
            )

            s.play(
                fadeOut(ch1Nodes),
                seq(fadeOut([heading, sub, footer]), fadeIn([heading2, sub2])),
                { duration: 1.0 },
            )
            heading = heading2
            sub = sub2

            // Helper to build a clean logical block table card
            interface LogicalCard {
                nodes: Node[]
                entryAnchors: Vec[]
            }

            const buildLogicalCard = (
                centerX: number,
                topY: number,
                titleText: string,
                color: string,
                entries: readonly { logical: string; physical: string }[],
            ): LogicalCard => {
                const entryW = 122
                const entryH = 90
                const entryGap = 16
                const innerW = entries.length * entryW + (entries.length - 1) * entryGap
                const cardW = innerW + 48
                const cardH = 168
                const cardCy = topY + cardH / 2

                const frame = rect(cardW, cardH, {
                    fill: 'surface',
                    stroke: color,
                    width: 2.8,
                    radius: 14,
                })
                    .at(centerX, cardCy)
                    .set('fillOpacity', 0.6)
                const titleNode = text(titleText, {
                    size: 29,
                    color,
                }).moveTo([centerX, topY + 28])

                const nodes: Node[] = [frame, titleNode]
                const entryAnchors: Vec[] = []
                const rowCy = topY + 106
                const startX = centerX - innerW / 2 + entryW / 2

                entries.forEach((e, idx) => {
                    const ex = startX + idx * (entryW + entryGap)
                    const box = rect(entryW, entryH, {
                        fill: color,
                        stroke: color,
                        width: 2.2,
                        radius: 8,
                    })
                        .at(ex, rowCy)
                        .set('fillOpacity', 0.14)
                    const lText = text(e.logical, {
                        font: 'mono',
                        size: 26,
                        color: 'ink',
                    }).moveTo([ex, rowCy - 18])
                    const pText = text(`-> ${e.physical}`, {
                        font: 'mono',
                        size: 26,
                        color,
                    }).moveTo([ex, rowCy + 18])
                    nodes.push(box, lText, pText)
                    entryAnchors.push([ex, rowCy + entryH / 2 + 4])
                })

                return { nodes, entryAnchors }
            }

            const cardTopY = -302
            const cardA = buildLogicalCard(-540, cardTopY, 'Req A Block Table', 'blue', [
                { logical: 'L0', physical: 'P5' },
                { logical: 'L1', physical: 'P1' },
                { logical: 'L2', physical: 'P9' },
            ])
            const cardB = buildLogicalCard(40, cardTopY, 'Req B Block Table', 'orange', [
                { logical: 'L0', physical: 'P12' },
                { logical: 'L1', physical: 'P3' },
            ])
            const cardC = buildLogicalCard(560, cardTopY, 'Req C Admitted!', 'green', [
                { logical: 'L0', physical: 'P7' },
                { logical: 'L1', physical: 'P14' },
                { logical: 'L2', physical: 'P11' },
            ])

            const makeMapArrow = (from: Vec, physIdx: number, color: string, bend = 0) => {
                const slot = slots[physIdx]!
                return arrow(from, [slot.cx, slot.topY - 6], {
                    stroke: color,
                    width: 4,
                    tip: 14,
                    pad: 4,
                    bend,
                })
            }

            const arrowsA = [
                makeMapArrow(cardA.entryAnchors[0]!, PAGED_A[0], 'blue', -18),
                makeMapArrow(cardA.entryAnchors[1]!, PAGED_A[1], 'blue', 14),
                makeMapArrow(cardA.entryAnchors[2]!, PAGED_A[2], 'blue', -22),
            ]
            const badgesA = PAGED_A.map((p, idx) => makeSlotBadge(p, `A·L${idx}`, 'live', 'blue'))

            const arrowsB = [
                makeMapArrow(cardB.entryAnchors[0]!, PAGED_B[0], 'orange', -14),
                makeMapArrow(cardB.entryAnchors[1]!, PAGED_B[1], 'orange', 20),
            ]
            const badgesB = PAGED_B.map((p, idx) =>
                makeSlotBadge(p, `B·L${idx}`, 'live', 'orange'),
            )

            const arrowsC = [
                makeMapArrow(cardC.entryAnchors[0]!, PAGED_C[0], 'green', 20),
                makeMapArrow(cardC.entryAnchors[1]!, PAGED_C[1], 'green', -10),
                makeMapArrow(cardC.entryAnchors[2]!, PAGED_C[2], 'green', 12),
            ]
            const badgesC = PAGED_C.map((p, idx) => makeSlotBadge(p, `C·L${idx}`, 'live', 'green'))

            s.caption(
                'Request A maps logical blocks L0, L1, L2 to non-contiguous physical slots P5, P1, and P9 as tokens arrive.',
                4.8,
            )
            s.play(fadeIn(cardA.nodes), { duration: 0.7 })
            for (let i = 0; i < 3; i++) {
                s.play(draw(arrowsA[i]!), fadeIn(badgesA[i]!), { duration: 0.75 })
            }
            s.wait(0.8)

            // Dim A's arrows subtly so B's mapping stays crystal clear
            s.caption(
                'Request B claims only the 2 physical blocks it needs (P12 and P3) with zero over-reservation.',
                3.6,
            )
            s.play(
                ...arrowsA.map((a) => to(a, (n) => n.opacity(0.24))),
                fadeIn(cardB.nodes),
                { duration: 0.6 },
            )
            s.play(
                lagged(
                    [0, 1].map((i) => par(draw(arrowsB[i]!), fadeIn(badgesB[i]!))),
                    { lag: 0.45 },
                ),
                { duration: 1.3 },
            )
            s.wait(0.7)

            s.caption(
                'Request C now fits cleanly into P7, P14, and P11, leaving 8 physical blocks still free.',
                4.2,
            )
            s.play(
                ...arrowsB.map((a) => to(a, (n) => n.opacity(0.24))),
                fadeIn(cardC.nodes),
                { duration: 0.6 },
            )
            s.play(
                lagged(
                    [0, 1, 2].map((i) => par(draw(arrowsC[i]!), fadeIn(badgesC[i]!))),
                    { lag: 0.35 },
                ),
                { duration: 1.5 },
            )
            s.play(fadeIn(footer2), { duration: 0.6 })
            footer = footer2
            s.wait(2.2)

            const ch2Nodes: Node[] = [
                ...cardA.nodes,
                ...cardB.nodes,
                ...cardC.nodes,
                ...arrowsA,
                ...arrowsB,
                ...arrowsC,
                ...badgesA.flat(),
                ...badgesB.flat(),
                ...badgesC.flat(),
            ]

            // ================================================================
            // CHAPTER 3: Copy-on-Write Prefix Sharing
            // ================================================================
            s.chapter('Copy-on-Write prefix sharing')

            const heading3 = makeHeading('Copy-on-Write shares identical prefixes safely')
            const sub3 = makeSub(
                'Shared prompt blocks stay read-only at refcount = 2 until generation diverges',
            )
            const footer3 = makeFooter(
                'Shared prompt: 2 blocks (ref=2)   |   Diverged outputs: 2 private blocks   |   4 total instead of 6',
                'teal',
            )

            s.play(
                fadeOut(ch2Nodes),
                seq(fadeOut([heading, sub, footer]), fadeIn([heading3, sub3])),
                { duration: 1.0 },
            )
            heading = heading3
            sub = sub3

            // Two symmetric request cards with Prompt L0, Prompt L1, and diverging L2
            const buildCowCard = (
                centerX: number,
                titleText: string,
                color: string,
                divPhys: string,
                divToken: string,
            ) => {
                const entryW = 148
                const entryH = 92
                const entryGap = 18
                const innerW = 3 * entryW + 2 * entryGap
                const cardW = innerW + 48
                const cardH = 172
                const topY = -302
                const cardCy = topY + cardH / 2
                const rowCy = topY + 108
                const startX = centerX - innerW / 2 + entryW / 2

                const frame = rect(cardW, cardH, {
                    fill: 'surface',
                    stroke: color,
                    width: 2.8,
                    radius: 14,
                })
                    .at(centerX, cardCy)
                    .set('fillOpacity', 0.6)
                const titleNode = text(titleText, { size: 30, color }).moveTo([centerX, topY + 28])

                const sharedNodes: Node[] = [frame, titleNode]
                const sharedAnchors: Vec[] = []

                COW_SHARED.forEach((p, idx) => {
                    const ex = startX + idx * (entryW + entryGap)
                    const box = rect(entryW, entryH, {
                        fill: 'teal',
                        stroke: 'teal',
                        width: 2.4,
                        radius: 8,
                    })
                        .at(ex, rowCy)
                        .set('fillOpacity', 0.16)
                    const lText = text(`L${idx} prompt`, {
                        size: 26,
                        color: 'ink',
                    }).moveTo([ex, rowCy - 18])
                    const pText = text(`-> P${p}`, {
                        font: 'mono',
                        size: 26,
                        color: 'teal',
                    }).moveTo([ex, rowCy + 18])
                    sharedNodes.push(box, lText, pText)
                    sharedAnchors.push([ex, rowCy + entryH / 2 + 4])
                })

                const divX = startX + 2 * (entryW + entryGap)
                const divBox = rect(entryW, entryH, {
                    fill: color,
                    stroke: color,
                    width: 2.8,
                    radius: 8,
                })
                    .at(divX, rowCy)
                    .set('fillOpacity', 0.18)
                const divLText = text(`L2 "${divToken}"`, {
                    size: 26,
                    color: 'ink',
                }).moveTo([divX, rowCy - 18])
                const divPText = text(`-> ${divPhys}`, {
                    font: 'mono',
                    size: 26,
                    color,
                }).moveTo([divX, rowCy + 18])

                return {
                    sharedNodes,
                    sharedAnchors,
                    divNodes: [divBox, divLText, divPText],
                    divAnchor: [divX, rowCy + entryH / 2 + 4] as Vec,
                }
            }

            const cowA = buildCowCard(-430, 'Request A (shared system prompt)', 'blue', 'P2', 'cat')
            const cowB = buildCowCard(430, 'Request B (same system prompt)', 'orange', 'P13', 'dog')

            // Shared physical blocks P5 and P10 glowing teal with ref=2
            const sharedBadges = COW_SHARED.map((p, idx) => {
                const slot = slots[p]!
                const fill = rect(cellW - 4, cellH - 4, {
                    fill: 'teal',
                    stroke: 'teal',
                    width: 4,
                    radius: 8,
                })
                    .at(slot.cx, slot.cy)
                    .set('fillOpacity', 0.28)
                    .glow(10)
                const t1 = text(`sys ${idx}`, { font: 'mono', size: 22, color: 'teal' }).moveTo([
                    slot.cx,
                    slot.cy - 20,
                ])
                const t2 = text('ref=2', { font: 'mono', size: 22, color: 'ink' }).moveTo([
                    slot.cx,
                    slot.cy + 18,
                ])
                return [fill, t1, t2]
            })

            const cowArrowsAShared = [
                makeMapArrow(cowA.sharedAnchors[0]!, COW_SHARED[0], 'teal', -14),
                makeMapArrow(cowA.sharedAnchors[1]!, COW_SHARED[1], 'teal', -20),
            ]
            const cowArrowsBShared = [
                makeMapArrow(cowB.sharedAnchors[0]!, COW_SHARED[0], 'teal', 20),
                makeMapArrow(cowB.sharedAnchors[1]!, COW_SHARED[1], 'teal', 14),
            ]

            const cowArrowADiv = makeMapArrow(cowA.divAnchor, COW_A_PRIVATE, 'blue', 22)
            const cowArrowBDiv = makeMapArrow(cowB.divAnchor, COW_B_PRIVATE, 'orange', -18)
            const cowBadgeA = makeSlotBadge(COW_A_PRIVATE, 'A·L2', 'ref=1', 'blue')
            const cowBadgeB = makeSlotBadge(COW_B_PRIVATE, 'B·L2', 'ref=1', 'orange')

            s.caption(
                'Two requests sharing one system prompt point both L0 and L1 to the same physical blocks (P5 and P10, refcount = 2).',
                4.8,
            )
            s.play(fadeIn([...cowA.sharedNodes, ...cowB.sharedNodes]), { duration: 0.8 })
            s.play(
                draw(cowArrowsAShared[0]!),
                draw(cowArrowsBShared[0]!),
                fadeIn(sharedBadges[0]!),
                { duration: 0.9 },
            )
            s.play(
                draw(cowArrowsAShared[1]!),
                draw(cowArrowsBShared[1]!),
                fadeIn(sharedBadges[1]!),
                { duration: 0.9 },
            )
            s.play(
                indicate(sharedBadges[0]!, { color: 'teal', scale: 1.1 }),
                indicate(sharedBadges[1]!, { color: 'teal', scale: 1.1 }),
                { duration: 1.0 },
            )
            s.wait(1.0)

            s.caption(
                'When generated tokens diverge at L2, Copy-on-Write allocates fresh private slots P2 and P13 without copying the shared prefix.',
                5.2,
            )
            s.play(
                fadeIn(cowA.divNodes),
                draw(cowArrowADiv),
                fadeIn(cowBadgeA),
                { duration: 1.0 },
            )
            s.play(
                fadeIn(cowB.divNodes),
                draw(cowArrowBDiv),
                fadeIn(cowBadgeB),
                { duration: 1.0 },
            )
            s.play(fadeIn(footer3), { duration: 0.7 })
            s.wait(3.2)
        },
    )
}
