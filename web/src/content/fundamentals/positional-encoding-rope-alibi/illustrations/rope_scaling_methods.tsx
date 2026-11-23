import {
    BadgePill,
    BarChart,
    Column,
    LineChart,
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
    'Comparison of PI, NTK-aware scaling, and YaRN for 4K-to-16K extension (s=4, d=128). PI compresses all frequency pairs uniformly to 0.25x and maps index 16,383 to 4,095.75, NTK-aware base 40,890 decays geometrically from 1.0x to 0.25x, and YaRN keeps fast bands at 1.0x while scaling attention logits by a^2=1.296 (t=0.771).'

const rotaryDim = 128
const base = 10000
const scale = 4
const trainLen = 4096
const ntkBase = base * Math.pow(scale, rotaryDim / (rotaryDim - 2)) // 40890

const ntkRatio = (pair: number) => Math.pow(base / ntkBase, (2 * pair) / rotaryDim)

const yarnRatio = (pair: number) => {
    const freq = Math.pow(base, -(2 * pair) / rotaryDim)
    const turns = (trainLen * freq) / (2 * Math.PI)
    const preserve = Math.min(1, Math.max(0, (turns - 1) / 31))
    return preserve + (1 - preserve) / scale
}

const d8Freqs = [1.0, 0.1, 0.01, 0.001]
const d8YarnRatios = d8Freqs.map((f) => {
    const turns = (trainLen * f) / (2 * Math.PI)
    const preserve = Math.min(1, Math.max(0, (turns - 1) / 31))
    return preserve + (1 - preserve) / scale
})

function makeRopeScalingMethods(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)
    const pairGrid = [
        0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46,
        48, 50, 52, 54, 56, 58, 60, 63,
    ]
    const labels = pairGrid.map((i) => ([0, 16, 32, 48].includes(i) ? `i=${i}` : ''))

    const topPanel = Panel({
        c,
        title: 'Frequency Multiplier θ′ / θ Across 64 Pairs (4K → 16K, s = 4)',
        subtitle:
            'PI=0.25× uniform; NTK b′=40,890 decays geometrically; YaRN preserves fast pairs (>32 turns)',
        tone: 'neutral',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 800,
        children: LineChart({
            c,
            width: 760,
            height: 205,
            min: 0,
            max: 1.1,
            showGrid: true,
            showPoints: false,
            directLabels: true,
            yAxisLabel: 'θ′ / θ',
            labels,
            format: (v) => v.toFixed(2),
            series: [
                {
                    name: 'YaRN',
                    points: pairGrid.map((i) => yarnRatio(i)),
                    color: 'primary',
                },
                {
                    name: 'NTK',
                    points: pairGrid.map((i) => ntkRatio(i)),
                    color: 'positive',
                },
                {
                    name: 'PI',
                    points: pairGrid.map(() => 0.25),
                    color: 'warning',
                },
            ],
        }),
    })

    const botLeft = Panel({
        c,
        title: 'YaRN Ratios (d = 8)',
        subtitle: 'i0=1.00, i1=1.00, i2=.384, i3=.250',
        tone: 'blue',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 392,
        children: BarChart({
            c,
            width: 356,
            height: 165,
            min: 0,
            max: 1.2,
            showValues: false,
            format: (v) => v.toFixed(1),
            data: [
                { label: 'i=0', value: d8YarnRatios[0], color: 'primary', valueLabel: '1.000' },
                { label: 'i=1', value: d8YarnRatios[1], color: 'primary', valueLabel: '1.000' },
                { label: 'i=2', value: d8YarnRatios[2], color: 'warning', valueLabel: '0.384' },
                { label: 'i=3', value: d8YarnRatios[3], color: 'positive', valueLabel: '0.250' },
            ],
        }),
    })

    const botRight = Panel({
        c,
        title: 'Attention Scaling (s = 4)',
        subtitle: 'a=1.139 · a²=1.296 · t=0.771',
        tone: 'warm',
        titleFontSize: 29,
        padding: 10,
        gap: 6,
        width: 392,
        children: BarChart({
            c,
            width: 356,
            height: 165,
            min: 0,
            max: 1.5,
            showValues: false,
            format: (v) => v.toFixed(1),
            data: [
                { label: 'Base', value: 1.0, color: 'neutral', valueLabel: '1.000' },
                { label: 'Q/K', value: 1.139, color: 'primary', valueLabel: '1.139' },
                { label: 'a²', value: 1.296, color: 'warning', valueLabel: '1.296' },
                { label: 't', value: 0.771, color: 'positive', valueLabel: '0.771' },
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
            children: [topPanel, Row({ gap: 16, align: 'stretch', children: [botLeft, botRight] })],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeRopeScalingMethods(theme)
}

export default create('dark')
