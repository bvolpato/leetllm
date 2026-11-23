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
    'The seven chunk_permissions rows appear in insertion order on the left and in principal, chunk_id index order on the right. A scan visits all seven rows. A seek reaches the contiguous agent:u3 range containing c7-old, c7a, c7b, and c99. After chunk and document joins, validity removes c7-old and workspace removes c99. Both paths return c7a and c7b. The counts measure candidate entries, not disk reads or elapsed time.'
export const width = 592
export const height = 714
export const preset = 'engineering'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const blue = getReadableToneColor('blue', c),
        purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c),
        red = getReadableToneColor('critical', c)
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        color = c.textPrimary,
        size = 22,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={32}>
            <TextLabel c={c} text={text} fontSize={size} color={color} />
        </CanvasItem>
    )
    const stored = [
        ['c7-old', 'agent:u3'],
        ['c7a', 'agent:u1'],
        ['c7a', 'agent:u3'],
        ['c7b', 'agent:u1'],
        ['c7b', 'agent:u3'],
        ['c9a', 'agent:u1'],
        ['c99', 'agent:u3'],
    ]
    const indexed = [
        ['agent:u1', 'c7a'],
        ['agent:u1', 'c7b'],
        ['agent:u1', 'c9a'],
        ['agent:u3', 'c7-old'],
        ['agent:u3', 'c7a'],
        ['agent:u3', 'c7b'],
        ['agent:u3', 'c99'],
    ]
    return (
        <Scene c={c} padding={0} gap={0}>
            <Board c={c} width={560} height={682}>
                <CanvasItem x={0} y={0} width={560} height={682}>
                    <svg width={560} height={682} viewBox="0 0 560 682">
                        {stored.map((row, i) => (
                            <rect
                                key={`s${i}`}
                                x={28}
                                y={160 + i * 42}
                                width={230}
                                height={38}
                                rx={3}
                                fill={c.bgSubtle}
                                stroke={c.borderLight}
                            />
                        ))}
                        {indexed.map((row, i) => (
                            <rect
                                key={`i${i}`}
                                x={304}
                                y={160 + i * 42}
                                width={230}
                                height={38}
                                rx={3}
                                fill={c.bgSubtle}
                                stroke={i >= 3 ? purple : c.borderLight}
                                strokeWidth={i >= 3 ? 2 : 1}
                            />
                        ))}
                        <VectorArrow
                            x1={14}
                            y1={165}
                            x2={14}
                            y2={448}
                            color={blue}
                            strokeWidth={2}
                            arrowSize={5}
                        />
                        <path
                            d="M 285 135 V 305 H 302"
                            fill="none"
                            stroke={purple}
                            strokeWidth={2.5}
                        />
                        <VectorArrow
                            x1={285}
                            y1={305}
                            x2={302}
                            y2={305}
                            color={purple}
                            strokeWidth={2.5}
                            arrowSize={5}
                        />
                        <VectorArrow
                            x1={145}
                            y1={505}
                            x2={145}
                            y2={538}
                            color={blue}
                            strokeWidth={2}
                            arrowSize={5}
                        />
                        <VectorArrow
                            x1={419}
                            y1={505}
                            x2={419}
                            y2={538}
                            color={purple}
                            strokeWidth={2}
                            arrowSize={5}
                        />
                        <line
                            x1={26}
                            y1={543}
                            x2={534}
                            y2={543}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                    </svg>
                </CanvasItem>
                {label(26, 12, 510, 'Bob = agent:u3', c.textPrimary, 26)}
                {label(26, 51, 510, 'permission_principal_idx', c.textSecondary)}
                {label(28, 100, 230, 'Scan · 7 rows', blue, 24)}
                {label(304, 100, 230, 'Seek · 4 entries', purple, 24)}
                {label(40, 132, 115, 'chunk', c.textSecondary, 20)}
                {label(145, 132, 112, 'principal', c.textSecondary, 20)}
                {label(314, 132, 112, 'principal', c.textSecondary, 20)}
                {label(430, 132, 100, 'chunk', c.textSecondary, 20)}
                {stored.map(([chunk, principal], i) => (
                    <React.Fragment key={`sl${i}`}>
                        {label(40, 164 + i * 42, 112, chunk)}
                        {label(
                            145,
                            164 + i * 42,
                            112,
                            principal,
                            principal === 'agent:u3' ? blue : c.textSecondary,
                        )}
                    </React.Fragment>
                ))}
                {indexed.map(([principal, chunk], i) => (
                    <React.Fragment key={`il${i}`}>
                        {label(
                            314,
                            164 + i * 42,
                            112,
                            principal,
                            principal === 'agent:u3' ? purple : c.textSecondary,
                        )}
                        {label(
                            430,
                            164 + i * 42,
                            100,
                            chunk,
                            principal === 'agent:u3' ? purple : c.textSecondary,
                        )}
                    </React.Fragment>
                ))}
                {label(36, 471, 220, '4 Bob matches', blue)}
                {label(314, 471, 220, '4 Bob matches', purple)}
                {label(47, 552, 466, 'Join chunks + documents · filter', c.textPrimary, 24)}
                {label(34, 603, 215, 'c7-old · retired', red, 20)}
                {label(336, 603, 205, 'c99 · in w02', red, 20)}
                {label(190, 639, 200, 'c7a    c7b', green, 26)}
            </Board>
        </Scene>
    )
}

export default create('dark')
