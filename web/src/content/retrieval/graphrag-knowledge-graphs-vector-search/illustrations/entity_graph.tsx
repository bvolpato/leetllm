import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 730
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'Three supplied identities form a directed path: inference-api is a Service, Redis Cache is a Datastore, and Old Maxmemory Policy is a ConfigPolicy. The depends_on edge cites source 1842; the uses_policy edge cites source 2031. The reviewed Redis Cache identity carries both source IDs.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const service = getReadableToneColor('blue', c, c.bg)
    const datastore = getReadableToneColor('green', c, c.bg)
    const policy = getReadableToneColor('warm', c, c.bg)
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 20,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={fontWeight}
            />
        </CanvasItem>
    )

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={42}
                        y={106}
                        width={476}
                        height={94}
                        rx={8}
                        fill={c.bgCard}
                        stroke={service}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={42}
                        y={290}
                        width={476}
                        height={104}
                        rx={8}
                        fill={c.bgCard}
                        stroke={datastore}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={42}
                        y={484}
                        width={476}
                        height={94}
                        rx={8}
                        fill={c.bgCard}
                        stroke={policy}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={42}
                        y={106}
                        width={9}
                        height={94}
                        rx={4}
                        fill={service}
                        stroke={service}
                    />
                    <SvgFrame
                        c={c}
                        x={42}
                        y={290}
                        width={9}
                        height={104}
                        rx={4}
                        fill={datastore}
                        stroke={datastore}
                    />
                    <SvgFrame
                        c={c}
                        x={42}
                        y={484}
                        width={9}
                        height={94}
                        rx={4}
                        fill={policy}
                        stroke={policy}
                    />
                    <VectorArrow
                        x1={280}
                        y1={202}
                        x2={280}
                        y2={269}
                        color={service}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={280}
                        y1={396}
                        x2={280}
                        y2={463}
                        color={datastore}
                        strokeWidth={3}
                        arrowSize={5}
                    />
                </svg>
            </CanvasItem>
            {label(20, 10, 520, 'Follow the source-backed edges', 29, c.textPrimary, 'left', 700)}
            {label(20, 52, 520, 'One supplied identity path · two records', 19, c.textSecondary)}

            {label(66, 119, 428, 'inference-api', 27, c.textPrimary, 'center', 700)}
            {label(66, 158, 428, 'Service', 19, service, 'center', 600)}

            {label(306, 210, 220, 'depends_on', 21, service, 'left', 700)}
            {label(306, 238, 220, 'source 1842', 20, c.textSecondary)}

            {label(66, 301, 428, 'Redis Cache', 27, c.textPrimary, 'center', 700)}
            {label(66, 343, 428, 'Datastore · sources 1842, 2031', 19, datastore, 'center', 600)}

            {label(306, 403, 220, 'uses_policy', 21, datastore, 'left', 700)}
            {label(306, 431, 220, 'source 2031', 20, c.textSecondary)}

            {label(66, 497, 428, 'Old Maxmemory Policy', 25, c.textPrimary, 'center', 700)}
            {label(66, 536, 428, 'ConfigPolicy', 19, policy, 'center', 600)}
        </Board>
    )
}

export default create('dark')
