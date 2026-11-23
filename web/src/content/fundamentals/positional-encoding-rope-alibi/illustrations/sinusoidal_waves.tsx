import {
    BadgePill,
    BarChart,
    Column,
    LineChart,
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
export const height = 780
export const alt =
    'Sinusoidal waves across dimension pairs (0,1), (64,65), and (510,511) for d_model=512 over positions 0 to 32. At position 12, sine and cosine equal [-0.537, 0.844], [-0.608, -0.794], and [0.001, 1.000], with cumulative phases 12.00, 3.80, and 0.001 radians.'

const dModel = 512
const targetPos = 12
const pairs = [
    { label: '(0,1)', firstDim: 0 },
    { label: '(64,65)', firstDim: 64 },
    { label: '(510,511)', firstDim: 510 },
]
const omega = (firstDim: number) => Math.pow(10000, -firstDim / dModel)
const p12Coords = pairs.map((p) => {
    const angle = targetPos * omega(p.firstDim)
    return [Math.sin(angle), Math.cos(angle)]
})

function makeSinusoidalWaves(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)
    const positions = Array.from({ length: 33 }, (_, i) => i)
    const labels = positions.map((p) => (p % 4 === 0 ? `${p}` : ''))

    const topWavePanel = Panel({
        c,
        title: 'Sinusoidal Channels Across Positions 0..32 (d = 512)',
        subtitle: 'Pair (0,1) λ=6.28 cycles rapidly; pair (510,511) λ=60,611 stays near zero',
        tone: 'neutral',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 800,
        children: LineChart({
            c,
            width: 760,
            height: 205,
            min: -1.1,
            max: 1.1,
            showGrid: true,
            showPoints: false,
            directLabels: true,
            yAxisLabel: 'sin(p·ω)',
            labels,
            format: (v) => v.toFixed(1),
            series: [
                {
                    name: '(0,1)',
                    points: positions.map((p) => Math.sin(p * omega(0))),
                    color: 'primary',
                },
                {
                    name: '(64,65)',
                    points: positions.map((p) => Math.sin(p * omega(64))),
                    color: 'positive',
                },
                {
                    name: '(510,511)',
                    points: positions.map((p) => Math.sin(p * omega(510))),
                    color: 'warning',
                },
            ],
        }),
    })

    const coordMatrix = Panel({
        c,
        title: 'Coordinates at p = 12',
        subtitle: 'PE stores [sin, cos] pairs',
        tone: 'blue',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 380,
        children: Matrix({
            c,
            data: p12Coords.map((row) => row.map((v) => Math.abs(v))),
            labels: p12Coords.map((row) => row.map((v) => v.toFixed(3))),
            rowLabels: pairs.map((p) => p.label),
            colLabels: ['sin', 'cos'],
            cellWidth: 92,
            cellHeight: 40,
            rowLabelWidth: 102,
            fontSize: 25,
            colorScale: 'strength',
            colorDomain: [0, 1],
        }),
    })

    const angleBars = Panel({
        c,
        title: 'Phase Angle at p = 12 (rad)',
        subtitle: '12.00, 3.80, and 0.001 rad',
        tone: 'warm',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 404,
        children: BarChart({
            c,
            width: 372,
            height: 175,
            min: 0,
            max: 15,
            showValues: false,
            format: (v) => `${Math.round(v)}`,
            data: [
                {
                    label: '0..1',
                    value: targetPos * omega(0),
                    color: 'primary',
                    valueLabel: '12.00',
                },
                {
                    label: '64..65',
                    value: targetPos * omega(64),
                    color: 'positive',
                    valueLabel: '3.80',
                },
                {
                    label: '510..511',
                    value: targetPos * omega(510),
                    color: 'warning',
                    valueLabel: '0.001',
                },
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
                topWavePanel,
                Row({ gap: 16, align: 'stretch', children: [coordMatrix, angleBars] }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeSinusoidalWaves(theme)
}

export default create('dark')
