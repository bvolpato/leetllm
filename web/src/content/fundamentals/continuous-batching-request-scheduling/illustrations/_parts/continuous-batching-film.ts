import {
    assertEqual,
    beside,
    column,
    delay,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    lanes,
    linear,
    place,
    rect,
    sceneKit,
    segmentedBar,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const SLOTS = 4
const TOTAL_STEPS = 6

const STATIC_REQUESTS = [
    { id: 'Req A', slot: 'Slot 1', start: 0, end: 2, color: 'blue' as const },
    { id: 'Req B', slot: 'Slot 2', start: 0, end: 5, color: 'teal' as const },
    { id: 'Req C', slot: 'Slot 3', start: 0, end: 3, color: 'purple' as const },
    { id: 'Req D', slot: 'Slot 4', start: 0, end: 6, color: 'orange' as const },
] as const

const QUEUED_REQUESTS = [
    { id: 'Req E', slot: 'Slot 1', start: 2, end: 6, color: 'green' as const, open: false },
    { id: 'Req F', slot: 'Slot 3', start: 3, end: 6, color: 'yellow' as const, open: false },
    { id: 'Req G', slot: 'Slot 2', start: 5, end: 6, color: 'blue' as const, open: true },
] as const

const STEP_BUDGET = 1024
const DECODE_TOKENS = 96
const PROMPT_TOKENS = 1800
const CHUNK_1 = STEP_BUDGET - DECODE_TOKENS
const CHUNK_2 = PROMPT_TOKENS - CHUNK_1

function activeSlotsAt(t: number, continuous: boolean): number {
    const spans = continuous ? [...STATIC_REQUESTS, ...QUEUED_REQUESTS] : [...STATIC_REQUESTS]
    let active = 0
    for (const span of spans) {
        if (t >= span.start && t < span.end) active++
    }
    return Math.min(SLOTS, active)
}

function cumulativeWork(t: number, continuous: boolean): { useful: number; capacity: number } {
    const clamped = Math.max(0, Math.min(TOTAL_STEPS, t))
    const spans = continuous ? [...STATIC_REQUESTS, ...QUEUED_REQUESTS] : [...STATIC_REQUESTS]
    let useful = 0
    for (const span of spans) {
        const covered = Math.max(0, Math.min(clamped, span.end) - span.start)
        useful += covered
    }
    return { useful, capacity: clamped * SLOTS }
}

export function createFilm(theme: ThemeMode = 'dark') {
    return film(
        {
            title: 'Continuous batching and chunked prefill',
            description:
                'Watch static batching waste GPU slots on idle bubbles, then see iteration-level scheduling and chunked prefill keep every lane full.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const staticFinal = cumulativeWork(TOTAL_STEPS, false)
            const continuousFinal = cumulativeWork(TOTAL_STEPS, true)
            assertEqual(staticFinal.useful, 16, 'static batching useful slot-steps')
            assertEqual(staticFinal.capacity, 24, 'total slot-steps in 6 iterations')
            assertEqual(continuousFinal.useful, 24, 'continuous batching useful slot-steps')
            assertEqual(CHUNK_1, 928, 'first prefill chunk inside 1,024 budget')
            assertEqual(CHUNK_2, 872, 'second prefill chunk remaining')
            assertEqual(DECODE_TOKENS + CHUNK_2, 968, 'step 2 total tokens')

            const kit = sceneKit({
                size: 36,
                heading: { size: 58, y: -468, align: 'center' },
                area: { left: -880, right: 880, top: -370, bottom: 420 },
            })

            const [mainCol, sideCol] = kit.area.columns([2.25, 1], 56)
            const laneNames = ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4']

            // ── Chapter 1: Static Batching ──────────────────────────────────

            const h1 = kit.heading('Static batching: fast requests stall their lanes')

            const staticEvents = [
                { lane: 'Slot 1', start: 0, end: 2, label: 'Req A (2)', color: 'blue' as const },
                {
                    lane: 'Slot 1',
                    start: 2,
                    end: 6,
                    down: true,
                    label: 'idle bubble',
                    color: 'red' as const,
                },
                { lane: 'Slot 2', start: 0, end: 5, label: 'Req B (5)', color: 'teal' as const },
                {
                    lane: 'Slot 2',
                    start: 5,
                    end: 6,
                    down: true,
                    label: 'idle',
                    color: 'red' as const,
                },
                { lane: 'Slot 3', start: 0, end: 3, label: 'Req C (3)', color: 'purple' as const },
                {
                    lane: 'Slot 3',
                    start: 3,
                    end: 6,
                    down: true,
                    label: 'idle bubble',
                    color: 'red' as const,
                },
                { lane: 'Slot 4', start: 0, end: 6, label: 'Req D (6)', color: 'orange' as const },
            ]

            const staticLanes = lanes(laneNames, staticEvents, {
                width: 980,
                pitch: 118,
                barHeight: 58,
                size: 30,
                domain: [0, TOTAL_STEPS],
                ticks: [0, 1, 2, 3, 4, 5, 6],
                format: (t) => `t=${t}`,
                axisLabel: 'decode step (all 4 slots locked until slowest finishes)',
            })
            place(staticLanes, mainCol!, 'center')

            const staticClock = s.value(0)
            const staticPanelVis = s.value(0)

            const meterWidth = 420
            const sideCenterX = sideCol!.cx
            const panelTop = -315

            const staticSidePanel = dynamic(() => {
                const alpha = staticPanelVis.value
                if (alpha <= 0.01) return []
                const t = staticClock.value
                const { useful, capacity } = cumulativeWork(t, false)
                const utilPct = capacity > 0.001 ? (useful / capacity) * 100 : 100
                const activeNow = t >= TOTAL_STEPS ? 0 : activeSlotsAt(Math.min(t, TOTAL_STEPS - 0.001), false)
                const wasted = Math.max(0, capacity - useful)
                const utilColor = utilPct >= 95 ? 'green' : utilPct >= 78 ? 'orange' : 'red'
                const fillW = Math.max(4, (meterWidth * utilPct) / 100)

                const items: Node[] = [
                    // Queue card
                    rect(480, 290, { fill: 'surface', stroke: 'grid', width: 2, radius: 14 })
                        .at(sideCenterX, panelTop + 145)
                        .opacity(alpha),
                    text('Waiting queue (blocked)', { size: 32, color: 'orange' })
                        .moveTo([sideCenterX, panelTop + 42])
                        .opacity(alpha),
                    ...QUEUED_REQUESTS.map((req, idx) => {
                        const y = panelTop + 112 + idx * 66
                        return [
                            rect(410, 48, {
                                fill: 'bg',
                                stroke: t >= 2 ? 'red' : 'dim',
                                width: 2,
                                radius: 10,
                            })
                                .at(sideCenterX, y)
                                .opacity(alpha),
                            text(`${req.id}  (waiting since t=0)`, {
                                size: 28,
                                color: t >= 2 ? 'red' : 'ink',
                            })
                                .moveTo([sideCenterX, y])
                                .opacity(alpha),
                        ]
                    }).flat(),

                    // Utilization card
                    rect(480, 320, { fill: 'surface', stroke: 'grid', width: 2, radius: 14 })
                        .at(sideCenterX, panelTop + 490)
                        .opacity(alpha),
                    text('GPU utilization', { size: 32, color: 'dim' })
                        .moveTo([sideCenterX, panelTop + 372])
                        .opacity(alpha),
                    text(`${utilPct.toFixed(1)}%`, { size: 64, color: utilColor, font: 'mono' })
                        .moveTo([sideCenterX, panelTop + 444])
                        .opacity(alpha),
                    rect(meterWidth, 22, { fill: 'grid', stroke: null, radius: 6 })
                        .at(sideCenterX, panelTop + 506)
                        .opacity(alpha),
                    rect(fillW, 22, { fill: utilColor, stroke: null, radius: 6 })
                        .at(sideCenterX - meterWidth / 2 + fillW / 2, panelTop + 506)
                        .opacity(alpha),
                    text(
                        t >= TOTAL_STEPS - 0.05
                            ? `Useful work: ${useful.toFixed(0)} / 24 tokens`
                            : `Active now: ${activeNow} / ${SLOTS} slots`,
                        { size: 28, color: 'ink' },
                    )
                        .moveTo([sideCenterX, panelTop + 560])
                        .opacity(alpha),
                    text(
                        `Wasted bubbles: ${wasted.toFixed(0)} slot-steps`,
                        { size: 28, color: wasted > 0.4 ? 'red' : 'dim' },
                    )
                        .moveTo([sideCenterX, panelTop + 608])
                        .opacity(alpha),
                ]
                return items
            })

            s.chapter('Static batching wastes freed slots')
            s.add(h1, staticLanes, staticSidePanel)
            s.play(staticPanelVis.to(1), { duration: 0.6 })
            s.caption(
                'Four requests start together in one static GPU batch. Each slot generates one token per iteration.',
                4.5,
            )
            s.play(
                staticLanes.advance(2),
                staticClock.to(2, { ease: linear }),
                { duration: 2.6 },
            )
            s.wait(1.2)

            s.caption(
                'Req A hits EOS at step 2, but static batching holds the slot idle while Req E sits stuck in the queue.',
                5.0,
            )
            s.play(
                staticLanes.advance(3),
                staticClock.to(3, { ease: linear }),
                { duration: 2.2 },
            )
            s.wait(1.4)

            s.caption(
                'Req C finishes at step 3. Now half the GPU slots burn cycles as idle bubbles waiting for slow Req D.',
                5.0,
            )
            s.play(
                staticLanes.advance(5),
                staticClock.to(5, { ease: linear }),
                { duration: 2.8 },
            )
            s.wait(1.0)

            s.caption(
                'By step 6, only 16 of 24 slot-steps did useful work (66.7%). Every queued request waited for the full batch.',
                5.5,
            )
            s.play(
                staticLanes.advance(6),
                staticClock.to(6, { ease: linear }),
                { duration: 1.8 },
            )
            s.wait(3.2)

            // ── Chapter 2: Continuous Batching ──────────────────────────────

            const h2 = kit.heading('Continuous batching: refill slots every iteration')

            const contEvents = [
                { lane: 'Slot 1', start: 0, end: 2, label: 'Req A (2)', color: 'blue' as const },
                { lane: 'Slot 1', start: 2, end: 6, label: 'Req E (4)', color: 'green' as const },
                { lane: 'Slot 2', start: 0, end: 5, label: 'Req B (5)', color: 'teal' as const },
                {
                    lane: 'Slot 2',
                    start: 5,
                    end: 6,
                    label: 'Req G',
                    color: 'blue' as const,
                    open: true,
                },
                { lane: 'Slot 3', start: 0, end: 3, label: 'Req C (3)', color: 'purple' as const },
                { lane: 'Slot 3', start: 3, end: 6, label: 'Req F (3)', color: 'yellow' as const },
                { lane: 'Slot 4', start: 0, end: 6, label: 'Req D (6)', color: 'orange' as const },
            ]

            const contLanes = lanes(laneNames, contEvents, {
                width: 980,
                pitch: 118,
                barHeight: 58,
                size: 30,
                domain: [0, TOTAL_STEPS],
                ticks: [0, 1, 2, 3, 4, 5, 6],
                format: (t) => `t=${t}`,
                axisLabel: 'decode step (scheduler admits waiting work on any EOS)',
            })
            place(contLanes, mainCol!, 'center')

            const contClock = s.value(0)
            const contPanelVis = s.value(0)

            const contSidePanel = dynamic(() => {
                const alpha = contPanelVis.value
                if (alpha <= 0.01) return []
                const t = contClock.value
                const { useful, capacity } = cumulativeWork(t, true)
                const utilPct = capacity > 0.001 ? (useful / capacity) * 100 : 100
                const fillW = Math.max(4, (meterWidth * utilPct) / 100)

                const items: Node[] = [
                    // Live draining queue card
                    rect(480, 290, { fill: 'surface', stroke: 'grid', width: 2, radius: 14 })
                        .at(sideCenterX, panelTop + 145)
                        .opacity(alpha),
                    text('Waiting queue (live)', { size: 32, color: 'green' })
                        .moveTo([sideCenterX, panelTop + 42])
                        .opacity(alpha),
                    ...QUEUED_REQUESTS.map((req, idx) => {
                        const y = panelTop + 112 + idx * 66
                        const admitted = t >= req.start + 0.05
                        return [
                            rect(410, 48, {
                                fill: 'bg',
                                stroke: admitted ? 'green' : req.color,
                                width: 2,
                                radius: 10,
                            })
                                .at(sideCenterX, y)
                                .opacity(admitted ? alpha * 0.55 : alpha),
                            text(
                                admitted
                                    ? `${req.id} -> ${req.slot} at t=${req.start}`
                                    : `${req.id}  (ready in queue)`,
                                {
                                    size: 28,
                                    color: admitted ? 'green' : 'ink',
                                },
                            )
                                .moveTo([sideCenterX, y])
                                .opacity(alpha),
                        ]
                    }).flat(),

                    // Utilization + speedup card
                    rect(480, 320, { fill: 'surface', stroke: 'green', width: 2, radius: 14 })
                        .at(sideCenterX, panelTop + 490)
                        .opacity(alpha),
                    text('GPU utilization', { size: 32, color: 'dim' })
                        .moveTo([sideCenterX, panelTop + 372])
                        .opacity(alpha),
                    text(`${utilPct.toFixed(1)}%`, { size: 64, color: 'green', font: 'mono' })
                        .moveTo([sideCenterX, panelTop + 444])
                        .opacity(alpha),
                    rect(meterWidth, 22, { fill: 'grid', stroke: null, radius: 6 })
                        .at(sideCenterX, panelTop + 506)
                        .opacity(alpha),
                    rect(fillW, 22, { fill: 'green', stroke: null, radius: 6 })
                        .at(sideCenterX - meterWidth / 2 + fillW / 2, panelTop + 506)
                        .opacity(alpha),
                    text(`Useful work: ${useful.toFixed(0)} / 24 tokens`, {
                        size: 28,
                        color: 'ink',
                    })
                        .moveTo([sideCenterX, panelTop + 560])
                        .opacity(alpha),
                    text(
                        t >= 5.9 ? '+50% throughput vs static (16 -> 24)' : 'Zero idle bubbles',
                        { size: 28, color: 'green' },
                    )
                        .moveTo([sideCenterX, panelTop + 608])
                        .opacity(alpha),
                ]
                return items
            })

            s.chapter('Iteration-level continuous batching')
            s.add(contSidePanel)
            s.play(
                fadeOut([h1, staticLanes], { duration: 0.2 }),
                staticPanelVis.to(0, { duration: 0.2 }),
                delay(fadeIn([h2, contLanes], { duration: 0.45 }), 0.22),
                delay(contPanelVis.to(1, { duration: 0.45 }), 0.22),
            )
            s.caption(
                'Now replay the exact same requests with iteration-level scheduling. At step 2, Req A finishes.',
                4.5,
            )
            s.play(
                contLanes.advance(2),
                contClock.to(2, { ease: linear }),
                { duration: 2.0 },
            )
            s.wait(0.8)

            s.caption(
                'Req E enters Slot 1 immediately on the next step. At step 3, Req C finishes and Req F takes Slot 3.',
                5.0,
            )
            s.play(
                contLanes.advance(3),
                contClock.to(3, { ease: linear }),
                { duration: 1.8 },
            )
            s.wait(1.0)
            s.play(
                contLanes.advance(5),
                contClock.to(5, { ease: linear }),
                { duration: 2.4 },
            )
            s.wait(0.6)

            s.caption(
                'At step 5, Req G fills Slot 2. Continuous batching achieves 24 of 24 active slot-steps (100%), a 50% throughput gain.',
                6.0,
            )
            s.play(
                contLanes.advance(6),
                contClock.to(6, { ease: linear }),
                { duration: 1.8 },
            )
            s.wait(3.8)

            // ── Chapter 3: Chunked Prefill ──────────────────────────────────

            const h3 = kit.heading('Chunked prefill: keep decode latency smooth')
            const [topBand, bottomBand] = kit.area.rows([1.15, 1], 44)

            const prefillCompare = lanes(
                ['Unchunked', 'Chunked'],
                [
                    {
                        lane: 'Unchunked',
                        start: 0,
                        end: 2.4,
                        label: '1,800-token prefill (decode stalled!)',
                        color: 'red' as const,
                    },
                    {
                        lane: 'Unchunked',
                        start: 2.4,
                        end: 3.4,
                        label: 'decode',
                        color: 'teal' as const,
                    },
                    {
                        lane: 'Unchunked',
                        start: 3.4,
                        end: 4.4,
                        label: 'decode',
                        color: 'teal' as const,
                    },
                    {
                        lane: 'Chunked',
                        start: 0,
                        end: 1,
                        label: '96 dec + 928 pre',
                        color: 'blue' as const,
                    },
                    {
                        lane: 'Chunked',
                        start: 1,
                        end: 2,
                        label: '96 dec + 872 pre',
                        color: 'blue' as const,
                    },
                    {
                        lane: 'Chunked',
                        start: 2,
                        end: 3,
                        label: 'decode',
                        color: 'teal' as const,
                    },
                    {
                        lane: 'Chunked',
                        start: 3,
                        end: 4.4,
                        label: 'decode',
                        color: 'teal' as const,
                        open: true,
                    },
                ],
                {
                    width: 1380,
                    pitch: 122,
                    barHeight: 62,
                    size: 30,
                    domain: [0, 4.4],
                    ticks: [0, 1, 2, 3, 4],
                    format: (t) => `step ${t}`,
                    axisLabel: 'iteration timeline when a 1,800-token prompt arrives',
                },
            )
            place(prefillCompare, topBand!, 'center')

            const stepBudgetBar = segmentedBar(
                [
                    { name: 'decode', value: DECODE_TOKENS, color: 'teal' },
                    { name: 'prefill chunk 1', value: CHUNK_1, color: 'blue' },
                ],
                {
                    width: 1460,
                    height: 68,
                    capacity: STEP_BUDGET,
                    max: STEP_BUDGET,
                    title: 'Step token budget (1,024-position cap)',
                    free: 'free',
                    size: 30,
                },
            )
            const takeaway = text(
                'Bounded chunks protect inter-token latency while keeping GPU utilization high.',
                { size: 32, color: 'green' },
            )
            const budgetBlock = column([stepBudgetBar, takeaway], { gap: 36 })
            place(budgetBlock, bottomBand!, 'center')

            const step2Label = text('Step 2: 96 decode + 872 remaining prefill (56 free)', {
                size: 30,
                color: 'blue',
            })
            beside(step2Label, stepBudgetBar, 'above', 22)

            s.chapter('Chunked prefill prevents decode stalls')
            s.play(
                fadeOut([h2, contLanes], { duration: 0.2 }),
                contPanelVis.to(0, { duration: 0.2 }),
                delay(fadeIn([h3, prefillCompare], { duration: 0.45 }), 0.22),
                delay(stepBudgetBar.enter({ duration: 0.65 }), 0.22),
            )
            s.caption(
                'When a 1,800-token prompt arrives, running the full prefill at once stalls every active decode stream.',
                5.0,
            )
            s.play(prefillCompare.advance(2.4), { duration: 3.0 })
            s.wait(1.4)

            s.caption(
                'Chunked prefill caps each step at 1,024 tokens: 96 decode tokens run alongside the first 928 prompt tokens.',
                5.5,
            )
            s.play(
                stepBudgetBar.remove('prefill chunk 1'),
                stepBudgetBar.insert({ name: 'prefill chunk 2', value: CHUNK_2, color: 'blue' }),
                fadeIn(step2Label),
                { duration: 1.8 },
            )
            s.play(prefillCompare.advance(4.4), { duration: 2.2 })
            s.play(fadeIn(takeaway), { duration: 0.7 })
            s.caption(
                'The next step finishes the remaining 872 prompt tokens while decode keeps streaming smoothly with zero stall.',
                5.5,
            )
            s.wait(4.5)
        },
    )
}

export default createFilm()
