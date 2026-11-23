import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 640
export const alt =
    'PPO draws a fresh response from the current actor, scores it with reward, reference, and critic roles, then updates the actor for a later rollout. Vanilla DPO keeps one stored chosen/rejected pair, scores the same responses under the updated policy and a frozen reference cache, computes pairwise loss, and updates the policy to rescore that stored pair. The DPO path does not sample new responses.'

interface Chip {
    text: string
    tone: ToneName | 'frozen'
}
interface Lane {
    name: string
    data: string[]
    chips: Chip[]
    signal: string[]
    update: string[]
    back: string
}
const lanes: Lane[] = [
    {
        name: 'PPO-style RLHF, online',
        data: ['Fresh response', 'sampled from', 'the actor'],
        chips: [
            { text: 'Reward', tone: 'frozen' },
            { text: 'Reference', tone: 'frozen' },
            { text: 'Critic', tone: 'green' },
        ],
        signal: ['Clipped', 'advantage'],
        update: ['Actor', 'and critic'],
        back: 'next batch: new rollout',
    },
    {
        name: 'Basic DPO, offline',
        data: ['Stored chosen', 'and rejected', 'pair'],
        chips: [
            { text: 'Policy', tone: 'green' },
            { text: 'Reference', tone: 'frozen' },
        ],
        signal: ['Pair loss', 'on margin'],
        update: ['Policy'],
        back: 'next batch: same stored pairs',
    },
]

export const layoutHeight = (L: Layout) => (L.print ? 350 : 640)

function lines(
    k: Kit,
    x: number,
    y: number,
    w: number,
    h: number,
    words: string[],
    size: number,
    weight = 400,
) {
    const lineH = size * 1.3
    const top = y + (h - words.length * lineH) / 2
    words.forEach((word, i) => k.t(x, top + i * lineH, w, word, { size, align: 'center', weight }))
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const left = 6
    const gap = L.print ? 26 : 20
    const colW = (L.W - left * 2 - gap * 3) / 4
    const colX = (i: number) => left + i * (colW + gap)
    const head = L.print ? 24 : 36
    const laneGap = L.print ? 16 : 26
    const boxH = L.print ? 84 : 138
    const titleH = L.print ? 24 : 34
    const backH = L.print ? 28 : 44
    const laneH = titleH + boxH + backH

    ;['Responses', 'Scored by', 'Signal', 'Updates'].forEach((name, i) =>
        k.t(colX(i), 3, colW, name, { size: L.S, align: 'center', color: c.textSecondary }),
    )

    lanes.forEach((lane, index) => {
        const y = head + index * (laneH + laneGap)
        const boxY = y + titleH
        k.t(left, y, L.W - 12, lane.name, { size: L.S, weight: 600 })
        k.rect(colX(0), boxY, colW, boxH, { fill: k.tint('warm', 0.2), stroke: k.ink('warm') })
        lines(k, colX(0), boxY, colW, boxH, lane.data, L.S)

        const chipGap = L.print ? 4 : 6
        const chipH = (boxH - chipGap * 2) / 3
        const chipsTop =
            boxY + (boxH - lane.chips.length * chipH - (lane.chips.length - 1) * chipGap) / 2
        lane.chips.forEach((chip, i) => {
            const cy = chipsTop + i * (chipH + chipGap)
            const frozen = chip.tone === 'frozen'
            k.rect(
                colX(1),
                cy,
                colW,
                chipH,
                frozen ? { fill: c.textMuted, opacity: 0.22 } : { fill: k.tint('green', 0.3) },
            )
            k.rect(colX(1), cy, colW, chipH, {
                stroke: frozen ? c.textMuted : k.ink('green'),
                strokeWidth: frozen ? 1.25 : 1.75,
            })
            k.mid(colX(1), cy, colW, chipH, chip.text, { size: L.S, align: 'center' })
        })
        k.rect(colX(2), boxY, colW, boxH, { fill: k.tint('purple', 0.16), stroke: k.ink('purple') })
        lines(k, colX(2), boxY, colW, boxH, lane.signal, L.S)
        k.rect(colX(3), boxY, colW, boxH, {
            fill: k.tint('green', 0.3),
            stroke: k.ink('green'),
            strokeWidth: 1.75,
        })
        lines(k, colX(3), boxY, colW, boxH, lane.update, L.S, 600)
        ;[0, 1, 2].forEach((i) =>
            k.arrow(colX(i) + colW + 2, boxY + boxH / 2, colX(i + 1) - 2, boxY + boxH / 2, {
                stroke: c.textSecondary,
            }),
        )

        const returnY = boxY + boxH + (L.print ? 12 : 18)
        const fromX = colX(3) + colW / 2
        const toX = colX(0) + colW / 2
        const ink = index === 0 ? k.ink('green') : k.ink('warm')
        k.path(
            `M${fromX} ${boxY + boxH + 1}L${fromX} ${returnY}L${toX} ${returnY}L${toX} ${boxY + boxH + 8}`,
            { stroke: ink, strokeWidth: 2 },
        )
        k.arrow(toX, boxY + boxH + 10, toX, boxY + boxH + 1, { stroke: ink, strokeWidth: 2 })
        k.t(toX + 8, returnY + 1, fromX - toX - 16, lane.back, {
            size: L.S,
            align: 'center',
            color: ink,
        })
    })

    // Legend: green means the role trains in this loop.
    const legendY = head + 2 * laneH + laneGap + (L.print ? 8 : 12)
    k.rect(left, legendY + 3, L.S * 0.9, L.S * 0.9, {
        fill: k.tint('green', 0.3),
        stroke: k.ink('green'),
    })
    k.t(left + L.S * 1.2, legendY, 90, 'trains', { size: L.S, color: c.textSecondary })
    k.rect(left + 110, legendY + 3, L.S * 0.9, L.S * 0.9, { fill: c.textMuted, opacity: 0.35 })
    k.t(left + 110 + L.S * 1.2, legendY, 90, 'frozen', { size: L.S, color: c.textSecondary })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
