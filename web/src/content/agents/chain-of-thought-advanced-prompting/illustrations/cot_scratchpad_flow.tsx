import {
    BadgePill,
    BarChart,
    FlowArrow,
    Panel,
    Row,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 620
export const height = 660
export const alt =
    'Self-consistency majority voting over 5 sampled reasoning traces. Traces T1 through T3 reach 42, T4 errs to 36, and T5 fails answer extraction. Dividing over all 5 traces gives 60% agreement for 42, below an 80% abstention threshold, whereas omitting T5 would inflate agreement to 75%.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.85)
    const green = getReadableToneColor('green', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const red = getReadableToneColor('critical', c, c.bg)
    const votes = [
        { label: '42 (valid)', value: 60, color: green, valueLabel: '60% (3/5)' },
        { label: '36 (err)', value: 20, color: warm, valueLabel: '20% (1/5)' },
        { label: 'Invalid', value: 20, color: red, valueLabel: '20% (1/5)' },
    ]

    return Scene({
        c,
        padding: 14,
        gap: 12,
        contentWidth: 592,
        children: [
            Panel({
                c,
                title: 'Sampled CoT Traces (N = 5, T = 0.7)',
                subtitle: 'Keep malformed outputs in the voting denominator',
                tone: 'neutral',
                width: 592,
                padding: 10,
                gap: 8,
                children: [
                    Row({
                        gap: 10,
                        justify: 'center',
                        children: [
                            BadgePill({
                                c,
                                text: 'T1: 7*6 = 42',
                                tone: 'green',
                                fontSize: 19,
                            }),
                            BadgePill({
                                c,
                                text: 'T2: 21*2 = 42',
                                tone: 'green',
                                fontSize: 19,
                            }),
                            BadgePill({
                                c,
                                text: 'T3: 30+12 = 42',
                                tone: 'green',
                                fontSize: 19,
                            }),
                        ],
                    }),
                    Row({
                        gap: 10,
                        justify: 'center',
                        children: [
                            BadgePill({
                                c,
                                text: 'T4: 30+6 = 36 (slip)',
                                tone: 'warm',
                                fontSize: 19,
                            }),
                            BadgePill({
                                c,
                                text: 'T5: No #### tag (invalid)',
                                tone: 'critical',
                                fontSize: 19,
                            }),
                        ],
                    }),
                ],
            }),
            Panel({
                c,
                title: 'Vote Share Over Total N = 5 Traces',
                subtitle: 'Dividing by N = 5 reveals confidence drop below 80%',
                tone: 'blue',
                width: 592,
                padding: 10,
                children: BarChart({
                    c,
                    width: 564,
                    height: 185,
                    min: 0,
                    max: 100,
                    showGrid: true,
                    showValues: true,
                    data: votes,
                }),
            }),
            Panel({
                c,
                title: 'Denominator check before release',
                width: 592,
                padding: 10,
                children: Row({
                    gap: 8,
                    justify: 'center',
                    align: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'Filtered: 3/4 = 75%',
                            tone: 'neutral',
                            fontSize: 19,
                        }),
                        FlowArrow({ c, direction: 'right', length: 12, tone: 'warm' }),
                        BadgePill({
                            c,
                            text: 'True: 3/5 = 60%',
                            tone: 'warm',
                            fontSize: 19,
                        }),
                        BadgePill({
                            c,
                            text: 'Abstain (<80%)',
                            tone: 'critical',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
