import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgPoint,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 900
export const height = 780
export const alt =
    'Two side-by-side layouts show one scale shared by both 32-value rows and one scale owned by each row. Separate original-value zooms plot the exact reconstructions: 0.001 becomes 0 with the shared tensor scale and 0.00097656 with the row scale; 500 stays 500 with the tensor scale and becomes 512 with the second row scale.'

const illustration = defineIllustration((c) => {
    const ink = c.textPrimary
    const muted = c.textPrimary
    const blue = getReadableToneColor('blue', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const critical = getReadableToneColor('critical', c, c.bg)
    const blueFill = '#bfdbfe'
    const blueMid = '#60a5fa'
    const greenFill = '#bbf7d0'
    const warmFill = '#fed7aa'
    const warmMid = '#fb923c'
    const line = '#64748b'

    const label = (
        x: number,
        y: number,
        labelWidth: number,
        text: string,
        size = 32,
        color = ink,
        align: 'left' | 'center' | 'right' = 'left',
        math = false,
    ) => (
        <CanvasItem x={x} y={y} width={labelWidth} height={size + 10}>
            <TextLabel
                c={c}
                text={text}
                fontSize={size}
                fontWeight={720}
                color={color}
                width="100%"
                align={align}
                math={math}
            />
        </CanvasItem>
    )

    const svg = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <line x1="451" y1="82" x2="451" y2="342" stroke={line} strokeWidth="2" />

            {/* One scale physically brackets both 32-value rows. */}
            <path
                d="M54 186 H70 V345 H54 M70 244 H82 M70 337 H82"
                fill="none"
                stroke={blue}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line x1="64" y1="177" x2="64" y2="186" stroke={blue} strokeWidth="4" />

            {/* Four explicit rows, each with exactly 32 cell marks. */}
            {Array.from({ length: 32 }, (_, i) => {
                const xLeft = 83 + i * 10.55
                const xRight = 488 + i * 10.55
                const smallFill = i === 0 ? '#2563eb' : i % 4 === 1 ? blueMid : blueFill
                const largeFill = i === 3 ? '#c2410c' : i % 4 === 0 ? warmMid : warmFill
                return (
                    <g key={`cells-${i}`}>
                        <rect x={xLeft} y="230" width="8.6" height="24" rx="2" fill={smallFill} />
                        <rect x={xLeft} y="323" width="8.6" height="24" rx="2" fill={largeFill} />
                        <rect x={xRight} y="230" width="8.6" height="24" rx="2" fill={smallFill} />
                        <rect x={xRight} y="323" width="8.6" height="24" rx="2" fill={largeFill} />
                    </g>
                )
            })}

            {/* The two inset axes use separate data transforms and labeled ranges. */}
            <line x1="360" y1="513" x2="850" y2="513" stroke={line} strokeWidth="3" />
            <line x1="360" y1="506" x2="360" y2="521" stroke={line} strokeWidth="3" />
            <line x1="850" y1="506" x2="850" y2="521" stroke={line} strokeWidth="3" />
            {[421, 461, 501].map((y) => (
                <line
                    key={`small-rail-${y}`}
                    x1="360"
                    y1={y}
                    x2="850"
                    y2={y}
                    stroke={line}
                    strokeWidth="2"
                    opacity="0.58"
                />
            ))}
            <line x1="360" y1="716" x2="850" y2="716" stroke={line} strokeWidth="3" />
            <line x1="360" y1="709" x2="360" y2="724" stroke={line} strokeWidth="3" />
            <line x1="850" y1="709" x2="850" y2="724" stroke={line} strokeWidth="3" />
            {[612, 650, 688].map((y) => (
                <line
                    key={`large-rail-${y}`}
                    x1="360"
                    y1={y}
                    x2="850"
                    y2={y}
                    stroke={line}
                    strokeWidth="2"
                    opacity="0.58"
                />
            ))}

            {/* Small-value zoom: x maps linearly over [0, 0.0011]. */}
            <SvgPoint
                cx={360 + (0.001 / 0.0011) * 490}
                cy={421}
                r={9}
                fill={ink}
                stroke={c.bg}
                strokeWidth={3}
            />
            <SvgPoint cx={360} cy={461} r={9} fill={critical} stroke={c.bg} strokeWidth={3} />
            <SvgPoint
                cx={360 + (0.0009765625 / 0.0011) * 490}
                cy={501}
                r={9}
                fill={green}
                stroke={c.bg}
                strokeWidth={3}
            />

            {/* Spike zoom: x maps linearly over [480, 520]. */}
            <SvgPoint
                cx={360 + ((500 - 480) / 40) * 490}
                cy={612}
                r={9}
                fill={ink}
                stroke={c.bg}
                strokeWidth={3}
            />
            <SvgPoint
                cx={360 + ((500 - 480) / 40) * 490}
                cy={650}
                r={9}
                fill={blue}
                stroke={c.bg}
                strokeWidth={3}
            />
            <SvgPoint
                cx={360 + ((512 - 480) / 40) * 490}
                cy={688}
                r={9}
                fill={warm}
                stroke={c.bg}
                strokeWidth={3}
            />
        </svg>
    )

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: (
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {svg}
                </CanvasItem>
                {label(34, 20, 830, 'Same tensor. Different scale ownership.', 40)}
                {label(34, 78, 390, 'TENSOR-WIDE', 32, blue)}
                {label(474, 78, 390, 'ROW-WISE', 32, green)}
                {label(82, 132, 330, 'S = 1.116071', 34, blue, 'left', true)}
                {label(83, 180, 345, 'row 0 · 32 values', 32, ink, 'left', true)}
                {label(83, 273, 345, 'row 1 · 32 values', 32, ink, 'left', true)}
                {label(488, 180, 370, 'row 0 · S_{0}=2^{-8}', 32, green, 'left', true)}
                {label(488, 273, 370, 'row 1 · S_{1}=2', 32, warm, 'left', true)}

                {label(34, 350, 830, 'SMALL ROW · original-value zoom: 0 to 0.0011', 32)}
                {label(34, 403, 300, 'x_{0,0} = 0.001', 32, ink, 'left', true)}
                {label(34, 443, 300, 'tensor · 0', 32, critical, 'left', true)}
                {label(34, 483, 300, 'local · 0.00097656', 32, green, 'left', true)}
                {label(344, 521, 62, '0', 32, muted, 'center', true)}
                {label(772, 521, 118, '0.0011', 32, muted, 'center', true)}

                {label(34, 564, 830, 'SPIKE ROW · original-value zoom: 480 to 520', 32)}
                {label(34, 612, 300, 'x_{1,3} = 500', 32, ink, 'left', true)}
                {label(34, 650, 300, 'tensor · 500', 32, blue, 'left', true)}
                {label(34, 688, 300, 'local · 512', 32, warm, 'left', true)}
                {label(344, 724, 62, '480', 32, muted, 'center', true)}
                {label(790, 724, 96, '520', 32, muted, 'center', true)}
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
