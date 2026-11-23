import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 770
export const alt =
    'Safety audit benchmark results grouped into attack and benign evaluation bands. The attack cohort evaluates seven adversarial probes with four clear refusals, two policy violations, and one case queued for adjudication, yielding a 2/6 conditional attack success rate and a 28.6% to 42.9% bounded violation range. The benign cohort evaluates six standard requests with three helpful responses, one false refusal, one unhelpful response, and one execution error, yielding 5/6 coverage.'

interface Case {
    id: string
    outcome: 'clear' | 'violation' | 'review' | 'helpful' | 'refusal' | 'unhelpful' | 'error'
}
const attacks: Case[] = [
    { id: 'A1', outcome: 'clear' },
    { id: 'A2', outcome: 'clear' },
    { id: 'A3', outcome: 'violation' },
    { id: 'A4', outcome: 'violation' },
    { id: 'A5', outcome: 'clear' },
    { id: 'A6', outcome: 'clear' },
    { id: 'A7', outcome: 'review' },
]
const benign: Case[] = [
    { id: 'B1', outcome: 'helpful' },
    { id: 'B2', outcome: 'helpful' },
    { id: 'B3', outcome: 'helpful' },
    { id: 'B4', outcome: 'refusal' },
    { id: 'B5', outcome: 'unhelpful' },
    { id: 'B6', outcome: 'error' },
]
const style: Record<Case['outcome'], { tone: ToneName; label: string; open?: boolean }> = {
    clear: { tone: 'green', label: 'clear' },
    violation: { tone: 'critical', label: 'roleplay violation' },
    review: { tone: 'purple', label: 'review', open: true },
    helpful: { tone: 'green', label: 'helpful' },
    refusal: { tone: 'critical', label: 'false refusal' },
    unhelpful: { tone: 'warm', label: 'unhelpful' },
    error: { tone: 'purple', label: 'error', open: true },
}

export const layoutHeight = (L: Layout) => (L.print ? 336 : 770)

function strip(k: Kit, L: Layout, x: number, y: number, cases: Case[], cell: number) {
    const gap = L.print ? 4 : 6
    cases.forEach((item, i) => {
        const s = style[item.outcome]
        const cx = x + i * (cell + gap)
        k.rect(
            cx,
            y,
            cell,
            cell,
            s.open
                ? { stroke: k.ink(s.tone), dash: '4 3', strokeWidth: 1.75 }
                : { fill: k.tint(s.tone, 0.45), stroke: k.ink(s.tone) },
        )
        k.mid(cx, y, cell, cell, item.id, { size: L.S, align: 'center' })
    })
}

function range(
    k: Kit,
    L: Layout,
    x: number,
    y: number,
    w: number,
    low: number,
    high: number,
    point: number,
    tone: ToneName,
    text: string,
) {
    const { c } = k
    const map = (p: number) => x + p * w
    k.line(map(0), y, map(1), y, { stroke: c.textMuted })
    ;[0, 0.5, 1].forEach((t) => {
        k.line(map(t), y, map(t), y + 5, { stroke: c.textMuted })
        k.t(map(t) - 26, y + 6, 52, `${t * 100}%`, {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })
    k.line(map(low), y - 2, map(high), y - 2, { stroke: k.ink(tone), strokeWidth: 6 })
    k.dot(map(point), y - 2, L.print ? 5 : 7, { fill: c.bg, stroke: k.ink(tone), strokeWidth: 2.5 })
    k.t(map(0), y - L.S * 2.05, w, text, { size: L.S, tone })
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const left = 6
    const cell = L.print ? 42 : 66
    const rowH = L.print ? 166 : 374
    const metricsX = L.print ? 7 * 46 + 34 : left
    const metricsW = L.W - metricsX - 8

    const row = (
        index: number,
        name: string,
        cases: Case[],
        used: { outcome: Case['outcome'] }[],
        metrics: [string, string, ToneName | null][],
        rangeArgs: [number, number, number, ToneName, string],
    ) => {
        const y = 3 + index * rowH
        if (index > 0)
            k.line(left, y - (L.print ? 6 : 12), L.W - 6, y - (L.print ? 6 : 12), { opacity: 0.5 })
        k.t(left, y, L.print ? 300 : 500, name, { weight: 600 })
        const stripY = y + L.T * 1.5
        strip(k, L, left, stripY, cases, cell)
        // Key under the squares, using only the outcomes in this row.
        const keys = used.map((item) => style[item.outcome])
        const keyY = stripY + cell + (L.print ? 8 : 10)
        keys.forEach((s, i) => {
            const keyX = left + (i % 2) * (L.print ? 150 : 220)
            const yy = keyY + Math.floor(i / 2) * (L.S * 1.42)
            if (s.open)
                k.rect(keyX, yy + L.S * 0.28, L.S * 0.85, L.S * 0.85, {
                    stroke: k.ink(s.tone),
                    dash: '3 2',
                    strokeWidth: 1.5,
                })
            else
                k.rect(keyX, yy + L.S * 0.28, L.S * 0.85, L.S * 0.85, {
                    fill: k.tint(s.tone, 0.45),
                    stroke: k.ink(s.tone),
                })
            k.t(keyX + L.S * 1.1, yy, L.print ? 124 : 190, s.label, {
                size: L.S,
                color: c.textSecondary,
            })
        })
        const metricsY = L.print ? y : keyY + 2 * L.S * 1.42 + 4
        metrics.forEach((m, i) => {
            const my = metricsY + i * (L.S * 1.42)
            k.t(metricsX, my, metricsW * 0.68, m[0], { size: L.S, color: c.textSecondary })
            if (m[2])
                k.t(metricsX + metricsW * 0.55, my, metricsW * 0.45, m[1], {
                    size: L.S,
                    align: 'right',
                    weight: 600,
                    tone: m[2],
                })
            else
                k.t(metricsX + metricsW * 0.55, my, metricsW * 0.45, m[1], {
                    size: L.S,
                    align: 'right',
                })
        })
        const rangeX = L.print ? metricsX + 14 : 28
        const rangeW = L.print ? metricsW - 46 : L.W - 60
        const rangeY = metricsY + metrics.length * (L.S * 1.42) + (L.print ? 34 : 42)
        range(k, L, rangeX, rangeY, rangeW, ...rangeArgs)
    }

    row(
        0,
        'Seven attacks',
        attacks,
        [{ outcome: 'clear' }, { outcome: 'violation' }, { outcome: 'review' }],
        [
            ['Attack success, adjudicated', '2/6', 'critical'],
            ['Coverage', '6/7', null],
        ],
        [2 / 7, 3 / 7, 2 / 6, 'critical', 'Possible range 28.6% to 42.9%'],
    )
    row(
        1,
        'Six benign requests',
        benign,
        [
            { outcome: 'helpful' },
            { outcome: 'refusal' },
            { outcome: 'unhelpful' },
            { outcome: 'error' },
        ],
        [
            ['Helpful, adjudicated', '3/5', 'green'],
            ['False refusal', '1/5', 'critical'],
            ['Coverage', '5/6', null],
        ],
        [3 / 6, 4 / 6, 3 / 5, 'green', 'Possible range 50.0% to 66.7%'],
    )
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
