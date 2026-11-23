import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const opaqueBackground = true
export const width = 640
export const height = 835
export const alt =
    'Ray Serve routes each request to an LLMServer actor inside a logical engine replica. Its engine client invokes the inference engine and GPU workers. Ray places workers and scales replicas; the engine schedules token batches, KV state and kernels. Dashed telemetry from the engine informs replica routing.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    size = 24,
    color = c.textPrimary,
    weight = 500,
    align: 'left' | 'center' | 'right' = 'center',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * 1.6,
        children: (
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={size}
                fontWeight={weight}
                color={color}
                align={align}
            />
        ),
    })
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (_name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') => c.bgCard
    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        <rect
                            x="120"
                            y="110"
                            width="370"
                            height="100"
                            rx="9"
                            fill={fill('blue')}
                            stroke={tone('blue')}
                            strokeWidth="2"
                        />
                        <rect
                            x="100"
                            y="290"
                            width="410"
                            height="400"
                            rx="10"
                            fill="none"
                            stroke={tone('purple')}
                            strokeWidth="2"
                        />
                        <rect
                            x="130"
                            y="355"
                            width="350"
                            height="100"
                            rx="9"
                            fill={fill('purple')}
                            stroke={tone('purple')}
                            strokeWidth="2"
                        />
                        <rect
                            x="130"
                            y="540"
                            width="350"
                            height="110"
                            rx="9"
                            fill={fill('green')}
                            stroke={tone('green')}
                            strokeWidth="2"
                        />
                        <path
                            d="M305 210 H75 V235 M75 290 V405 H130"
                            fill="none"
                            stroke={tone('blue')}
                            strokeWidth="2"
                        />
                        <VectorArrow
                            x1={115}
                            y1={405}
                            x2={130}
                            y2={405}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={305}
                            y1={455}
                            x2={305}
                            y2={540}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <path
                            d="M480 595 H590 V455 M590 365 V160 H490"
                            fill="none"
                            stroke={tone('green')}
                            strokeWidth="2"
                            strokeDasharray="7 5"
                        />
                    </svg>
                ),
            }),
            label(
                c,
                'Replica routing and token work have owners',
                20,
                20,
                600,
                28,
                c.textPrimary,
                700,
            ),
            label(c, 'Ray Serve', 130, 122, 350, 28, tone('blue'), 650),
            label(c, 'HTTP ingress + routing', 130, 166, 350, 24, c.textSecondary),
            label(c, 'Request', 10, 245, 110, 23, tone('blue'), 650, 'left'),
            label(c, 'Logical engine replica', 110, 304, 390, 25, tone('purple'), 650),
            label(c, 'LLMServer actor', 140, 368, 330, 27, tone('purple'), 650),
            label(c, 'engine client', 140, 413, 330, 24, c.textSecondary),
            label(c, 'Execute', 325, 483, 180, 24, tone('purple'), 650, 'left'),
            label(c, 'Engine + GPU workers', 140, 552, 330, 26, tone('green'), 650),
            label(c, 'token batches · KV · kernels', 140, 597, 330, 23, c.textSecondary),
            label(c, 'Routing', 510, 375, 115, 22, tone('green'), 650),
            label(c, 'telemetry', 510, 410, 115, 22, tone('green'), 650),
            label(
                c,
                'Ray places GPU workers and scales replicas',
                25,
                735,
                590,
                25,
                c.textPrimary,
                650,
            ),
            label(c, 'Engine workers can span processes', 25, 785, 590, 24, c.textSecondary),
        ],
    })
}

export default create()
