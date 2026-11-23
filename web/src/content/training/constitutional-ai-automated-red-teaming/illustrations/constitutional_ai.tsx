import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 608
export const alt =
    'A roleplay request produces an unsafe draft y₀, then principle critique c₁ and a safer revised answer y*. The revised prompt-answer pair and helpfulness examples form SL-CAI supervised targets for cross-entropy. A separate RLAIF path samples response pairs from π_SL, adds AI harmlessness preferences and human helpfulness comparisons, fits reward model r_ψ, and updates policy π_θ with a KL reference to π_SL.'

type Kind = 'data' | 'principled' | 'artifact' | 'model' | 'policy'
interface Stage {
    lines: string[]
    kind: Kind
}
const fills: Record<Kind, ToneName> = {
    data: 'blue',
    principled: 'purple',
    artifact: 'warm',
    model: 'cyan',
    policy: 'green',
}

const lanes: { name: string; stages: Stage[] }[] = [
    {
        name: 'Stage 1, supervised: the revision is the target',
        stages: [
            { lines: ['Unsafe', 'draft'], kind: 'data' },
            { lines: ['Critique'], kind: 'principled' },
            { lines: ['Revised', 'answer'], kind: 'artifact' },
            { lines: ['SFT loss,', 'with helpful', 'examples'], kind: 'model' },
            { lines: ['Policy'], kind: 'policy' },
        ],
    },
    {
        name: 'Stage 2, RL: labels train a scorer, the scorer trains the policy',
        stages: [
            { lines: ['Sampled', 'pairs'], kind: 'data' },
            { lines: ['AI', 'judge'], kind: 'principled' },
            { lines: ['Soft', 'labels'], kind: 'artifact' },
            { lines: ['Reward', 'model'], kind: 'model' },
            { lines: ['Policy RL,', 'KL to', 'SFT model'], kind: 'policy' },
        ],
    },
]

export const layoutHeight = (L: Layout) => (L.print ? 332 : 608)

function box(k: Kit, L: Layout, x: number, y: number, w: number, h: number, stage: Stage) {
    const tone = fills[stage.kind]
    const strong = stage.kind === 'policy'
    k.rect(x, y, w, h, {
        fill: k.tint(tone, strong ? 0.34 : 0.2),
        stroke: k.ink(tone),
        strokeWidth: strong ? 2 : 1.25,
    })
    const lineH = L.S * 1.3
    const top = y + (h - stage.lines.length * lineH) / 2
    stage.lines.forEach((text, i) =>
        k.t(x, top + i * lineH, w, text, {
            size: L.S,
            align: 'center',
            weight: strong ? 600 : 400,
        }),
    )
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const left = 6
    const gap = L.print ? 22 : 18
    const colW = (L.W - left * 2 - gap * 4) / 5
    const colX = (i: number) => left + i * (colW + gap)
    const boxH = L.print ? 62 : 104
    const title = L.print ? 24 : 36
    const bandH = L.print ? 30 : 48
    const bandGap = L.print ? 24 : 34
    const lane1 = 3 + title
    const bandY = lane1 + boxH + bandGap
    const lane2 = bandY + bandH + bandGap
    const lane2Title = lane2 + boxH + (L.print ? 5 : 8)
    const laneY = [lane1, lane2]
    const titleY = [3, lane2Title]

    lanes.forEach((lane, index) => {
        const y = laneY[index]
        k.t(left, titleY[index], L.W - 12, lane.name, { size: L.S, weight: 600 })
        lane.stages.forEach((stage, i) => {
            box(k, L, colX(i), y, colW, boxH, stage)
            if (i < 4)
                k.arrow(colX(i) + colW + 2, y + boxH / 2, colX(i + 1) - 2, y + boxH / 2, {
                    stroke: c.textSecondary,
                })
        })
    })

    // The constitution feeds the critique above it and the judge below it.
    k.rect(colX(0), bandY, colX(2) + colW - colX(0), bandH, {
        fill: k.tint('purple', 0.34),
        stroke: k.ink('purple'),
        strokeWidth: 1.75,
    })
    k.mid(colX(0), bandY, colX(2) + colW - colX(0), bandH, 'Constitution: written principles', {
        size: L.S,
        align: 'center',
        weight: 600,
    })
    const principleX = colX(1) + colW / 2
    k.arrow(principleX, bandY - 1, principleX, lane1 + boxH + 2, {
        stroke: k.ink('purple'),
        strokeWidth: 2,
    })
    k.arrow(principleX, bandY + bandH + 1, principleX, lane2 - 2, {
        stroke: k.ink('purple'),
        strokeWidth: 2,
    })

    // Human helpfulness labels join the reward model only.
    const humanX = colX(3)
    k.rect(humanX, bandY, colW * 2 + gap, bandH, {
        fill: k.tint('warm', 0.2),
        stroke: k.ink('warm'),
    })
    k.mid(humanX, bandY, colW * 2 + gap, bandH, 'Human helpfulness labels', {
        size: L.S,
        align: 'center',
    })
    k.arrow(humanX + colW / 2, bandY + bandH + 1, humanX + colW / 2, lane2 - 2, {
        stroke: k.ink('warm'),
        strokeWidth: 2,
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
