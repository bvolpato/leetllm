import { Column, LineChart, Scene, StepCard, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 740
export const autoSize = false
export const alt =
    'A U-shaped lost-in-the-middle recall curve across 20-document positions plots accuracy high near position 1 (primacy, 76%), dipping sharply through middle positions 8 to 12 (52% at midpoint), and recovering near position 20 (recency, 71%).'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 656,
        children: Column({
            width: 656,
            gap: 12,
            children: [
                LineChart({
                    c,
                    width: 656,
                    height: 300,
                    title: 'Evidence Position vs. Task Accuracy (U-Shaped Pattern)',
                    subtitle:
                        'Multi-doc recall (%) by evidence rank (1 = earliest doc, 20 = latest doc)',
                    labels: ['#1', '#4', '#8', '#10', '#12', '#16', '#20'],
                    min: 40,
                    max: 90,
                    format: (value: number) => `${Math.round(value)}%`,
                    showGrid: false,
                    showPoints: true,
                    directLabels: false,
                    series: [
                        {
                            name: 'Evidence position sweep',
                            points: [76, 65, 55, 52, 56, 64, 71],
                            color: 'warning',
                            area: true,
                        },
                    ],
                }),
                StepCard({
                    c,
                    width: 656,
                    padding: 12,
                    tone: 'warm',
                    eyebrow: 'WINDOW ORDERING',
                    title: 'Keep primary evidence near prompt edges, never buried mid-stream',
                    subtitle:
                        'Place stable rules first, top chunks near start/end, and the active task last.',
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
