import {
    BarChart,
    Column,
    IntervalPlot,
    MetricCard,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 720
export const height = 790
export const preset = 'engineering'
export const alt =
    'A frozen latency predictor supplies nine sorted calibration residuals: 2, 3, 3, 4, 5, 6, 7, 8, and 12 ms. For an 80% target, ceil((9 + 1) times 0.80) selects rank eight, so q is 8 ms. Of ten possible future-score ranks, the first eight meet q under distinct scores, giving at least 80% marginal coverage under exchangeability. A 40 ms prediction becomes [32, 48]; with nine residuals, a 95% target requires rank ten and an infinite threshold.'

const residuals = [2, 3, 3, 4, 5, 6, 7, 8, 12]

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.2)
    return Scene({
        c,
        padding: 12,
        gap: 8,
        contentWidth: 696,
        children: Column({
            gap: 8,
            children: [
                BarChart({
                    c,
                    width: 696,
                    height: 155,
                    title: 'Sorted Residuals (n = 9, ms)',
                    subtitle: 'k = ceil(10 x 0.80) = 8 selects q = 8 ms at r8*',
                    max: 14,
                    showGrid: true,
                    showValues: true,
                    data: residuals.map((val, idx) => ({
                        label: idx === 7 ? 'r8*' : `r${idx + 1}`,
                        value: val,
                        valueLabel: String(val),
                        color: idx === 7 ? 'warning' : idx === 8 ? 'violet' : 'primary',
                    })),
                }),
                IntervalPlot({
                    c,
                    width: 696,
                    height: 155,
                    min: 20,
                    max: 60,
                    title: 'Intervals Around y_hat = 40 ms',
                    format: (v) => String(v),
                    data: [
                        {
                            label: '80% (r8)',
                            low: 32,
                            mid: 40,
                            high: 48,
                            color: 'positive',
                            lowLabel: '32',
                            midLabel: '40',
                            highLabel: '48',
                        },
                        {
                            label: '90% (r9)',
                            low: 28,
                            mid: 40,
                            high: 52,
                            color: 'violet',
                            lowLabel: '28',
                            midLabel: '40',
                            highLabel: '52',
                        },
                    ],
                }),
                Row({
                    gap: 8,
                    align: 'stretch',
                    children: [
                        MetricCard({
                            c,
                            width: 226,
                            tone: 'blue',
                            padding: 10,
                            valueFontSize: 32,
                            label: '80% Target',
                            value: '8 ms',
                            detail: 'Rank 8 -> [32, 48]',
                        }),
                        MetricCard({
                            c,
                            width: 226,
                            tone: 'purple',
                            padding: 10,
                            valueFontSize: 32,
                            label: '90% Target',
                            value: '12 ms',
                            detail: 'Rank 9 -> [28, 52]',
                        }),
                        MetricCard({
                            c,
                            width: 228,
                            tone: 'critical',
                            padding: 10,
                            valueFontSize: 32,
                            label: '95% (n = 9)',
                            value: '+inf',
                            detail: 'Rank 10 > 9',
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.create('dark')
