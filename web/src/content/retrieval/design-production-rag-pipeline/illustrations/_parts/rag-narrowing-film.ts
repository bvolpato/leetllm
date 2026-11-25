import {
    arrow,
    assertEqual,
    column,
    decimal,
    draw,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    line,
    place,
    polygon,
    rect,
    sceneArea,
    sceneKit,
    seq,
    text,
    type Vec,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

interface StageDef {
    readonly id: string
    readonly name: string
    readonly sub: string
    readonly count: number
    readonly countText: string
    readonly latencyMs: number
    readonly latencyText: string
    readonly invariant: string
    readonly color: 'dim' | 'purple' | 'teal' | 'gold' | 'green'
    readonly customWidthFrac?: number
}

const STAGES: readonly StageDef[] = [
    {
        id: 'corpus',
        name: '0. Corpus Index',
        sub: 'All indexed chunks',
        count: 100_000,
        countText: '100,000 chunks',
        latencyMs: 0,
        latencyText: 'Offline',
        invariant: 'Versioned bundle',
        color: 'dim',
    },
    {
        id: 'acl',
        name: '1. ACL Pre-Filter',
        sub: 'Tenant, group, rev',
        count: 18_000,
        countText: '18,000 eligible',
        latencyMs: 2,
        latencyText: '2 ms',
        invariant: 'Privacy boundary',
        color: 'purple',
    },
    {
        id: 'rrf',
        name: '2. Hybrid RRF',
        sub: 'BM25 + dense search',
        count: 50,
        countText: '50 candidates',
        latencyMs: 18,
        latencyText: '18 ms',
        invariant: 'High recall',
        color: 'teal',
    },
    {
        id: 'rerank',
        name: '3. Rerank + Parent',
        sub: 'Cross-encoder top-5',
        count: 5,
        countText: '5 parents',
        latencyMs: 35,
        latencyText: '35 ms',
        invariant: 'High precision',
        color: 'gold',
    },
    {
        id: 'pack',
        name: '4. Context Pack',
        sub: 'Pack [E1]..[E5] to LLM',
        count: 1_800,
        countText: '1,800 prompt tok',
        latencyMs: 320,
        latencyText: '320 ms',
        invariant: 'Cited or abstain',
        color: 'green',
        customWidthFrac: 0.7,
    },
]

export function createFilm(theme: ThemeMode = 'dark') {
    const totalLatency = STAGES.reduce((acc, s) => acc + s.latencyMs, 0)
    assertEqual(totalLatency, 375, 'End-to-end RAG TTFT equals 375 ms')
    assertEqual(STAGES[0]!.count / STAGES[3]!.count, 20_000, 'Candidate reduction factor is 20,000x')

    return film(
        {
            title: 'Production RAG candidate narrowing funnel',
            description:
                'Watch 100,000 indexed chunks narrow through ACL pre-filtering (18,000), hybrid BM25+dense RRF (50), cross-encoder reranking (5 parents), and 1,800 packed prompt tokens.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 48,
                heading: { size: 54, align: 'center' },
                area: { top: -375, bottom: 430 },
            })
            const [funnelArea, panelArea] = kit.area.columns([2.15, 1], 44)
            const heading = kit.heading('Production RAG: Log-Scale Narrowing Funnel')

            const labelColRight = funnelArea!.left + 320
            const barLeft = labelColRight + 24
            const barMaxW = funnelArea!.right - barLeft - 24
            const barH = 82
            const rowYs = [-240, -108, 24, 156, 304] as const

            const stageW = (st: StageDef) =>
                st.customWidthFrac !== undefined
                    ? barMaxW * st.customWidthFrac
                    : Math.max(76, (Math.log10(st.count) / 5) * barMaxW)

            // Log10 vertical gridlines & tick labels
            const gridNodes = []
            const tickExps = [
                { exp: 0, lbl: '1' },
                { exp: 1, lbl: '10' },
                { exp: 2, lbl: '100' },
                { exp: 3, lbl: '1k' },
                { exp: 4, lbl: '10k' },
                { exp: 5, lbl: '100k' },
            ]
            for (const tk of tickExps) {
                const gx = barLeft + (tk.exp / 5) * barMaxW
                gridNodes.push(
                    line([gx, -298], [gx, 212], {
                        stroke: 'grid',
                        width: 1.5,
                        dash: [6, 6],
                        opacity: 0.45,
                    }),
                    text(tk.lbl, { size: 26, color: 'dim' }).moveTo([gx, -324]),
                )
            }

            // Right-hand telemetry panel
            const panelCard = rect(panelArea!.width, panelArea!.height, {
                fill: 'surface',
                stroke: 'gridStrong',
                width: 2,
                radius: 18,
            })
                .at(panelArea!.cx, panelArea!.cy)
                .set('fillOpacity', theme === 'light' ? 0.65 : 0.45)

            const innerPanel = panelArea!.inset(30)
            const [stageBox, countBox, latBox, invBox] = innerPanel.rows([1.0, 1.15, 1.15, 1.1], 18)

            const makePhase = (t1: string, t2: string, color: 'dim' | 'purple' | 'teal' | 'gold' | 'green') =>
                place(
                    column(
                        [text(t1, { size: 34, color }), text(t2, { size: 26, color: 'dim' })],
                        { gap: 10, align: 'center' },
                    ),
                    stageBox!,
                    'center',
                )

            const phaseNodes = [
                makePhase('Stage 0: Index', '100k chunks on disk', 'dim'),
                makePhase('Stage 1: ACL Filter', 'Pre-filter before score', 'purple'),
                makePhase('Stage 2: Hybrid RRF', 'BM25 + dense recall', 'teal'),
                makePhase('Stage 3: Rerank', 'Cross-encoder top-5', 'gold'),
                makePhase('Stage 4: Pack LLM', '1,800 grounded tokens', 'green'),
            ]

            // Live candidate pool & cumulative latency values
            const poolVal = s.value(100_000)
            const latVal = s.value(0)

            const countTitle = text('Active candidates', { size: 26, color: 'dim' })
            const countReadout = decimal(() => Math.round(poolVal.value), {
                digits: 0,
                size: 56,
                color: 'teal',
            })
            const countCol = place(
                column([countTitle, countReadout], { gap: 10, align: 'center' }),
                countBox!,
                'center',
            )

            const latTitle = text('Cumulative TTFT', { size: 26, color: 'dim' })
            const latReadout = decimal(() => Math.round(latVal.value), {
                digits: 0,
                suffix: ' ms',
                size: 54,
                color: 'gold',
            })
            const latCol = place(
                column([latTitle, latReadout], { gap: 10, align: 'center' }),
                latBox!,
                'center',
            )

            const invLabel = text('20,000x reduction', { size: 32, color: 'green' })
            const invSub = text('Zero ACL leaks', { size: 26, color: 'ink' })
            const invCol = place(
                column([invLabel, invSub], { gap: 10, align: 'center' }),
                invBox!,
                'center',
            )

            // Build stage visual groups (bar + labels + narrowing trapezoid from previous stage)
            const barProgress = STAGES.map(() => s.value(0))
            const stageBars = STAGES.map((st, idx) => {
                const targetW = stageW(st)
                const y = rowYs[idx]!
                return dynamic(() => {
                    const p = barProgress[idx]!.value
                    if (p < 0.01) return []
                    const curW = Math.max(18, targetW * p)
                    return [
                        rect(curW, barH, {
                            fill: st.color,
                            stroke: st.color,
                            width: 3,
                            radius: 12,
                        })
                            .at(barLeft + curW / 2, y)
                            .set('fillOpacity', theme === 'light' ? 0.2 : 0.24),
                    ]
                })
            })

            const stageLabels = STAGES.map((st, idx) => {
                const y = rowYs[idx]!
                const w = stageW(st)
                const inside = w >= 290
                const countX = inside ? barLeft + w / 2 : barLeft + w + 150
                const leftCol = place(
                    column(
                        [
                            text(st.name, { size: 30, color: st.color === 'dim' ? 'ink' : st.color }),
                            text(st.sub, { size: 24, color: 'dim' }),
                        ],
                        { gap: 6, align: 'right' },
                    ),
                    sceneArea({
                        left: funnelArea!.left,
                        right: labelColRight,
                        top: y - 42,
                        bottom: y + 42,
                    }),
                    'right',
                )
                const countLbl = text(st.countText, {
                    size: 28,
                    color: st.color === 'dim' ? 'ink' : st.color,
                }).moveTo([countX, y])
                return { leftCol, countLbl }
            })

            const traps = [0, 1, 2].map((i) => {
                const wA = stageW(STAGES[i]!)
                const wB = stageW(STAGES[i + 1]!)
                const yA = rowYs[i]! + barH / 2
                const yB = rowYs[i + 1]! - barH / 2
                const pts: Vec[] = [
                    [barLeft, yA],
                    [barLeft + wA, yA],
                    [barLeft + wB, yB],
                    [barLeft, yB],
                ]
                return polygon(pts, {
                    fill: STAGES[i + 1]!.color,
                    stroke: null,
                }).set('fillOpacity', 0.14)
            })

            const packArrow = arrow(
                [barLeft + stageW(STAGES[3]!) / 2, rowYs[3]! + barH / 2 + 4],
                [barLeft + stageW(STAGES[3]!) / 2, rowYs[4]! - barH / 2 - 4],
                { stroke: 'green', width: 5, tip: 16 },
            )

            // ─── Chapter 1: Corpus & ACL Pre-Filter ───────────────────────────
            s.chapter('Corpus & ACL Pre-Filter')
            s.add(heading, ...gridNodes, panelCard, countCol, latCol, ...stageBars)
            s.play(
                fadeIn(phaseNodes[0]!),
                fadeIn(stageLabels[0]!.leftCol),
                seq(barProgress[0]!.to(1), fadeIn(stageLabels[0]!.countLbl)),
                { duration: 1.2 },
            )
            s.caption(
                'Start with 100,000 indexed chunks on a log scale before any query scoring begins.',
                3.4,
            )
            s.wait(1.0)

            s.play(
                seq(fadeOut(phaseNodes[0]!), fadeIn(phaseNodes[1]!)),
                fadeIn(traps[0]!),
                fadeIn(stageLabels[1]!.leftCol),
                seq(barProgress[1]!.to(1), fadeIn(stageLabels[1]!.countLbl)),
                poolVal.to(18_000),
                latVal.to(2),
                { duration: 1.4 },
            )
            s.caption(
                'Stage 1 enforces tenant, group, and version ACLs in 2 ms, dropping restricted chunks before scoring.',
                3.8,
            )
            s.wait(1.2)

            // ─── Chapter 2: Hybrid Search & Cross-Encoder Rerank ──────────────
            s.chapter('Hybrid Recall & Rerank Precision')
            s.play(
                seq(fadeOut(phaseNodes[1]!), fadeIn(phaseNodes[2]!)),
                fadeIn(traps[1]!),
                fadeIn(stageLabels[2]!.leftCol),
                barProgress[2]!.to(1),
                fadeIn(stageLabels[2]!.countLbl),
                poolVal.to(50),
                latVal.to(20),
                { duration: 1.3 },
            )
            s.caption(
                'Stage 2 runs BM25 plus dense search with RRF in 18 ms, narrowing 18,000 chunks to 50 high-recall candidates.',
                4.0,
            )
            s.wait(1.0)

            s.play(
                seq(fadeOut(phaseNodes[2]!), fadeIn(phaseNodes[3]!)),
                fadeIn(traps[2]!),
                fadeIn(stageLabels[3]!.leftCol),
                barProgress[3]!.to(1),
                fadeIn(stageLabels[3]!.countLbl),
                poolVal.to(5),
                latVal.to(55),
                { duration: 1.3 },
            )
            s.caption(
                'Stage 3 reranks with a cross-encoder in 35 ms and resolves 5 complete parent sections.',
                3.8,
            )
            s.wait(1.0)

            // ─── Chapter 3: Context Packing to LLM ────────────────────────────
            s.chapter('Context Packing & Grounded Generation')
            s.play(
                seq(fadeOut(phaseNodes[3]!), fadeIn(phaseNodes[4]!)),
                draw(packArrow),
                fadeIn(stageLabels[4]!.leftCol),
                seq(barProgress[4]!.to(1), fadeIn(stageLabels[4]!.countLbl)),
                latVal.to(375),
                fadeIn(invCol),
                { duration: 1.6 },
            )
            s.caption(
                'Stage 4 packs 1,800 cited prompt tokens for the LLM (320 ms prefill), reaching 375 ms end-to-end TTFT.',
                4.5,
            )
            s.wait(3.2)
        },
    )
}

export default createFilm()
