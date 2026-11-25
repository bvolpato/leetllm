import {
    assertEqual,
    dynamic,
    film,
    indicate,
    line,
    place,
    rect,
    sceneArea,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

interface Slot {
    label: string
    color: string
    kind: 'live' | 'trapped' | 'free'
    stage: number
}

const FIXED_SLOTS: Slot[] = [
    { label: 'A1', color: 'blue', kind: 'live', stage: 1 },
    { label: 'A2', color: 'blue', kind: 'live', stage: 1 },
    { label: 'A3', color: 'blue', kind: 'live', stage: 1 },
    { label: '×', color: 'red', kind: 'trapped', stage: 1 },
    { label: '×', color: 'red', kind: 'trapped', stage: 1 },
    { label: '×', color: 'red', kind: 'trapped', stage: 1 },
    { label: 'B1', color: 'purple', kind: 'live', stage: 2 },
    { label: 'B2', color: 'purple', kind: 'live', stage: 2 },
    { label: 'B3', color: 'purple', kind: 'live', stage: 2 },
    { label: 'B4', color: 'purple', kind: 'live', stage: 2 },
    { label: '×', color: 'red', kind: 'trapped', stage: 2 },
    { label: '×', color: 'red', kind: 'trapped', stage: 2 },
    { label: 'C1', color: 'teal', kind: 'live', stage: 3 },
    { label: 'C2', color: 'teal', kind: 'live', stage: 3 },
    { label: '×', color: 'red', kind: 'trapped', stage: 3 },
    { label: '×', color: 'red', kind: 'trapped', stage: 3 },
    { label: '×', color: 'red', kind: 'trapped', stage: 3 },
    { label: '×', color: 'red', kind: 'trapped', stage: 3 },
]

const PAGED_SLOTS: Slot[] = [
    { label: 'A1', color: 'blue', kind: 'live', stage: 1 },
    { label: 'A2', color: 'blue', kind: 'live', stage: 1 },
    { label: 'A3', color: 'blue', kind: 'live', stage: 1 },
    { label: 'B1', color: 'purple', kind: 'live', stage: 2 },
    { label: 'B2', color: 'purple', kind: 'live', stage: 2 },
    { label: 'B3', color: 'purple', kind: 'live', stage: 2 },
    { label: 'B4', color: 'purple', kind: 'live', stage: 2 },
    { label: 'C1', color: 'teal', kind: 'live', stage: 3 },
    { label: 'C2', color: 'teal', kind: 'live', stage: 3 },
    { label: 'D1', color: 'green', kind: 'live', stage: 4 },
    { label: 'D2', color: 'green', kind: 'live', stage: 4 },
    { label: 'D3', color: 'green', kind: 'live', stage: 4 },
    { label: 'E1', color: 'orange', kind: 'live', stage: 5 },
    { label: 'E2', color: 'orange', kind: 'live', stage: 5 },
    { label: '', color: 'dim', kind: 'free', stage: 99 },
    { label: '', color: 'dim', kind: 'free', stage: 99 },
    { label: '', color: 'dim', kind: 'free', stage: 99 },
    { label: '', color: 'dim', kind: 'free', stage: 99 },
]

export function createFilm(theme: ThemeMode = 'dark') {
    const fixedLive = FIXED_SLOTS.filter((s) => s.kind === 'live').length
    const fixedTrapped = FIXED_SLOTS.filter((s) => s.kind === 'trapped').length
    const pagedLive = PAGED_SLOTS.filter((s) => s.kind === 'live').length
    const pagedFree = PAGED_SLOTS.filter((s) => s.kind === 'free').length
    assertEqual(fixedLive, 9, 'Fixed live blocks')
    assertEqual(fixedTrapped, 9, 'Fixed trapped blocks')
    assertEqual(pagedLive, 14, 'Paged live blocks')
    assertEqual(pagedFree, 4, 'Paged free blocks')

    return film(
        {
            title: 'Fixed KV reservations vs. on-demand PagedAttention',
            description:
                'Watch five requests arrive into the same 18-block KV pool under fixed six-block reservations versus on-demand paging.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const headingArea = sceneArea({ left: -860, right: 860, top: -480, bottom: -390 })
            const title = place(
                text('Same 18-block KV pool: fixed vs. paged allocation', {
                    size: 52,
                    color: 'ink',
                }),
                headingArea,
                'center',
            )

            const leftCx = -440
            const rightCx = 440
            const gridTop = -230
            const cell = 112
            const gap = 14
            const totalW = 6 * cell + 5 * gap

            const leftHead = text('Fixed: 6 blocks / request', {
                size: 36,
                color: 'ink',
            }).moveTo([leftCx, -305])
            const rightHead = text('On demand: paged blocks', {
                size: 36,
                color: 'ink',
            }).moveTo([rightCx, -305])

            const divider = line([0, -330], [0, 310], {
                stroke: 'dim',
                width: 2,
                dash: [8, 8],
            }).opacity(0.45)

            const step = s.value(0)

            const buildGrid = (cx: number, slots: Slot[], isFixed: boolean): Node[] => {
                const startX = cx - totalW / 2
                const nodes: Node[] = []
                const cur = step.value

                let liveCount = 0
                let trappedCount = 0
                for (let idx = 0; idx < slots.length; idx++) {
                    const slot = slots[idx]!
                    const r = Math.floor(idx / 6)
                    const col = idx % 6
                    const x = startX + col * (cell + gap) + cell / 2
                    const y = gridTop + r * (cell + gap) + cell / 2

                    const active = cur >= slot.stage - 0.15
                    if (active && slot.kind === 'live') liveCount++
                    if (active && slot.kind === 'trapped') trappedCount++

                    if (!active || slot.kind === 'free') {
                        nodes.push(
                            rect(cell, cell, {
                                fill: 'surface',
                                stroke: 'dim',
                                width: 2,
                                radius: 12,
                            })
                                .opacity(0.42)
                                .moveTo([x, y]),
                        )
                    } else if (slot.kind === 'trapped') {
                        const alpha = Math.min(1, Math.max(0, (cur - (slot.stage - 0.15)) / 0.4))
                        nodes.push(
                            rect(cell, cell, {
                                fill: 'red',
                                stroke: 'red',
                                width: 2.2,
                                dash: [8, 6],
                                radius: 12,
                            })
                                .opacity(0.22 * alpha)
                                .moveTo([x, y]),
                        )
                        nodes.push(
                            rect(cell, cell, {
                                fill: null,
                                stroke: 'red',
                                width: 2.2,
                                dash: [8, 6],
                                radius: 12,
                            })
                                .opacity(0.85 * alpha)
                                .moveTo([x, y]),
                        )
                        nodes.push(
                            text('trapped', { size: 24, color: 'red' })
                                .opacity(alpha)
                                .moveTo([x, y]),
                        )
                    } else {
                        const alpha = Math.min(1, Math.max(0, (cur - (slot.stage - 0.15)) / 0.35))
                        nodes.push(
                            rect(cell, cell, {
                                fill: slot.color,
                                stroke: slot.color,
                                width: 3,
                                radius: 12,
                            })
                                .opacity(0.28 * alpha)
                                .moveTo([x, y]),
                        )
                        nodes.push(
                            rect(cell, cell, {
                                fill: null,
                                stroke: slot.color,
                                width: 3,
                                radius: 12,
                            })
                                .opacity(alpha)
                                .moveTo([x, y]),
                        )
                        nodes.push(
                            text(slot.label, { size: 32, color: slot.color })
                                .opacity(alpha)
                                .moveTo([x, y]),
                        )
                    }
                }

                // Live counter readout below each pool
                const freeCount = 18 - liveCount - trappedCount
                const statusText = isFixed
                    ? `${liveCount} live · ${trappedCount} trapped · ${freeCount} free`
                    : `${liveCount} live · ${freeCount} free`
                const statusColor = isFixed && trappedCount > 0 ? 'red' : liveCount > 0 ? 'green' : 'dim'
                nodes.push(
                    text(statusText, { size: 30, color: statusColor }).moveTo([cx, 195]),
                )

                // Show waiting badge on left vs admitted badge on right once D & E arrive
                if (cur >= 3.85) {
                    const badgeAlpha = Math.min(1, (cur - 3.85) / 0.35)
                    const label = isFixed
                        ? cur >= 4.85
                            ? 'D & E blocked (0 free slots)'
                            : 'D blocked (0 free slots)'
                        : cur >= 4.85
                          ? 'All 5 requests (A–E) fit!'
                          : 'D admitted into free pages'
                    const col = isFixed ? 'red' : 'green'
                    nodes.push(
                        rect(520, 62, {
                            fill: col,
                            stroke: col,
                            width: 2.5,
                            radius: 31,
                        })
                            .opacity(0.16 * badgeAlpha)
                            .moveTo([cx, 275]),
                    )
                    nodes.push(
                        text(label, { size: 30, color: col })
                            .opacity(badgeAlpha)
                            .moveTo([cx, 275]),
                    )
                }

                return nodes
            }

            const gridsLayer = dynamic(() => [
                ...buildGrid(leftCx, FIXED_SLOTS, true),
                ...buildGrid(rightCx, PAGED_SLOTS, false),
            ])

            const arrivalBanner = dynamic(() => {
                const cur = step.value
                if (cur < 0.5) return []
                const msg =
                    cur < 1.5
                        ? 'Incoming: Request A (3 KV blocks)'
                        : cur < 2.5
                          ? 'Incoming: Request B (4 KV blocks)'
                          : cur < 3.5
                            ? 'Incoming: Request C (2 KV blocks)'
                            : cur < 4.5
                              ? 'Incoming: Request D (3 KV blocks)'
                              : 'Incoming: Request E (2 KV blocks)'
                return [text(msg, { size: 32, color: 'ink' }).moveTo([0, -370])]
            })

            s.chapter('Empty 18-block KV pool')
            s.add(title, leftHead, rightHead, divider, gridsLayer, arrivalBanner)
            s.caption(
                'Both allocators start with the exact same 18-block physical KV pool.',
                3.0,
            )
            s.wait(2.5)

            s.chapter('Requests A, B, and C arrive')
            s.caption(
                'Request A needs 3 blocks. Fixed allocation reserves 6 contiguous blocks, trapping 3.',
                3.5,
            )
            s.play(step.to(1), { duration: 1.4 })
            s.wait(2.0)

            s.caption(
                'Request B needs 4 blocks (trapping 2) and Request C needs 2 blocks (trapping 4).',
                4.2,
            )
            s.play(step.to(2), { duration: 1.4 })
            s.wait(0.8)
            s.play(step.to(3), { duration: 1.4 })
            s.wait(1.2)

            s.chapter('Fixed pool saturates while paged pool admits D and E')
            s.caption(
                'All 18 fixed slots are claimed (9 live, 9 trapped), so Request D must wait. Paging packs D directly into free blocks.',
                4.5,
            )
            s.play(step.to(4), { duration: 1.5 })
            s.wait(2.4)

            s.caption(
                'Request E fits too: 14 live blocks and 4 still free across five concurrent requests.',
                4.5,
            )
            s.play(step.to(5), { duration: 1.5 })
            s.play(indicate(rightHead), { duration: 0.7 })
            s.wait(3.2)
        },
    )
}

export default createFilm()
