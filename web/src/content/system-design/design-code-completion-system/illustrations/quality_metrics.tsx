import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'Four distinct shown suggestion objects share a 0 to 42 character scale. A inserts 18 and retains zero, so its entire 18-character span is hatched as deleted. B inserts and retains 4. C inserts 42, with 35 retained and 7 deleted. D is shown but inserts and retains zero, so it paints no span. Three of four shown suggestions have any acceptance, or 75 percent. Thirty-nine of 64 inserted characters remain, or 60.9375 percent. Partial accepts count one suggestion ID; unobserved windows are censored.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const keptTone = getReadableToneColor('green', c, c.bg)
    const delTone = getReadableToneColor('critical', c, c.bg)
    const barScale = 340 / 45 // 45 chars max

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={weight}
            />
        </CanvasItem>
    )

    const rows = [
        { id: 'Suggestion A', ins: 18, kept: 0, del: 18 },
        { id: 'Suggestion B', ins: 4, kept: 4, del: 0 },
        { id: 'Suggestion C', ins: 42, kept: 35, del: 7 },
        { id: 'Suggestion D', ins: 0, kept: 0, del: 0 },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left: Stacked Bar Chart */}
                    <rect
                        x={24}
                        y={60}
                        width={470}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* 4 Suggestions */}
                    {rows.map((r, i) => {
                        const y = 120 + i * 75
                        const keptW = r.kept * barScale
                        const delW = r.del * barScale
                        return (
                            <g key={r.id}>
                                <rect
                                    x={36}
                                    y={y}
                                    width={446}
                                    height={60}
                                    rx={6}
                                    fill={c.bgCardAlt}
                                    stroke={stroke}
                                    strokeWidth={1}
                                />
                                {/* Kept portion */}
                                {r.kept > 0 && (
                                    <rect
                                        x={140}
                                        y={y + 15}
                                        width={keptW}
                                        height={30}
                                        rx={3}
                                        fill={keptTone}
                                        opacity={0.85}
                                    />
                                )}
                                {/* Deleted portion */}
                                {r.del > 0 && (
                                    <rect
                                        x={140 + keptW}
                                        y={y + 15}
                                        width={delW}
                                        height={30}
                                        rx={3}
                                        fill={delTone}
                                        opacity={0.85}
                                    />
                                )}
                            </g>
                        )
                    })}

                    {/* Scale axis */}
                    <line
                        x1={140}
                        y1={425}
                        x2={140 + 42 * barScale}
                        y2={425}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {[0, 10, 20, 30, 40].map((tick) => (
                        <line
                            key={tick}
                            x1={140 + tick * barScale}
                            y1={425}
                            x2={140 + tick * barScale}
                            y2={432}
                            stroke={stroke}
                            strokeWidth={1.5}
                        />
                    ))}

                    {/* Right: Metrics & Insights Panel */}
                    <rect
                        x={514}
                        y={60}
                        width={322}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Metric 1: Acceptance Rate */}
                    <rect
                        x={526}
                        y={110}
                        width={298}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1.2}
                    />

                    {/* Metric 2: Retention Rate */}
                    <rect
                        x={526}
                        y={230}
                        width={298}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={keptTone}
                        strokeWidth={2}
                    />

                    {/* Insight Card */}
                    <rect
                        x={526}
                        y={350}
                        width={298}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Code Completion Quality Metrics · Suggestion Acceptance vs Character Retention',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(
                36,
                75,
                446,
                'Telemetry Cohort (Chars Inserted vs Chars Retained After 60s)',
                16,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Rows */}
            {rows.map((r, i) => {
                const y = 120 + i * 75
                return (
                    <React.Fragment key={r.id}>
                        {label(48, y + 10, 85, r.id, 13, c.textPrimary, 'left', 650)}
                        {label(48, y + 32, 85, `${r.ins} chars`, 11, c.textMuted)}
                        {r.ins === 0 ? (
                            label(
                                140,
                                y + 20,
                                120,
                                '0 (Rejected / Ignored)',
                                12,
                                delTone,
                                'left',
                                600,
                            )
                        ) : (
                            <React.Fragment>
                                {r.kept > 0 &&
                                    label(
                                        145,
                                        y + 20,
                                        80,
                                        `${r.kept} kept`,
                                        11,
                                        c.textPrimary,
                                        'left',
                                        600,
                                    )}
                                {r.del > 0 &&
                                    label(
                                        140 + r.kept * barScale + 8,
                                        y + 20,
                                        80,
                                        `${r.del} deleted`,
                                        11,
                                        c.textPrimary,
                                        'left',
                                        600,
                                    )}
                            </React.Fragment>
                        )}
                    </React.Fragment>
                )
            })}

            {/* Scale ticks */}
            {[0, 10, 20, 30, 40].map((tick) => (
                <React.Fragment key={tick}>
                    {label(
                        140 + tick * barScale - 15,
                        436,
                        30,
                        `${tick}`,
                        10,
                        c.textMuted,
                        'center',
                    )}
                </React.Fragment>
            ))}
            {label(
                140 + 20 * barScale,
                452,
                150,
                'Characters inserted →',
                11,
                c.textMuted,
                'center',
            )}

            {/* Right Header */}
            {label(526, 75, 298, 'Cohort Telemetry Metrics', 16, c.textPrimary, 'left', 700)}

            {/* Metric 1 */}
            {label(538, 120, 274, 'Suggestion Acceptance Rate', 13, c.textPrimary, 'left', 650)}
            {label(
                538,
                142,
                274,
                '3 / 4 Suggestions Accepted = 75.0%',
                15,
                c.textPrimary,
                'left',
                700,
            )}
            {label(538, 172, 274, 'Measures initial Tab keypress frequency.', 11, c.textMuted)}

            {/* Metric 2 */}
            {label(
                538,
                240,
                274,
                'Character Retention Rate (Surviving)',
                13,
                keptTone,
                'left',
                650,
            )}
            {label(538, 262, 274, '39 / 64 Characters Retained = 60.9%', 15, keptTone, 'left', 700)}
            {label(
                538,
                292,
                274,
                'Tracks characters still present after 60s edit window.',
                11,
                c.textMuted,
            )}

            {/* Insight */}
            {label(538, 360, 274, 'Why Acceptance Rate Misleads', 13, c.textPrimary, 'left', 700)}
            {label(
                538,
                385,
                274,
                'Suggestion A was accepted (18 chars), but deleted moments later (0 chars retained).',
                11,
                delTone,
            )}
            {label(
                538,
                420,
                274,
                'True developer value requires measuring delayed character retention windows.',
                11,
                keptTone,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
