import {
    assertEqual,
    barChart,
    boxOf,
    column,
    decimal,
    fadeIn,
    fadeOut,
    film,
    place,
    rect,
    row,
    sceneKit,
    seq,
    table,
    text,
    tokens,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

interface WordEntry {
    word: string
    freq: number
    pieces: string[]
}

interface PairCount {
    pair: [string, string]
    label: string
    count: number
}

interface RoundSnapshot {
    positions: number
    pairs: PairCount[]
    winner: PairCount
    mergedToken: string
}

const INITIAL_CORPUS: readonly { word: string; freq: number }[] = [
    { word: 'rain', freq: 3 },
    { word: 'rainy', freq: 2 },
    { word: 'rail', freq: 2 },
]

function countPairs(entries: readonly WordEntry[]): PairCount[] {
    const counts = new Map<string, PairCount>()
    for (const entry of entries) {
        for (let i = 0; i < entry.pieces.length - 1; i++) {
            const a = entry.pieces[i]!
            const b = entry.pieces[i + 1]!
            const label = `${a}+${b}`
            const existing = counts.get(label)
            if (existing) {
                existing.count += entry.freq
            } else {
                counts.set(label, { pair: [a, b], label, count: entry.freq })
            }
        }
    }
    return [...counts.values()].sort((x, y) => y.count - x.count)
}

function countPositions(entries: readonly WordEntry[]): number {
    return entries.reduce((sum, entry) => sum + entry.pieces.length * entry.freq, 0)
}

function simulateBpe(merges: number): {
    rounds: RoundSnapshot[]
    finalPositions: number
    finalPairs: PairCount[]
} {
    const entries: WordEntry[] = INITIAL_CORPUS.map(({ word, freq }) => ({
        word,
        freq,
        pieces: [...word],
    }))
    const rounds: RoundSnapshot[] = []
    for (let step = 0; step < merges; step++) {
        const positions = countPositions(entries)
        const pairs = countPairs(entries)
        const winner = pairs[0]!
        const mergedToken = winner.pair[0] + winner.pair[1]
        rounds.push({ positions, pairs, winner, mergedToken })
        for (const entry of entries) {
            const next: string[] = []
            for (let i = 0; i < entry.pieces.length; i++) {
                if (
                    i < entry.pieces.length - 1 &&
                    entry.pieces[i] === winner.pair[0] &&
                    entry.pieces[i + 1] === winner.pair[1]
                ) {
                    next.push(mergedToken)
                    i++
                } else {
                    next.push(entry.pieces[i]!)
                }
            }
            entry.pieces = next
        }
    }
    return {
        rounds,
        finalPositions: countPositions(entries),
        finalPairs: countPairs(entries),
    }
}

const SIM = simulateBpe(3)

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(SIM.rounds[0]!.positions, 30, 'initial weighted token positions')
    assertEqual(SIM.rounds[0]!.winner.label, 'r+a', 'merge 1 winning pair')
    assertEqual(SIM.rounds[0]!.winner.count, 7, 'merge 1 pair count')
    assertEqual(SIM.rounds[1]!.positions, 23, 'positions after merge 1')
    assertEqual(SIM.rounds[1]!.winner.label, 'ra+i', 'merge 2 winning pair')
    assertEqual(SIM.rounds[1]!.winner.count, 7, 'merge 2 pair count')
    assertEqual(SIM.rounds[2]!.positions, 16, 'positions after merge 2')
    assertEqual(SIM.rounds[2]!.winner.label, 'rai+n', 'merge 3 winning pair')
    assertEqual(SIM.rounds[2]!.winner.count, 5, 'merge 3 pair count')
    assertEqual(SIM.finalPositions, 11, 'final weighted token positions')

    return film(
        {
            title: 'Byte Pair Encoding (BPE) merges',
            description:
                'Watch BPE count adjacent symbol pairs, merge the highest-frequency pair across the corpus, grow the vocabulary, and shrink token count from 30 to 11.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 32,
                heading: { size: 48, align: 'center', y: -474 },
                area: { left: -880, right: 880, top: -375, bottom: 425 },
            })
            const [leftArea, rightArea] = kit.area.columns([1.02, 1], 68)
            const [corpusRegion, counterRegion] = leftArea!.rows([2.35, 1], 30)
            const [chartRegion, tableRegion] = rightArea!.rows([1.3, 1.35], 32)

            const title = kit.heading('Byte Pair Encoding: greedy pair merges')
            s.add(title)

            // ── Left Top: Live token strips for the 3 weighted corpus words ──
            const corpusHeading = text('Corpus token sequence', {
                size: 30,
                color: 'blue',
            })
            const strip0 = tokens(['r', 'a', 'i', 'n'], {
                size: 40,
                label: 'x3',
                color: 'blue',
                width: 660,
                minWidth: 68,
            })
            const strip1 = tokens(['r', 'a', 'i', 'n', 'y'], {
                size: 40,
                label: 'x2',
                color: 'teal',
                width: 660,
                minWidth: 68,
            })
            const strip2 = tokens(['r', 'a', 'i', 'l'], {
                size: 40,
                label: 'x2',
                color: 'purple',
                width: 660,
                minWidth: 68,
            })
            const corpusBlock = column([corpusHeading, strip0, strip1, strip2], { gap: 36 })
            place(corpusBlock, corpusRegion!, 'center')

            // ── Left Bottom: Live weighted token count readout ──
            const posCount = s.value(SIM.rounds[0]!.positions)
            const vocabSize = s.value(6) // base chars: r, a, i, n, y, l

            const counterBox = rect(counterRegion!.width - 16, counterRegion!.height - 16, {
                fill: 'surface',
                stroke: 'dim',
                width: 2,
                radius: 14,
            }).at(counterRegion!.cx, counterRegion!.cy)

            const posReadout = decimal(() => posCount.value, {
                digits: 0,
                prefix: 'Weighted tokens: ',
                size: 36,
                color: 'yellow',
            })
            const vocabReadout = decimal(() => vocabSize.value, {
                digits: 0,
                prefix: 'Vocab size: ',
                size: 32,
                color: 'teal',
            })
            const counterSub = text('6 base characters -> 9 subword tokens (-63% length)', {
                size: 26,
                color: 'dim',
            })
            const counterStack = column(
                [row([posReadout, vocabReadout], { gap: 48 }), counterSub],
                { gap: 18 },
            )
            place(counterStack, counterRegion!, 'center')

            // ── Right Top: Adjacent pair frequency bar charts per round ──
            const chartTitle = text('Adjacent pair frequencies', {
                size: 30,
                color: 'orange',
            })

            const makePairChart = (pairs: readonly PairCount[]) =>
                barChart(
                    pairs.slice(0, 5).map((p) => ({ label: p.label, value: p.count })),
                    {
                        width: 720,
                        height: 225,
                        max: 8,
                        ticks: [0, 4, 8],
                        labelSize: 26,
                        barColor: 'blue',
                        states: true,
                        format: (v) => String(Math.round(v)),
                    },
                )

            const chart0 = makePairChart(SIM.rounds[0]!.pairs)
            const chartBlock0 = column([chartTitle, chart0], { gap: 18 })
            place(chartBlock0, chartRegion!, 'center')

            const chart1 = makePairChart(SIM.rounds[1]!.pairs)
            chart1.moveTo(boxOf(chart0).point('center'))

            const chart2 = makePairChart(SIM.rounds[2]!.pairs)
            chart2.moveTo(boxOf(chart0).point('center'))

            const chart3 = makePairChart(SIM.finalPairs)
            chart3.moveTo(boxOf(chart0).point('center'))

            // ── Right Bottom: Live learned merge table ──
            const vocabTitle = text('Learned merge rules (vocabulary growth)', {
                size: 28,
                color: 'green',
            })
            const mergeTable = table(
                [
                    { key: 'step', label: 'Step', sample: 'Merge 3' },
                    { key: 'rule', label: 'Pair', sample: 'rai + n' },
                    { key: 'token', label: 'New token', sample: '"rain"', marks: true },
                    { key: 'count', label: 'Count', align: 'right', sample: '7' },
                ],
                [],
                {
                    width: 740,
                    maxRows: 4,
                    size: 26,
                },
            )
            const tableBlock = column([vocabTitle, mergeTable], { gap: 16 })
            place(tableBlock, tableRegion!, 'center')

            // ── Chapter 1: Start from character tokens ──
            s.chapter('Start from characters')
            s.add(counterBox)
            s.play(
                fadeIn([corpusHeading, posReadout, vocabReadout, chartTitle, vocabTitle]),
                strip0.enter(),
                strip1.enter(),
                strip2.enter(),
                chart0.enter(),
                fadeIn(mergeTable),
                { duration: 1.4 },
            )
            s.caption(
                'Start with rain (x3), rainy (x2), and rail (x2) split into 30 weighted character tokens across 6 base symbols.',
                4.4,
            )
            s.wait(3.2)

            // ── Chapter 2: Merge 1 (r + a -> ra) ──
            s.chapter('Merge 1: r + a -> ra')
            s.play(
                chart0.mark('r+a', 'chosen'),
                strip0.window(0, 1, { color: 'yellow' }),
                strip1.window(0, 1, { color: 'yellow' }),
                strip2.window(0, 1, { color: 'yellow' }),
                { duration: 0.9 },
            )
            s.caption(
                'Adjacent pair r+a appears 7 times across all three words. Fuse every r+a into the new token "ra".',
                4.2,
            )
            s.play(
                strip0.merge(0, 1),
                strip1.merge(0, 1),
                strip2.merge(0, 1),
                posCount.to(23),
                vocabSize.to(7),
                mergeTable.append({
                    id: 'm1',
                    step: 'Merge 1',
                    rule: 'r + a',
                    token: { value: '"ra"', state: 'pass' },
                    count: 7,
                }),
                { duration: 1.4 },
            )
            s.play(
                strip0.window(null),
                strip1.window(null),
                strip2.window(null),
                seq(fadeOut(chart0), fadeIn(chart1)),
                { duration: 0.9 },
            )
            s.wait(2.2)

            // ── Chapter 3: Merge 2 (ra + i -> rai) ──
            s.chapter('Merge 2: ra + i -> rai')
            s.play(
                chart1.mark('ra+i', 'chosen'),
                strip0.window(0, 1, { color: 'yellow' }),
                strip1.window(0, 1, { color: 'yellow' }),
                strip2.window(0, 1, { color: 'yellow' }),
                { duration: 0.9 },
            )
            s.caption(
                'Recount pairs after the merge. Now ra+i is the clear winner with count 7, collapsing weighted positions from 23 to 16.',
                4.4,
            )
            s.play(
                strip0.merge(0, 1),
                strip1.merge(0, 1),
                strip2.merge(0, 1),
                posCount.to(16),
                vocabSize.to(8),
                mergeTable.append({
                    id: 'm2',
                    step: 'Merge 2',
                    rule: 'ra + i',
                    token: { value: '"rai"', state: 'pass' },
                    count: 7,
                }),
                { duration: 1.4 },
            )
            s.play(
                strip0.window(null),
                strip1.window(null),
                strip2.window(null),
                seq(fadeOut(chart1), fadeIn(chart2)),
                { duration: 0.9 },
            )
            s.wait(2.2)

            // ── Chapter 4: Merge 3 (rai + n -> rain) ──
            s.chapter('Merge 3: rai + n -> rain')
            s.play(
                chart2.mark('rai+n', 'chosen'),
                strip0.window(0, 1, { color: 'yellow' }),
                strip1.window(0, 1, { color: 'yellow' }),
                { duration: 0.9 },
            )
            s.caption(
                'Next, rai+n wins with count 5 across rain and rainy, leaving rail untouched as rai + l.',
                4.2,
            )
            s.play(
                strip0.merge(0, 1),
                strip1.merge(0, 1),
                posCount.to(11),
                vocabSize.to(9),
                mergeTable.append({
                    id: 'm3',
                    step: 'Merge 3',
                    rule: 'rai + n',
                    token: { value: '"rain"', state: 'pass' },
                    count: 5,
                }),
                { duration: 1.4 },
            )
            s.play(
                strip0.window(null),
                strip1.window(null),
                seq(fadeOut(chart2), fadeIn(chart3)),
                fadeIn(counterSub),
                { duration: 1.0 },
            )
            s.caption(
                'Three greedy merges grow the vocabulary from 6 to 9 symbols while cutting weighted corpus positions from 30 down to 11.',
                5.0,
            )
            s.wait(4.0)
        },
    )
}
