import {
    defineIllustration,
    Scene,
    Row,
    Column,
    Panel,
    FlowArrow,
    TextLabel,
    withDensity,
    getReadableToneColor,
    type ToneName,
} from 'vizmatic'

export const width = 960
export const height = 720
export const alt =
    'Four sequential acceptance gates evaluate accelerator candidates. Gate 1 checks correctness and task quality; failing sends the candidate to Revise config. Gate 2 checks per-device memory fit and measured reserve; failing marks it Disqualified. Gate 3 checks p95 TTFT under 450 ms and p95 TPOT under 45 ms; failing marks it Disqualified. Passing all three gates sends the candidate to Gate 4, which ranks useful output by SLO-compliant tokens per dollar.'

interface GateSpec {
    title: string
    tone: ToneName
    detail: string
    passLabel?: string
    failArrowLabel?: string
    failTitle?: string
    failTone?: ToneName
}

const GATES: GateSpec[] = [
    {
        title: '1 Correctness & quality',
        tone: 'blue',
        detail: 'Tolerances + task criteria',
        passLabel: 'Pass',
        failArrowLabel: 'Fails quality',
        failTitle: 'Revise config',
        failTone: 'warm',
    },
    {
        title: '2 Per-device memory fit',
        tone: 'purple',
        detail: 'Allocations + measured reserve',
        passLabel: 'Pass',
        failArrowLabel: 'OOM / tight',
        failTitle: 'Disqualified',
        failTone: 'red',
    },
    {
        title: '3 Latency SLOs',
        tone: 'cyan',
        detail: 'p95 TTFT < 450 ms, TPOT < 45 ms',
        passLabel: 'Pass both',
        failArrowLabel: 'Tail fails',
        failTitle: 'Disqualified',
        failTone: 'red',
    },
    {
        title: '4 Useful output & cost',
        tone: 'green',
        detail: 'Rank compliant tokens / dollar',
    },
]

const illustration = defineIllustration((baseColors) => {
    const c = withDensity(baseColors, 2.5)
    const gateWidth = 530
    const outcomeWidth = 236
    const arrowWidth = 140
    const rowWidth = 928

    const rows = GATES.flatMap((gate, index) => {
        const items = [
            Row({
                width: rowWidth,
                gap: 11,
                align: 'center',
                children: [
                    Panel({
                        c,
                        title: gate.title,
                        tone: gate.tone,
                        width: gateWidth,
                        padding: 12,
                        gap: 4,
                        titleFontSize: 31,
                        children: TextLabel({
                            c,
                            text: gate.detail,
                            fontSize: 28,
                            color: c.textSecondary,
                        }),
                    }),
                    ...(gate.failTitle && gate.failTone
                        ? [
                              Column({
                                  width: arrowWidth,
                                  gap: 2,
                                  align: 'center',
                                  children: [
                                      TextLabel({
                                          c,
                                          text: gate.failArrowLabel ?? '',
                                          fontSize: 28,
                                          fontWeight: 600,
                                          color: getReadableToneColor(gate.failTone, c),
                                          align: 'center',
                                      }),
                                      FlowArrow({
                                          c,
                                          direction: 'right',
                                          tone: gate.failTone,
                                          length: 120,
                                      }),
                                  ],
                              }),
                              Panel({
                                  c,
                                  title: gate.failTitle,
                                  tone: gate.failTone,
                                  width: outcomeWidth,
                                  padding: 12,
                                  gap: 2,
                                  titleFontSize: 30,
                              }),
                          ]
                        : []),
                ],
            }),
        ]

        if (gate.passLabel && index < GATES.length - 1) {
            items.push(
                Row({
                    width: gateWidth,
                    gap: 8,
                    align: 'center',
                    justify: 'center',
                    children: [
                        FlowArrow({
                            c,
                            direction: 'down',
                            tone: 'green',
                            length: 34,
                        }),
                        TextLabel({
                            c,
                            text: gate.passLabel,
                            fontSize: 28,
                            fontWeight: 600,
                            color: getReadableToneColor('green', c),
                        }),
                    ],
                }),
            )
        }
        return items
    })

    return Scene({
        c,
        padding: 16,
        gap: 6,
        align: 'start',
        children: Column({
            width: rowWidth,
            gap: 6,
            align: 'start',
            children: rows,
        }),
    })
})

export const create = illustration.create
export default illustration.default
