import React from 'react'
import { AxisPlot, Scene, SvgMathText, defineIllustration, getReadableToneColor } from 'vizmatic'

export const width = 1120
export const height = 880
export const alt =
    'Three aligned traces share logical ticks 0–10. Four host submissions finish at tick 4; the copy runs 0–3, affine 3–7, square 7–9, and reduction 9–10. A ready-event arrow joins copy completion to affine start at tick 3. In the unsafe comparison, affine begins at tick 1 while the copy continues to tick 3; the red band marks this possible read hazard.'

const xMin = -1.65
const xMax = 10.35
const yMin = 0
const yMax = 3.5
const plotWidth = 1064
const plotHeight = 650
const padding = 48
const innerWidth = plotWidth - 2 * padding
const innerHeight = plotHeight - 2 * padding
const px = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * innerWidth
const py = (y: number) => padding + innerHeight - ((y - yMin) / (yMax - yMin)) * innerHeight

const illustration = defineIllustration((c) => {
    const hostY = 3.05
    const copyY = 2.2
    const computeY = 1.32
    const unsafeCopyY = 0.9
    const unsafeAffineY = 0.15
    const barHeight = 44
    const barHalfHeight = ((barHeight / 2) * (yMax - yMin)) / innerHeight
    const text = getReadableToneColor('neutral', c, c.bg)
    const hostFill = c.secondaryDark
    const deviceFill = c.primaryDark
    const green = getReadableToneColor('green', c, c.bg)
    const amber = getReadableToneColor('warm', c, c.bg)
    const red = getReadableToneColor('critical', c, c.bg)

    const rect = (key: string, start: number, end: number, centerY: number, fill: string) => (
        <rect
            key={key}
            x={px(start)}
            y={py(centerY) - barHeight / 2}
            width={px(end) - px(start)}
            height={barHeight}
            rx={4}
            fill={fill}
        />
    )

    const barLabel = (
        key: string,
        value: string,
        start: number,
        end: number,
        centerY: number,
        size = 38,
        xOffset = 0,
        textAnchor: 'middle' | 'start' = 'middle',
    ) => {
        // JetBrains Mono advances 0.6em per character; this keeps start-anchored labels centered.
        const anchorAdjustment = textAnchor === 'start' ? value.length * size * 0.3 : 0
        return (
            <SvgMathText
                key={key}
                text={value}
                x={(px(start) + px(end)) / 2 + xOffset - anchorAdjustment}
                y={py(centerY)}
                fill="#ffffff"
                fontSize={size}
                fontWeight={750}
                textAnchor={textAnchor}
                dominantBaseline="middle"
            />
        )
    }

    const laneLabel = (key: string, value: string, centerY: number, size = 38, color = text) => (
        <SvgMathText
            key={key}
            text={value}
            x={px(xMin)}
            y={py(centerY)}
            fill={color}
            fontSize={size}
            fontWeight={750}
            dominantBaseline="middle"
        />
    )

    const ticks = Array.from({ length: 11 }, (_, index) => index)
    const grid = ticks.flatMap((tick) => {
        const shared = {
            color: c.borderSubtle,
            strokeWidth: tick === 0 || tick === 10 ? 1.6 : 1,
            opacity: tick === 0 || tick === 10 ? 0.8 : 0.48,
        }
        if (tick === 4) {
            return [
                {
                    ...shared,
                    points: [
                        { x: tick, y: 0 },
                        { x: tick, y: 1.7 },
                    ],
                },
                {
                    ...shared,
                    points: [
                        { x: tick, y: 2.06 },
                        { x: tick, y: 3.5 },
                    ],
                },
            ]
        }
        return [
            {
                ...shared,
                points: [
                    { x: tick, y: 0 },
                    { x: tick, y: 3.5 },
                ],
            },
        ]
    })
    const laneGuides = [hostY, copyY, computeY].map((y) => ({
        points: [
            { x: 0, y },
            { x: 10, y },
        ],
        color: c.borderSubtle,
        strokeWidth: 1,
        opacity: 0.36,
    }))

    const hazardTop = unsafeCopyY - barHalfHeight
    const hazardBottom = unsafeAffineY + barHalfHeight
    const svgChildren = [
        <rect
            key="read-hazard-window"
            x={px(1)}
            y={py(hazardTop)}
            width={px(3) - px(1)}
            height={py(hazardBottom) - py(hazardTop)}
            fill={c.criticalDark}
            opacity={0.15}
        />,
        ...[0, 1, 2, 3].map((index) => rect(`host-op-${index}`, index, index + 1, hostY, hostFill)),
        rect('safe-copy', 0, 3, copyY, deviceFill),
        rect('safe-affine', 3, 7, computeY, deviceFill),
        rect('safe-square', 7, 9, computeY, deviceFill),
        rect('safe-reduce', 9, 10, computeY, deviceFill),
        rect('unsafe-copy', 0, 3, unsafeCopyY, deviceFill),
        rect('unsafe-affine', 1, 5, unsafeAffineY, c.criticalDark),
        <circle key="host-return-marker" cx={px(4)} cy={py(hostY)} r={8} fill={green} />,
        <circle
            key="device-complete-marker"
            cx={px(10)}
            cy={py(computeY) - barHeight / 2 - 8}
            r={8}
            fill={c.positiveDark}
        />,
    ]

    const labels = [
        ...[0, 1, 2, 3].map((index) =>
            barLabel(`host-op-${index}-label`, String(index + 1), index, index + 1, hostY, 38),
        ),
        barLabel('safe-copy-label', 'copy', 0, 3, copyY, 38),
        barLabel('safe-affine-label', 'affine', 3, 7, computeY, 38),
        barLabel('safe-square-label', 'square', 7, 9, computeY, 38, 0, 'start'),
        barLabel('safe-reduce-label', 'sum', 9, 10, computeY, 38),
        barLabel('unsafe-copy-label', 'copy', 0, 3, unsafeCopyY, 38),
        barLabel('unsafe-affine-label', 'affine', 1, 5, unsafeAffineY, 38),
        ...ticks.map((tick) => (
            <SvgMathText
                key={`tick-${tick}`}
                text={String(tick)}
                x={px(tick)}
                y={plotHeight - 28}
                fill={text}
                fontSize={38}
                fontWeight={650}
                textAnchor="middle"
                dominantBaseline="middle"
            />
        )),
        laneLabel('host-lane', 'Host', hostY),
        laneLabel('copy-lane', 'Copy', copyY),
        laneLabel('compute-lane', 'GPU', computeY),
        laneLabel('unsafe-lane', 'Unsafe', (unsafeCopyY + unsafeAffineY) / 2, 37, red),
        <SvgMathText
            key="host-return-label"
            text="host returns"
            x={px(4) + 13}
            y={py(2.72)}
            fill={green}
            fontSize={38}
            fontWeight={750}
            dominantBaseline="middle"
        />,
        <SvgMathText
            key="unsafe-band-label"
            text="hazard"
            x={(px(1) + px(3)) / 2}
            y={py((unsafeCopyY + unsafeAffineY) / 2)}
            fill={red}
            fontSize={38}
            fontWeight={850}
            textAnchor="middle"
            dominantBaseline="middle"
        />,
        <SvgMathText
            key="event-ready-label"
            text="ready"
            x={px(3) + 18}
            y={py(1.88)}
            fill={amber}
            fontSize={38}
            fontWeight={800}
            textAnchor="start"
            dominantBaseline="middle"
        />,
        <SvgMathText
            key="logical-tick-label"
            text="Logical tick"
            x={plotWidth / 2}
            y={plotHeight + 24}
            fill={text}
            fontSize={38}
            fontWeight={700}
            textAnchor="middle"
        />,
    ]

    return (
        <Scene c={c} padding={24} contentWidth={1072}>
            <div style={{ display: 'flex', flexDirection: 'column', width: plotWidth, gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ color: text, fontSize: 42, fontWeight: 850, lineHeight: 1.08 }}>
                        Host returns at 4 · device finishes at 10
                    </span>
                    <span style={{ color: text, fontSize: 38, fontWeight: 600, lineHeight: 1.12 }}>
                        A dependency event gates affine until copy finishes.
                    </span>
                </div>
                <div style={{ position: 'relative', width: plotWidth, height: plotHeight + 40 }}>
                    <AxisPlot
                        c={c}
                        width={plotWidth}
                        height={plotHeight}
                        xMin={xMin}
                        xMax={xMax}
                        yMin={yMin}
                        yMax={yMax}
                        padding={padding}
                        showFrame={false}
                        showAxes={false}
                        showGrid={false}
                        paths={[...grid, ...laneGuides]}
                        vectors={[
                            {
                                x1: 3,
                                y1: copyY - barHalfHeight,
                                x2: 3,
                                y2: computeY + barHalfHeight,
                                color: amber,
                                strokeWidth: 2.5,
                                arrow: true,
                                arrowSize: 8,
                            },
                        ]}
                    >
                        {svgChildren}
                    </AxisPlot>
                    {labels}
                </div>
            </div>
        </Scene>
    )
})

export const create = illustration.create
export default illustration
