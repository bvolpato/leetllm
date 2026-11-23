import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    type ThemeMode,
} from 'vizmatic'

export const alt =
    'Foreign-key references point upward from chunk c7a to document d7, then to workspace w01, Acme Cloud. Permission and embedding row fragments below c7a both store chunk_id = c7a and point directly to that chunk. The stored values recover the paragraph’s exact source and owner.'
export const width = 592
export const height = 684
export const preset = 'engineering'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const purple = getReadableToneColor('purple', c),
        green = getReadableToneColor('green', c)
    const cyan = getReadableToneColor('cyan', c),
        warm = getReadableToneColor('warm', c)
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        size = 22,
        color = c.textPrimary,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={34}>
            <TextLabel c={c} text={text} fontSize={size} color={color} />
        </CanvasItem>
    )
    const rows = [
        {
            x: 153,
            y: 16,
            name: 'workspaces · w01',
            field: 'Acme Cloud',
            color: getReadableToneColor('blue', c),
        },
        { x: 153, y: 190, name: 'documents · d7', field: 'workspace_id = w01', color: purple },
        { x: 153, y: 364, name: 'chunks · c7a', field: 'document_id = d7', color: green },
        { x: 16, y: 548, name: 'permission', field: 'chunk_id = c7a', color: cyan },
        { x: 294, y: 548, name: 'embedding', field: 'chunk_id = c7a', color: warm },
    ]
    return (
        <Scene c={c} padding={0} gap={0}>
            <Board c={c} width={560} height={652}>
                <CanvasItem x={0} y={0} width={560} height={652}>
                    <svg width={560} height={652} viewBox="0 0 560 652">
                        {rows.map((row) => (
                            <React.Fragment key={row.name}>
                                <rect
                                    x={row.x}
                                    y={row.y}
                                    width={250}
                                    height={90}
                                    rx={5}
                                    fill={c.bgSubtle}
                                    stroke={row.color}
                                    strokeWidth={1.8}
                                />
                                <line
                                    x1={row.x}
                                    y1={row.y + 45}
                                    x2={row.x + 250}
                                    y2={row.y + 45}
                                    stroke={c.borderLight}
                                />
                            </React.Fragment>
                        ))}
                        <VectorArrow
                            x1={278}
                            y1={188}
                            x2={278}
                            y2={110}
                            color={purple}
                            strokeWidth={2.5}
                            arrowSize={6}
                        />
                        <VectorArrow
                            x1={278}
                            y1={362}
                            x2={278}
                            y2={284}
                            color={green}
                            strokeWidth={2.5}
                            arrowSize={6}
                        />
                        <path
                            d="M 141 546 V 501 H 228 V 460"
                            fill="none"
                            stroke={cyan}
                            strokeWidth={2.5}
                        />
                        <VectorArrow
                            x1={228}
                            y1={485}
                            x2={228}
                            y2={458}
                            color={cyan}
                            strokeWidth={2.5}
                            arrowSize={6}
                        />
                        <path
                            d="M 419 546 V 501 H 328 V 460"
                            fill="none"
                            stroke={warm}
                            strokeWidth={2.5}
                        />
                        <VectorArrow
                            x1={328}
                            y1={485}
                            x2={328}
                            y2={458}
                            color={warm}
                            strokeWidth={2.5}
                            arrowSize={6}
                        />
                    </svg>
                </CanvasItem>
                {rows.map((row) => (
                    <React.Fragment key={row.name}>
                        {label(row.x + 14, row.y + 8, 224, row.name, 24, row.color)}
                        {label(row.x + 14, row.y + 51, 224, row.field)}
                    </React.Fragment>
                ))}
            </Board>
        </Scene>
    )
}

export default create('dark')
