import {
    AxisPlot,
    Column,
    FlowArrow,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'AxisPlot tracks compression ratio from 1x at 32 bits per dimension (FP32) to 4x at INT8, 32x at binary 1-bit, and 64x at PQ-96. Below a downward FlowArrow, a ProgressList reports exact 1,536d per-vector sizes and 1M-vector RAM: 6,144 bytes (5.72 GiB), 1,536 bytes (1.43 GiB), 192 bytes (183.1 MiB), and 96 bytes (91.6 MiB).'
export const width = 640
export const height = 760

const formats = [
    { x: 0, label: 'FP32', ratio: 1, bits: '32b/d' },
    { x: 1, label: 'INT8', ratio: 4, bits: '8b/d' },
    { x: 2, label: 'Binary', ratio: 32, bits: '1b/d' },
    { x: 3, label: 'PQ-96', ratio: 64, bits: '0.5b/d' },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = getReadableToneColor('cyan', c)
    const gridH = [0, 16, 32, 48, 64].map((y) => ({
        points: [
            { x: 0, y },
            { x: 3, y },
        ],
        tone: 'neutral' as const,
        strokeWidth: y === 0 ? 2 : 1,
        opacity: y === 0 ? 0.65 : 0.28,
    }))

    return Scene({
        c,
        title: 'Quantization compresses 1,536d vectors up to 64x',
        subtitle: 'Raw code bytes per vector and total RAM for 1M vectors',
        padding: 14,
        gap: 8,
        contentWidth: 610,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Compression ratio relative to FP32 (1× to 64×)',
                    fontSize: 20,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 540,
                    height: 175,
                    padding: 20,
                    xMin: 0,
                    xMax: 3,
                    yMin: 0,
                    yMax: 68,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    paths: [
                        ...gridH,
                        {
                            points: formats.map((f) => ({ x: f.x, y: f.ratio })),
                            color: cyan,
                            strokeWidth: 4,
                        },
                    ],
                    points: formats.map((f) => ({
                        x: f.x,
                        y: f.ratio,
                        tone: 'cyan' as const,
                        r: 7,
                        stroke: c.bgCard,
                        strokeWidth: 2,
                    })),
                }),
                Row({
                    gap: 16,
                    align: 'center',
                    justify: 'center',
                    children: formats.map((f) =>
                        TextLabel({
                            c,
                            text: `${f.label} (${f.ratio}×)`,
                            width: 132,
                            fontSize: 19,
                            align: 'center',
                        }),
                    ),
                }),
                FlowArrow({ c, direction: 'down', length: 24, tone: 'blue' }),
                Column({
                    gap: 6,
                    align: 'stretch',
                    width: 590,
                    children: [
                        ProgressList({
                            c,
                            labelWidth: 235,
                            valueWidth: 112,
                            barHeight: 16,
                            fontSize: 19,
                            gap: 8,
                            rows: [
                                {
                                    label: 'FP32 · 6,144 B/vec',
                                    value: 1,
                                    valueLabel: '5.72 GiB',
                                    tone: 'purple',
                                },
                                {
                                    label: 'INT8 · 1,536 B/vec',
                                    value: 1536 / 6144,
                                    valueLabel: '1.43 GiB',
                                    tone: 'blue',
                                },
                                {
                                    label: 'Binary · 192 B/vec',
                                    value: 192 / 6144,
                                    valueLabel: '183.1 MiB',
                                    tone: 'cyan',
                                },
                                {
                                    label: 'PQ-96 · 96 B/vec',
                                    value: 96 / 6144,
                                    valueLabel: '91.6 MiB',
                                    tone: 'green',
                                },
                            ],
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'PQ codebooks (1.5 MiB), index links, and FP32 rescore copies add extra RAM.',
                    fontSize: 19,
                    align: 'center',
                }),
            ],
        }),
    })
}

export default create('dark')
