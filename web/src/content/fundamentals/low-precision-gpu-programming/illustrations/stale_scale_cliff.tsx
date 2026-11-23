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
export const height = 760
export const alt =
    'A prior amax of 10 sets S_old to 10 divided by 448. Current x=500 becomes scaled input 22,400, clips to finite E4M3 code 448, then reconstructs to 10. The original-value number line maps 0 to 500 and shows x-hat=10 beside x=500, a 490-unit or 98% relative loss; the FP32 accumulator receives 10 times the weight.'

const illustration = defineIllustration((c) => {
    const ink = c.textPrimary
    const muted = c.textPrimary
    const blue = getReadableToneColor('blue', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const critical = getReadableToneColor('critical', c, c.bg)
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
            {/* Value capsules leave enough room for every number, including 22,400. */}
            {[
                { x: 17, color: blue },
                { x: 242, color: warm },
                { x: 467, color: critical },
                { x: 692, color: green },
            ].map((node, index) => (
                <rect
                    key={`node-${index}`}
                    x={node.x}
                    y="174"
                    width="190"
                    height="96"
                    rx="28"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="4"
                />
            ))}
            <path
                d="M207 270 V286 M242 286 V270 M432 270 V286 M467 286 V270 M657 270 V286 M692 286 V270"
                fill="none"
                stroke={line}
                strokeWidth="3"
            />
            <VectorArrow
                x1={207}
                y1={286}
                x2={242}
                y2={286}
                color={blue}
                strokeWidth={4}
                arrowSize={7}
            />
            <VectorArrow
                x1={432}
                y1={286}
                x2={467}
                y2={286}
                color={warm}
                strokeWidth={4}
                arrowSize={7}
            />
            <VectorArrow
                x1={657}
                y1={286}
                x2={692}
                y2={286}
                color={critical}
                strokeWidth={4}
                arrowSize={7}
            />

            {/* E4M3 finite-code interval, in code units [0, 448]. */}
            <line x1="120" y1="393" x2="775" y2="393" stroke={line} strokeWidth="4" />
            <line x1="120" y1="383" x2="120" y2="404" stroke={line} strokeWidth="4" />
            <line x1="775" y1="361" x2="775" y2="409" stroke={critical} strokeWidth="5" />
            <VectorArrow
                x1={865}
                y1={393}
                x2={784}
                y2={393}
                color={warm}
                strokeWidth={4}
                arrowSize={7}
            />
            <SvgPoint cx={775} cy={393} r={9} fill={critical} stroke={c.bg} strokeWidth={3} />

            {/* Shared original-value axis, with x mapped over [0, 500]. */}
            <line x1="120" y1="557" x2="775" y2="557" stroke={line} strokeWidth="4" />
            <line x1="120" y1="547" x2="120" y2="568" stroke={line} strokeWidth="4" />
            <line x1="775" y1="547" x2="775" y2="568" stroke={line} strokeWidth="4" />
            <SvgPoint
                cx={120 + (10 / 500) * 655}
                cy={557}
                r={9}
                fill={green}
                stroke={c.bg}
                strokeWidth={3}
            />
            <SvgPoint cx={775} cy={557} r={9} fill={blue} stroke={c.bg} strokeWidth={3} />
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
                {label(34, 20, 830, 'A stale scale hides 490 units.', 42)}
                {label(34, 79, 830, 'previous amax = 10 · previous scale S = 10/448', 32, muted)}

                {label(28, 128, 168, 'input x', 32, blue, 'center')}
                {label(237, 128, 200, 'u = x/S', 32, warm, 'center')}
                {label(478, 128, 168, 'clipped q', 32, critical, 'center')}
                {label(703, 128, 168, 'rebuild x̂', 32, green, 'center')}
                {label(38, 194, 148, '500', 44, blue, 'center', true)}
                {label(249, 194, 176, '22,400', 44, warm, 'center', true)}
                {label(488, 194, 148, '448', 44, critical, 'center', true)}
                {label(713, 194, 148, '10', 44, green, 'center', true)}

                {label(34, 294, 830, 'Finite E4M3 code range', 32)}
                {label(350, 342, 400, 'u = 22,400 · off-scale', 32, warm, 'right', true)}
                {label(82, 405, 80, '0', 32, muted, 'center', true)}
                {label(722, 405, 104, '448', 32, critical, 'center', true)}

                {label(34, 458, 830, 'Original-value axis · one shared scale from 0 to 500', 32)}
                {label(136, 508, 190, 'x̂ = 10', 32, green, 'center', true)}
                {label(680, 508, 166, 'x = 500', 32, blue, 'center', true)}
                {label(82, 568, 80, '0', 32, muted, 'center', true)}
                {label(722, 568, 104, '500', 32, muted, 'center', true)}

                {label(34, 613, 830, '490 units lost · 98% relative error', 34, critical)}
                {label(
                    34,
                    658,
                    830,
                    'FP32 accumulation sees 10 × w · isfinite(x̂) = true',
                    32,
                    ink,
                    'left',
                    true,
                )}
            </Board>
        ),
    })
})

export const create = illustration.create
export default illustration.default
