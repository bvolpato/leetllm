import { Column, LineChart, Scene, TiledMatrix, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 720
export const height = 670
export const alt =
    'A five-by-twenty matrix shows 20 passing candidates in a pool of 100 generated programs. Below it, the unbiased without-replacement pass@k curve rises from 20.0 percent at k=1 to 68.1 at k=5, 90.5 at k=10, and 99.3 at k=20, slightly above the biased plug-in curve.'

const n = 100
const cPass = 20
const ks = Array.from({ length: 20 }, (_, i) => i + 1)

function passAtK(k: number): number {
    let allFail = 1
    for (let i = 0; i < k; i++) allFail *= (n - cPass - i) / (n - i)
    return 1 - allFail
}

const unbiased = ks.map((k) => Number((passAtK(k) * 100).toFixed(1)))
const biasedPlugin = ks.map((k) => Number(((1 - (1 - cPass / n) ** k) * 100).toFixed(1)))

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.25),
        shadow: 'transparent',
    }
}

const illustration = defineIllustration((base) => {
    const c = prepTheme(base)
    return Scene({
        c,
        padding: 8,
        gap: 6,
        contentWidth: width - 48,
        align: 'center',
        children: Column({
            width: width - 48,
            gap: 10,
            align: 'center',
            children: [
                TiledMatrix({
                    c,
                    rows: 5,
                    cols: 20,
                    cellSize: 22,
                    gap: 4,
                    title: 'Observed pool: 20 of 100 pass',
                    regions: [
                        {
                            rowStart: 0,
                            rowEnd: 1,
                            colStart: 0,
                            colEnd: 20,
                            tone: 'blue',
                        },
                    ],
                }),
                LineChart({
                    c,
                    width: width - 48,
                    height: 360,
                    min: 0,
                    max: 100,
                    labels: ks.map((k) => (k === 1 || k % 5 === 0 ? `k=${k}` : '')),
                    yAxisLabel: 'At least one pass (%)',
                    showGrid: true,
                    showPoints: true,
                    directLabels: true,
                    series: [
                        { name: 'Unbiased', points: unbiased, color: 'primary' },
                        { name: 'Plug-in', points: biasedPlugin, color: 'warning' },
                    ],
                    footer: 'Existence in k draws (90.5% at k=10) ignores selection.',
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
