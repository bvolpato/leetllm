import {
    defineIllustration,
    Scene,
    Row,
    Column,
    Panel,
    Card,
    FlowArrow,
    TextLabel,
    withDensity,
    getReadableToneColor,
    type ToneName,
} from 'vizmatic'

export const width = 920
export const height = 720
export const alt =
    'Top: NKI tile dataflow moves operands from HBM to SBUF, computes in the tensor engine with partial sums in PSUM, returns Y to SBUF, and stores to HBM. Middle: split kernels release I1 via HBM so each kernel fits in SBUF, while fusing keeps X, W, I1, and I2 live simultaneously, overflows SBUF capacity, and adds HBM spill traffic. Bottom: PSUM overflow puts pressure on SBUF first and spills to HBM only if SBUF also overflows.'

const illustration = defineIllustration((baseColors) => {
    const c = withDensity(baseColors, 2.5)
    const contentWidth = 892

    const chip = (title: string, sub: string, tone: ToneName, boxWidth: number) =>
        Card({
            c,
            tone,
            width: boxWidth,
            padding: 8,
            gap: 2,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: title,
                    fontSize: 28,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({ c, text: sub, fontSize: 27, color: c.textSecondary, align: 'center' }),
            ],
        })

    const chipFlow = (
        items: Array<[string, string, ToneName]>,
        boxWidth: number,
        arrowLen: number,
    ) => {
        const children: React.ReactElement[] = []
        items.forEach(([title, sub, tone], idx) => {
            children.push(chip(title, sub, tone, boxWidth))
            if (idx < items.length - 1) {
                children.push(
                    FlowArrow({ c, direction: 'right', tone: 'neutral', length: arrowLen }),
                )
            }
        })
        return Row({ gap: 4, align: 'center', justify: 'center', children })
    }

    return Scene({
        c,
        padding: 14,
        gap: 10,
        children: Column({
            width: contentWidth,
            gap: 10,
            children: [
                Panel({
                    c,
                    title: 'Tile dataflow across NKI memories',
                    tone: 'blue',
                    width: contentWidth,
                    padding: 10,
                    gap: 6,
                    titleFontSize: 30,
                    children: chipFlow(
                        [
                            ['HBM', 'X, W in', 'neutral'],
                            ['SBUF', 'operand', 'cyan'],
                            ['Tensor', 'compute', 'blue'],
                            ['PSUM', 'partial', 'purple'],
                            ['SBUF', 'Y out', 'cyan'],
                            ['HBM', 'store Y', 'neutral'],
                        ],
                        116,
                        24,
                    ),
                }),
                Panel({
                    c,
                    title: 'Split kernels: shorter live ranges fit in SBUF',
                    tone: 'blue',
                    width: contentWidth,
                    padding: 10,
                    gap: 6,
                    titleFontSize: 30,
                    children: chipFlow(
                        [
                            ['Op 1 kernel', 'X + W -> I1', 'blue'],
                            ['HBM handoff', 'write & reload I1', 'neutral'],
                            ['Op 2 fits SBUF', 'extra launch paid', 'green'],
                        ],
                        244,
                        46,
                    ),
                }),
                Panel({
                    c,
                    title: 'Fused region: overlapping live ranges overflow SBUF',
                    tone: 'red',
                    width: contentWidth,
                    padding: 10,
                    gap: 6,
                    titleFontSize: 30,
                    children: chipFlow(
                        [
                            ['Combined ops', 'X, W, I1, I2 live', 'purple'],
                            ['Live set > SBUF', 'spills evicted tile', 'red'],
                            ['HBM spill / refill', 'extra DMA bytes', 'red'],
                        ],
                        244,
                        46,
                    ),
                }),
                Panel({
                    c,
                    title: 'PSUM overflow follows a two-step spill path',
                    tone: 'warm',
                    width: contentWidth,
                    padding: 10,
                    gap: 4,
                    titleFontSize: 30,
                    children: Row({
                        width: 868,
                        gap: 8,
                        align: 'center',
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'PSUM full',
                                fontSize: 29,
                                fontWeight: 700,
                                color: c.textPrimary,
                            }),
                            FlowArrow({ c, direction: 'right', tone: 'warm', length: 44 }),
                            TextLabel({
                                c,
                                text: 'SBUF absorbs spill',
                                fontSize: 29,
                                fontWeight: 700,
                                color: getReadableToneColor('warm', c),
                            }),
                            Column({
                                gap: 2,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'if SBUF fills',
                                        fontSize: 27,
                                        fontWeight: 600,
                                        color: getReadableToneColor('red', c),
                                        align: 'center',
                                    }),
                                    FlowArrow({ c, direction: 'right', tone: 'red', length: 110 }),
                                ],
                            }),
                            TextLabel({
                                c,
                                text: 'HBM traffic',
                                fontSize: 29,
                                fontWeight: 700,
                                color: getReadableToneColor('red', c),
                            }),
                        ],
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
