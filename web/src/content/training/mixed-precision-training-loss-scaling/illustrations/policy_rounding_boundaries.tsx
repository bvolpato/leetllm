import type { ThemeMode } from 'vizmatic'
import { mapNumberLine } from 'vizmatic'
import { makeKit, type Layout } from './_kit'

export const width = 720
export const height = 720
export const alt =
    'Two quantization examples share an axis for the first logit above one. Each interval stores its center value. For inputs 1.0038 and 1.0040, FP16 merges both at 1.00390625 while BF16 stores 1.0 and 1.0078125, giving probability gap 0.0019531. For inputs 1.0004 and 1.0006, FP16 stores 1.0 and 1.00097656 while BF16 merges at 1.0, giving gap 0.0002441. The second logit remains 1.0.'

export const roundingCases = [
    {
        id: 'first',
        train: 1.0038,
        rollout: 1.004,
        fp16: { train: 1.00390625, rollout: 1.00390625, gap: 0 },
        bf16: { train: 1, rollout: 1.0078125, gap: 0.0019531 },
    },
    {
        id: 'second',
        train: 1.0004,
        rollout: 1.0006,
        fp16: { train: 1, rollout: 1.0009765625, gap: 0.0002441 },
        bf16: { train: 1, rollout: 1, gap: 0 },
    },
] as const

export const roundingFormats = [
    {
        id: 'fp16' as const,
        name: 'FP16',
        centres: Array.from({ length: 9 }, (_, i) => 1 + i * 2 ** -10),
        step: 2 ** -10,
        tone: 'blue' as const,
    },
    {
        id: 'bf16' as const,
        name: 'BF16',
        centres: [1, 1 + 2 ** -7],
        step: 2 ** -7,
        tone: 'cyan' as const,
    },
]

export const projectPolicyLogit = (x: number) => mapNumberLine((x - 1) * 1000, 0, 8.3, width, 44)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const trainColor = k.ink('warm')
    const rolloutColor = k.ink('purple')

    k.t(16, 4, L.W - 32, 'Nearby logits can split or merge', {
        size: 26,
        weight: 700,
    })
    k.t(16, 38, L.W - 32, 'Axis: x − 1 (in 0.001 units) · Dashed: rounding threshold', {
        size: L.S,
        color: c.textSecondary,
    })

    roundingCases.forEach((item, ci) => {
        const yCase = 82 + ci * 276
        k.t(
            16,
            yCase,
            L.W - 32,
            `Case ${ci + 1}: train ${item.train.toFixed(4)} vs rollout ${item.rollout.toFixed(4)}`,
            {
                size: 23,
                weight: 700,
            },
        )

        roundingFormats.forEach((format, fi) => {
            const stored = item[format.id]
            const yRow = yCase + 72 + fi * 102
            const same = stored.train === stored.rollout
            k.t(
                16,
                yRow - 34,
                410,
                `${format.name} · ${same ? `merged (${stored.train})` : `split (${stored.train} / ${stored.rollout})`}`,
                {
                    size: L.S,
                    weight: 700,
                    tone: format.tone,
                },
            )
            k.t(440, yRow - 34, 264, `Δp = ${stored.gap.toFixed(7)}`, {
                size: L.S,
                mono: true,
                align: 'right',
            })

            format.centres.forEach((centre) => {
                const low = Math.max(1, centre - format.step / 2)
                const high = Math.min(1.0083, centre + format.step / 2)
                const selected = centre === stored.train || centre === stored.rollout
                const split = stored.train !== stored.rollout
                const cellColor =
                    split && centre === stored.train
                        ? trainColor
                        : split && centre === stored.rollout
                          ? rolloutColor
                          : k.ink(format.tone)
                k.rect(
                    projectPolicyLogit(low),
                    yRow,
                    projectPolicyLogit(high) - projectPolicyLogit(low),
                    30,
                    {
                        fill: selected
                            ? k.tint(
                                  split && centre === stored.train
                                      ? 'warm'
                                      : split && centre === stored.rollout
                                        ? 'purple'
                                        : format.tone,
                                  0.24,
                              )
                            : 'none',
                        stroke: c.border,
                        rx: 0,
                    },
                )
                const cx = projectPolicyLogit(centre)
                k.line(cx, yRow + 6, cx, yRow + 24, {
                    stroke: selected ? cellColor : c.textMuted,
                    strokeWidth: selected ? 2.5 : 1,
                })
            })

            if (!same) {
                const midX = projectPolicyLogit((stored.train + stored.rollout) / 2)
                k.line(midX, yRow - 8, midX, yRow + 34, {
                    stroke: c.textPrimary,
                    strokeWidth: 2.5,
                    dash: '5 4',
                })
            }
            const xt = projectPolicyLogit(item.train)
            const xr = projectPolicyLogit(item.rollout)
            k.dot(xt, yRow + 15, 5, {
                fill: trainColor,
                stroke: c.bg,
                strokeWidth: 1.5,
            })
            k.path(
                `M ${xr} ${yRow + 9} L ${xr + 6} ${yRow + 15} L ${xr} ${yRow + 21} L ${xr - 6} ${yRow + 15} Z`,
                {
                    fill: rolloutColor,
                    stroke: c.bg,
                },
            )
        })

        ;[0, 4, 8].forEach((tick) => {
            const x = projectPolicyLogit(1 + tick / 1000)
            k.t(x - 24, yCase + 214, 48, String(tick), {
                size: L.S,
                mono: true,
                align: 'center',
                color: c.textMuted,
            })
        })
    })

    k.dot(26, 650, 6, { fill: trainColor })
    k.t(40, 636, 220, 'Train input x', { size: L.S, tone: 'warm' })
    k.path('M 300 643 L 307 650 L 300 657 L 293 650 Z', { fill: rolloutColor })
    k.t(316, 636, 240, 'Rollout input x', { size: L.S, tone: 'purple' })
    k.tex(
        16,
        674,
        String.raw`p=\operatorname{softmax}([x,1])_0,\quad \Delta p=|p_{\rm train}-p_{\rm rollout}|`,
        {
            size: 21,
            color: c.textSecondary,
        },
    )

    return k.frame(height)
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, { W: width, T: 24, S: 21, print: false })
}

export default create('dark')
