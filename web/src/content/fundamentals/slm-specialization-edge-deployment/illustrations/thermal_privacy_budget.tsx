import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    geometryBounds,
    mapNumberLine,
    type ThemeMode,
} from 'vizmatic'

export const width = 1280
export const height = 820
export const alt =
    'Three workload throughput readings share one time and throughput scale: 23.0 tokens/s at the start, 19.4 at 90 seconds, and 16.8 at 600 seconds. Dashed connectors link only the sample points. A horizontal 18 tokens/s requirement shows the final sample below the target. Thermal state, power, placement, ambient conditions, and workload telemetry identify what drove the decline.'

const samples = [
    { elapsedSeconds: 0, tokensPerSecond: 23.0, label: 'start' },
    { elapsedSeconds: 90, tokensPerSecond: 19.4, label: '90 s' },
    { elapsedSeconds: 600, tokensPerSecond: 16.8, label: '600 s' },
]
const target = 18

const label = (
    c: ReturnType<typeof getThemeColors>,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    fontSize = 42,
    fontWeight = 600,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={fontSize}
            fontWeight={fontWeight}
            color={color}
            align={align}
            math={false}
        />
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const structural = getReadableToneColor('neutral', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const red = getReadableToneColor('critical', c, c.bg)
    const plot = geometryBounds([
        { id: 'plot-top-left', x: 150, y: 212 },
        { id: 'plot-bottom-right', x: 1180, y: 586 },
    ])
    const xOf = (seconds: number) => plot.minX + mapNumberLine(seconds, 0, 600, plot.width, 0)
    const yOf = (rate: number) => plot.maxY - mapNumberLine(rate, 14, 25, plot.height, 0)
    const pointPositions = samples.map((sample) => ({
        ...sample,
        x: xOf(sample.elapsedSeconds),
        y: yOf(sample.tokensPerSecond),
    }))
    const targetY = yOf(target)

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox="0 0 1280 820">
                    <path
                        d={'M' + plot.minX + ' ' + plot.maxY + ' H' + plot.maxX}
                        stroke={structural}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    <path
                        d={'M' + plot.minX + ' ' + plot.minY + ' V' + plot.maxY}
                        stroke={structural}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    {[16, 18, 20, 22, 24].map((tick) => {
                        const y = yOf(tick)
                        return (
                            <g key={'ytick-' + tick}>
                                <path
                                    d={'M' + plot.minX + ' ' + y + ' H' + plot.maxX}
                                    stroke={tick === target ? warm : c.borderSubtle}
                                    strokeWidth={tick === target ? 4 : 2}
                                    strokeDasharray={tick === target ? '13 9' : undefined}
                                />
                                <path
                                    d={'M' + (plot.minX - 9) + ' ' + y + ' H' + (plot.minX + 9)}
                                    stroke={tick === target ? warm : c.textMuted}
                                    strokeWidth="3"
                                />
                            </g>
                        )
                    })}
                    {[0, 90, 600].map((tick) => {
                        const x = xOf(tick)
                        return (
                            <g key={'xtick-' + tick}>
                                <path
                                    d={'M' + x + ' ' + plot.maxY + ' V' + (plot.maxY + 12)}
                                    stroke={c.textMuted}
                                    strokeWidth="3"
                                />
                                <path
                                    d={'M' + x + ' ' + plot.minY + ' V' + plot.maxY}
                                    stroke={c.borderSubtle}
                                    strokeWidth="2"
                                    strokeDasharray="6 10"
                                    opacity="0.62"
                                />
                            </g>
                        )
                    })}
                    {pointPositions.slice(0, -1).map((point, i) => {
                        const next = pointPositions[i + 1]
                        return (
                            <path
                                key={'connector-' + i}
                                d={'M' + point.x + ' ' + point.y + ' L' + next.x + ' ' + next.y}
                                fill="none"
                                stroke={blue}
                                strokeWidth="7"
                                strokeDasharray="13 11"
                                strokeLinecap="round"
                            />
                        )
                    })}
                    {pointPositions.map((point, i) => {
                        const color = i === 2 ? red : blue
                        return (
                            <g key={'sample-' + point.label}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="20"
                                    fill={c.bg}
                                    stroke={color}
                                    strokeWidth="7"
                                />
                                <circle cx={point.x} cy={point.y} r="8" fill={color} />
                            </g>
                        )
                    })}
                </svg>
            </CanvasItem>
            {label(c, 42, 18, 1196, 58, 'Sustained throughput falls below target', 48, 780)}
            {label(
                c,
                52,
                88,
                1176,
                48,
                'Throughput readings at 0, 90, and 600 seconds',
                42,
                620,
                c.textMuted,
            )}
            {label(c, 20, yOf(24) - 23, 100, 50, '24', 42, 620, c.textPrimary, 'right')}
            {label(c, 20, yOf(22) - 23, 100, 50, '22', 42, 620, c.textPrimary, 'right')}
            {label(c, 20, yOf(20) - 23, 100, 50, '20', 42, 620, c.textPrimary, 'right')}
            {label(c, 20, targetY - 23, 100, 50, '18', 42, 760, warm, 'right')}
            {label(c, 20, yOf(16) - 23, 100, 50, '16', 42, 620, c.textPrimary, 'right')}
            {label(c, 950, 146, 230, 46, 'Rate (t/s)', 42, 620, c.textMuted, 'right')}
            {label(c, xOf(0) - 56, 601, 112, 46, '0 s', 42, 650, c.textMuted)}
            {label(c, xOf(90) - 62, 601, 124, 46, '90 s', 42, 650, c.textMuted)}
            {label(c, xOf(600) - 78, 601, 156, 46, '600 s', 42, 650, c.textMuted)}
            {pointPositions.map((point, index) => {
                const lx = index === 0 ? 178 : index === 1 ? 332 : 900
                const labelY = index === 0 ? 192 : index === 1 ? point.y - 96 : point.y + 32
                return (
                    <React.Fragment key={'sample-label-' + point.label}>
                        {label(
                            c,
                            lx,
                            labelY,
                            index === 2 ? 270 : 280,
                            50,
                            point.tokensPerSecond.toFixed(1) + ' t/s',
                            42,
                            760,
                            index === 2 ? red : blue,
                            index === 2 ? 'right' : 'left',
                        )}
                    </React.Fragment>
                )
            })}
            {label(c, 850, targetY - 60, 330, 46, '18 t/s target', 42, 730, warm, 'right')}
            {label(
                c,
                60,
                675,
                1160,
                52,
                'Thermal · power · placement · workload telemetry',
                42,
                680,
                c.textPrimary,
            )}
            {label(
                c,
                60,
                736,
                1160,
                52,
                'Samples locate decline; telemetry investigates cause.',
                42,
                580,
                c.textMuted,
            )}
        </Board>
    )
}

export default create('dark')
