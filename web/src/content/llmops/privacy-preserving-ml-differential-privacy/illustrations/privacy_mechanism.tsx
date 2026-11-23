import React from 'react'
import {
    AxisPlot,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 720
export const height = 740
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A Gaussian-density plot compares p, with mean −0.3, to q, with mean 0.7; both have standard deviation 1.4. At epsilon 0.85, the boundary p = exp(epsilon) q is near −1.47, and the shaded one-direction excess mass is about 0.060. Approximate differential privacy also checks the swapped pair. A lower diagram shows add/remove sensitivity C and replace-one sensitivity 2C for sums of vectors whose norms are at most C.'

export function gaussian(x: number, mean: number, std: number) {
    return Math.exp(-0.5 * ((x - mean) / std) ** 2) / (std * Math.sqrt(2 * Math.PI))
}

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = { ...base, textMuted: base.textSecondary, shadow: 'transparent' }
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)
    const epsilon = 0.85
    const std = 1.4
    const meanP = -0.3
    const meanQ = 0.7
    const threshold = (meanP + meanQ) / 2 - (epsilon * std ** 2) / (meanQ - meanP)
    const p = (x: number) => gaussian(x, meanP, std)
    const q = (x: number) => gaussian(x, meanQ, std)
    const envelope = (x: number) => Math.exp(epsilon) * q(x)
    const xs = Array.from({ length: 221 }, (_, index) => -6 + index * 0.05)
    const tailXs = [...xs.filter((x) => x < threshold), threshold]
    const plotWidth = 640
    const plotHeight = 230
    const padding = 30
    const sx = (x: number) => padding + ((x + 6) / 11) * (plotWidth - 2 * padding)
    const sy = (y: number) => plotHeight - padding - (y / 0.7) * (plotHeight - 2 * padding)
    const shaded = [
        ...tailXs.map((x) => `${sx(x)},${sy(p(x))}`),
        ...[...tailXs].reverse().map((x) => `${sx(x)},${sy(envelope(x))}`),
    ].join(' ')
    const linePath = (points: Array<{ x: number; y: number }>) =>
        points
            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${sx(point.x)} ${sy(point.y)}`)
            .join(' ')
    const envelopePoints = xs.map((x) => ({ x, y: envelope(x) }))
    const pPoints = xs.map((x) => ({ x, y: p(x) }))
    const qPoints = xs.map((x) => ({ x, y: q(x) }))
    const densityPlot = AxisPlot({
        c,
        width: plotWidth,
        height: plotHeight,
        padding,
        xMin: -6,
        xMax: 5,
        yMin: 0,
        yMax: 0.7,
        paths: [],
        children: [
            <polygon key="excess-area" points={shaded} fill={blue} opacity={0.75} />,
            <path
                key="scaled-q"
                d={linePath(envelopePoints)}
                fill="none"
                stroke={warm}
                strokeWidth="3"
                strokeDasharray="8 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />,
            <path
                key="p-density"
                d={linePath(pPoints)}
                fill="none"
                stroke={blue}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />,
            <path
                key="q-density"
                d={linePath(qPoints)}
                fill="none"
                stroke={purple}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />,
            <line
                key="boundary"
                x1={sx(threshold)}
                y1={sy(0)}
                x2={sx(threshold)}
                y2={sy(0.7)}
                stroke={c.textMuted}
                strokeWidth="2"
                strokeDasharray="6 6"
            />,
        ],
    })
    const legendItem = (label: string, color: string, dashed = false) => (
        <Row key={label} gap={8} align="center" style={{ flexShrink: 0 }}>
            <span
                style={{
                    display: 'flex',
                    width: 28,
                    height: 0,
                    borderTop: `3px ${dashed ? 'dashed' : 'solid'} ${color}`,
                }}
            />
            <TextLabel c={c} text={label} math fontSize={24} fontWeight={700} color={color} />
        </Row>
    )
    const sensitivityRow = (replace: boolean) => {
        const color = replace ? purple : blue
        const start = replace ? 18 : 115
        const label = replace ? 'Replace-one' : 'Add/remove'
        return Row({
            gap: 12,
            width: 680,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: label,
                    width: 150,
                    fontSize: 24,
                    fontWeight: 750,
                    color: c.textPrimary,
                }),
                <div
                    key="range"
                    style={{
                        position: 'relative',
                        display: 'flex',
                        width: 230,
                        height: 52,
                        flexShrink: 0,
                    }}
                >
                    <svg width="230" height="52" viewBox="0 0 230 52" aria-hidden="true">
                        <line
                            x1="18"
                            y1="15"
                            x2="212"
                            y2="15"
                            stroke={c.borderLight}
                            strokeWidth="2"
                        />
                        <line
                            x1={start}
                            y1="15"
                            x2="212"
                            y2="15"
                            stroke={color}
                            strokeWidth="6"
                            strokeLinecap="round"
                        />
                        <circle
                            cx={start}
                            cy="15"
                            r="7"
                            fill={c.bg}
                            stroke={color}
                            strokeWidth="3"
                        />
                        <circle cx="212" cy="15" r="7" fill={c.bg} stroke={color} strokeWidth="3" />
                    </svg>
                    <CanvasItem x={0} y={27} width={36} height={24 * 1.35}>
                        <div style={{ width: 36, display: 'flex' }}>
                            <TextLabel c={c} text="−C" math fontSize={24} color={c.textSecondary} />
                        </div>
                    </CanvasItem>
                    <CanvasItem x={97} y={27} width={36} height={24 * 1.35}>
                        <div style={{ width: 36, display: 'flex' }}>
                            <TextLabel
                                c={c}
                                text="0"
                                math
                                align="center"
                                fontSize={24}
                                color={c.textSecondary}
                            />
                        </div>
                    </CanvasItem>
                    <CanvasItem x={194} y={27} width={36} height={24 * 1.35}>
                        <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>
                            <TextLabel
                                c={c}
                                text="+C"
                                math
                                align="right"
                                fontSize={24}
                                color={c.textSecondary}
                            />
                        </div>
                    </CanvasItem>
                </div>,
                <TextLabel
                    key={replace ? 'replace-bound' : 'add-remove-bound'}
                    c={c}
                    text={replace ? 'Δ ≤ 2C' : 'Δ ≤ C'}
                    math
                    width={110}
                    fontSize={24}
                    fontWeight={800}
                    color={color}
                />,
            ],
        })
    }

    return Scene({
        c,
        padding: 20,
        gap: 8,
        contentWidth: 680,
        children: Column({
            gap: 8,
            width: 680,
            align: 'stretch',
            children: [
                TextLabel({
                    c,
                    text: 'A neighboring record shifts the output distribution',
                    fontSize: 32,
                    fontWeight: 850,
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Toy densities · μ_p = −0.3 · μ_q = 0.7 · σ = 1.4 · ε = 0.85',
                    math: true,
                    fontSize: 24,
                    fontWeight: 650,
                    color: c.textSecondary,
                }),
                Row({
                    gap: 22,
                    width: 680,
                    align: 'center',
                    children: [
                        legendItem('p(s)', blue),
                        legendItem('q(s)', purple),
                        legendItem('exp(ε) q(s)', warm, true),
                    ],
                }),
                <div
                    key="density-plot"
                    style={{
                        display: 'flex',
                        width: plotWidth,
                        height: plotHeight,
                        alignSelf: 'center',
                    }}
                >
                    {densityPlot}
                </div>,
                TextLabel({
                    c,
                    text: 'Released scalar output s',
                    math: true,
                    align: 'center',
                    fontSize: 24,
                    fontWeight: 650,
                    color: c.textSecondary,
                }),
                TextLabel({
                    c,
                    text: 'δ = ∫ max(p(s) − exp(ε) q(s), 0) ds ≈ 0.060',
                    math: true,
                    fontSize: 24,
                    fontWeight: 800,
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Boundary t ≈ −1.47 · check the swapped pair too',
                    math: true,
                    fontSize: 24,
                    fontWeight: 650,
                    color: c.textSecondary,
                }),
                TextLabel({
                    c,
                    text: 'Clipped-sum sensitivity · each contribution has norm ≤ C',
                    math: true,
                    fontSize: 24,
                    fontWeight: 750,
                    color: c.textPrimary,
                }),
                sensitivityRow(false),
                sensitivityRow(true),
            ],
        }),
    })
}

export default create('dark')
