import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 780
export const alt =
    'Three aligned plots use the same batch positions. With 16 decimal GB of weights and 0.536870912 GB of KV per 4K request, bytes per step rise from 16.54 to 50.36 GB as batch grows from 1 to 64. At assumed 3.35 TB/s those reads give 4.94 to 15.03 ms serialization floors and 202.6 to 4257.4 aggregate tokens per second. Linear intensity is 1.0, 6.3, 15.4, and 20.3 FLOPs per byte. These are assumed floors, not measured latency.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const bytesTone = getReadableToneColor('purple', c, c.bg)
    const timeTone = getReadableToneColor('warm', c, c.bg)
    const rateTone = getReadableToneColor('green', c, c.bg)

    const batches = [1, 8, 32, 64]
    const bytes = batches.map((b) => 16_000_000_000 + b * 536_870_912)
    const seconds = bytes.map((v) => v / 3.35e12)
    const rates = batches.map((b, i) => b / seconds[i])
    const intensity = batches.map((b, i) => (b * 16_000_000_000) / bytes[i])

    const plots = [
        {
            label: 'Read bytes / iteration · decimal GB',
            max: 72,
            ticks: [0, 40],
            values: bytes.map((v) => v / 1e9),
            fmt: (v: number) => v.toFixed(2),
            tone: bytesTone,
            y: 120,
        },
        {
            label: 'Serialization floor · ms',
            max: 22,
            ticks: [0, 15],
            values: seconds.map((v) => v * 1000),
            fmt: (v: number) => `${v.toFixed(2)} ms`,
            tone: timeTone,
            y: 292,
        },
        {
            label: 'Aggregate output · tokens / s',
            max: 6200,
            ticks: [0, 4500],
            values: rates,
            fmt: (v: number) => v.toFixed(1),
            tone: rateTone,
            y: 464,
        },
    ]

    const plotX = 192
    const plotW = 740
    const plotH = 122
    const pad = 26
    const innerW = plotW - 2 * pad
    const innerH = plotH - 2 * pad
    const mapX = (idx: number) => plotX + pad + ((idx + 1 - 0.65) / 3.7) * innerW

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={28} y={14} width={width - 56} height={54}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 35,
                        fontWeight: 800,
                        color: c.textPrimary,
                    }}
                >
                    KV reads raise latency even before saturation
                </span>
            </CanvasItem>

            {plots.map((plot) => {
                const mapY = (v: number) => plot.y + plotH - pad - (v / plot.max) * innerH
                const vectors = plot.values.map((v, i) => ({
                    x1: i + 1,
                    y1: 0,
                    x2: i + 1,
                    y2: v,
                    color: c.borderLight,
                    strokeWidth: 2,
                    arrow: false,
                    showStartDot: false,
                    showEndDot: false,
                }))
                return (
                    <React.Fragment key={plot.label}>
                        <CanvasItem x={28} y={plot.y - 38} width={width - 56} height={38}>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 31,
                                    fontWeight: 800,
                                    color: plot.tone,
                                }}
                            >
                                {plot.label}
                            </span>
                        </CanvasItem>
                        <CanvasItem x={plotX} y={plot.y} width={plotW} height={plotH}>
                            <AxisPlot
                                c={c}
                                width={plotW}
                                height={plotH}
                                padding={pad}
                                xMin={0.65}
                                xMax={4.35}
                                yMin={0}
                                yMax={plot.max}
                                showFrame={false}
                                showAxes={false}
                                showGrid={false}
                                gridCount={0}
                                vectors={vectors}
                                paths={[
                                    {
                                        points: plot.values.map((v, i) => ({ x: i + 1, y: v })),
                                        color: plot.tone,
                                        strokeWidth: 5,
                                    },
                                ]}
                                points={plot.values.map((v, i) => ({
                                    x: i + 1,
                                    y: v,
                                    fill: plot.tone,
                                    r: 8,
                                    stroke: c.bgCard,
                                    strokeWidth: 2,
                                }))}
                            />
                        </CanvasItem>
                        {plot.ticks.map((tick) => (
                            <CanvasItem
                                key={tick}
                                x={28}
                                y={mapY(tick) - 18}
                                width={148}
                                height={36}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        width: '100%',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: c.fontSans,
                                            fontSize: 30,
                                            fontWeight: 650,
                                            color: c.textSecondary,
                                        }}
                                    >
                                        {tick}
                                    </span>
                                </div>
                            </CanvasItem>
                        ))}
                        {plot.values.map((v, i) => (
                            <CanvasItem
                                key={i}
                                x={mapX(i) - 76}
                                y={mapY(v) - 42}
                                width={152}
                                height={36}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        width: '100%',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: c.fontSans,
                                            fontSize: 30,
                                            fontWeight: 800,
                                            color: plot.tone,
                                        }}
                                    >
                                        {plot.fmt(v)}
                                    </span>
                                </div>
                            </CanvasItem>
                        ))}
                    </React.Fragment>
                )
            })}

            <CanvasItem x={28} y={596} width={160} height={38}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textSecondary,
                    }}
                >
                    Batch
                </span>
            </CanvasItem>
            <CanvasItem x={28} y={638} width={160} height={38}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textSecondary,
                    }}
                >
                    I (FLOP/B)
                </span>
            </CanvasItem>
            {batches.map((b, i) => (
                <React.Fragment key={b}>
                    <CanvasItem x={mapX(i) - 66} y={596} width={132} height={38}>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 31,
                                    fontWeight: 800,
                                    color: c.textPrimary,
                                }}
                            >
                                B = {b}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={mapX(i) - 66} y={638} width={132} height={38}>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 31,
                                    fontWeight: 800,
                                    color: c.textPrimary,
                                }}
                            >
                                {intensity[i].toFixed(1)}
                            </span>
                        </div>
                    </CanvasItem>
                </React.Fragment>
            ))}

            <CanvasItem x={28} y={692} width={width - 56} height={68}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 16px',
                        borderRadius: 10,
                        backgroundColor: c.bgCard,
                        border: `2px solid ${c.borderLight}`,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 750,
                            color: bytesTone,
                        }}
                    >
                        B32: 16 + 32×0.5369 GB = 33.18 GB → 9.90 ms @ 3.35 TB/s
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
