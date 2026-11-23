import {
    BarChart,
    Column,
    Matrix,
    Panel,
    Row,
    Scene,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

const DENSITY = 2.5

export const width = 848
export const height = 800
export const alt =
    'ALiBi recency penalties across 8 heads at distance 16 range from -8.0 in Head 1 to -0.06 in Head 8, paired with the 4x4 Head 1 causal bias matrix and a query i=2 trace showing finite past weights [0.186, 0.307, 0.506] and masked future weight 0.000.'

function makeAlibiBias(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)

    const headBars = Array.from({ length: 8 }, (_, idx) => {
        const slope = Math.pow(2, -(idx + 1))
        const penalty = 16 * slope
        const labelVal = penalty >= 1 ? penalty.toFixed(1) : penalty.toFixed(2)
        return {
            label: `h${idx + 1}`,
            value: penalty,
            color:
                idx === 0
                    ? ('critical' as const)
                    : idx < 4
                      ? ('warning' as const)
                      : ('primary' as const),
            valueLabel: `−${labelVal}`,
        }
    })

    const topLeft = Panel({
        c,
        title: 'Penalty at Δ = 16 (−16·m_h)',
        subtitle: 'h1=−8.0, h2=−4.0, ..., h8=−0.06',
        tone: 'red',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 452,
        children: BarChart({
            c,
            width: 424,
            height: 180,
            min: 0,
            max: 9,
            showValues: false,
            format: (v) => (v === 0 ? '0' : `−${v.toFixed(0)}`),
            data: headBars,
        }),
    })

    const topRight = Panel({
        c,
        title: 'Head 1 Bias (m = 1/2)',
        subtitle: 'Future keys j > i stay −∞',
        tone: 'neutral',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 332,
        children: Matrix({
            c,
            data: [
                [1, 0, 0, 0],
                [0.7, 1, 0, 0],
                [0.45, 0.7, 1, 0],
                [0.25, 0.45, 0.7, 1],
            ],
            labels: [
                ['0', '−∞', '−∞', '−∞'],
                ['−.5', '0', '−∞', '−∞'],
                ['−1', '−.5', '0', '−∞'],
                ['−1.5', '−1', '−.5', '0'],
            ],
            rowLabels: ['q0', 'q1', 'q2', 'q3'],
            colLabels: ['k0', 'k1', 'k2', 'k3'],
            cellWidth: 58,
            cellHeight: 36,
            rowLabelWidth: 46,
            fontSize: 25,
            colorScale: 'strength',
            colorDomain: [0, 1],
        }),
    })

    const botLeft = Panel({
        c,
        title: 'Query i = 2 Logits (m = 1/2)',
        subtitle: 'Finite bias vs −∞ mask on k3=100',
        tone: 'blue',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 432,
        children: Matrix({
            c,
            data: [
                [0.4, 0.4, 0.4, 1],
                [0.5, 0.75, 1, 0],
                [0.45, 0.65, 0.85, 0],
            ],
            labels: [
                ['2.0', '2.0', '2.0', '100'],
                ['−1.0', '−.5', '0.0', '−∞'],
                ['1.0', '1.5', '2.0', '−∞'],
            ],
            rowLabels: ['QK/√d', 'Bias', 'Logit'],
            colLabels: ['k0', 'k1', 'k2', 'k3'],
            cellWidth: 74,
            cellHeight: 38,
            rowLabelWidth: 92,
            fontSize: 25,
            colorScale: 'strength',
            colorDomain: [0, 1],
        }),
    })

    const botRight = Panel({
        c,
        title: 'Softmax Weights (i = 2)',
        subtitle: 'k0=.186, k1=.307, k2=.506, k3=0',
        tone: 'green',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 352,
        children: BarChart({
            c,
            width: 320,
            height: 165,
            min: 0,
            max: 0.6,
            showValues: false,
            format: (v) => v.toFixed(1),
            data: [
                { label: 'k0', value: 0.186, color: 'primary', valueLabel: '0.186' },
                { label: 'k1', value: 0.307, color: 'primary', valueLabel: '0.307' },
                { label: 'k2', value: 0.506, color: 'positive', valueLabel: '0.506' },
                { label: 'k3', value: 0.0, color: 'neutral', valueLabel: '0.000' },
            ],
        }),
    })

    return Scene({
        c,
        density: DENSITY,
        padding: 12,
        gap: 10,
        contentWidth: 800,
        children: Column({
            gap: 10,
            children: [
                Row({ gap: 16, align: 'stretch', children: [topLeft, topRight] }),
                Row({ gap: 16, align: 'stretch', children: [botLeft, botRight] }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeAlibiBias(theme)
}

export default create('dark')
