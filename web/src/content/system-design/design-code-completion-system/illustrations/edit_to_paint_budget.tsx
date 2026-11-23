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
    'A shared 0 to 333 millisecond scale compares an immediate serial allocation of 12 parse, 55 transport, 28 context, 78 queue and model through usable span, and 10 paint, totaling 183 with 17 headroom to 200. A second lane adds 150 debounce and ends at 333. TTFT is a request-to-first-token observation inside the path, not another stage. A separate 20-request matrix has rows (100,1), (1,100), then eighteen (1,1). Whole-trace nearest-rank p95 is 101 while the sum of stage p95 values is 2; the allocation does not guarantee measured p95.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const parseTone = getReadableToneColor('blue', c, c.bg)
    const netTone = getReadableToneColor('purple', c, c.bg)
    const ctxTone = getReadableToneColor('green', c, c.bg)
    const modelTone = getReadableToneColor('warm', c, c.bg)
    const paintTone = getReadableToneColor('cyan', c, c.bg)
    const alertTone = getReadableToneColor('critical', c, c.bg)

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

    // Left chart scale: 0 to 350 ms -> 380 px
    const scale = (ms: number) => 48 + (ms * 370) / 350

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left: Waterfall Timelines */}
                    <rect
                        x={24}
                        y={60}
                        width={430}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Timeline 1: Immediate Trigger (183 ms + 17 ms headroom = 200 ms) */}
                    <rect
                        x={scale(0)}
                        y={130}
                        width={scale(12) - scale(0)}
                        height={32}
                        rx={3}
                        fill={parseTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(12)}
                        y={130}
                        width={scale(67) - scale(12)}
                        height={32}
                        rx={3}
                        fill={netTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(67)}
                        y={130}
                        width={scale(95) - scale(67)}
                        height={32}
                        rx={3}
                        fill={ctxTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(95)}
                        y={130}
                        width={scale(173) - scale(95)}
                        height={32}
                        rx={3}
                        fill={modelTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(173)}
                        y={130}
                        width={scale(183) - scale(173)}
                        height={32}
                        rx={3}
                        fill={paintTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(183)}
                        y={130}
                        width={scale(200) - scale(183)}
                        height={32}
                        rx={3}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                    />

                    {/* Timeline 2: Debounced Typing (150 ms debounce + 183 ms execution = 333 ms) */}
                    <rect
                        x={scale(0)}
                        y={225}
                        width={scale(150) - scale(0)}
                        height={32}
                        rx={3}
                        fill={stroke}
                        opacity={0.3}
                    />
                    <rect
                        x={scale(150)}
                        y={225}
                        width={scale(162) - scale(150)}
                        height={32}
                        rx={3}
                        fill={parseTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(162)}
                        y={225}
                        width={scale(217) - scale(162)}
                        height={32}
                        rx={3}
                        fill={netTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(217)}
                        y={225}
                        width={scale(245) - scale(217)}
                        height={32}
                        rx={3}
                        fill={ctxTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(245)}
                        y={225}
                        width={scale(323) - scale(245)}
                        height={32}
                        rx={3}
                        fill={modelTone}
                        opacity={0.85}
                    />
                    <rect
                        x={scale(323)}
                        y={225}
                        width={scale(333) - scale(323)}
                        height={32}
                        rx={3}
                        fill={paintTone}
                        opacity={0.85}
                    />

                    {/* Time axis */}
                    <line
                        x1={scale(0)}
                        y1={285}
                        x2={scale(350)}
                        y2={285}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {[0, 100, 200, 300].map((t) => (
                        <g key={t}>
                            <line
                                x1={scale(t)}
                                y1={285}
                                x2={scale(t)}
                                y2={292}
                                stroke={stroke}
                                strokeWidth={1.5}
                            />
                        </g>
                    ))}

                    {/* Stage breakdown legend box */}
                    <rect
                        x={36}
                        y={320}
                        width={406}
                        height={140}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Right: The p95 Sum Fallacy */}
                    <rect
                        x={474}
                        y={60}
                        width={362}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={486}
                        y={110}
                        width={338}
                        height={230}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Fallacy callout card */}
                    <rect
                        x={486}
                        y={355}
                        width={338}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={alertTone}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Edit-to-Paint Latency Budget & The p95 Summation Fallacy',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(36, 75, 406, 'Serial Budget Breakdown (ms)', 16, c.textPrimary, 'left', 700)}

            {/* Lane 1 labels */}
            {label(
                48,
                106,
                250,
                'Immediate Trigger (e.g. dot/bracket)',
                13,
                parseTone,
                'left',
                650,
            )}
            {label(340, 106, 100, '183 ms total', 13, parseTone, 'right', 650)}

            {/* Lane 2 labels */}
            {label(48, 201, 250, 'Typing with 150 ms Debounce', 13, modelTone, 'left', 650)}
            {label(340, 201, 100, '333 ms total', 13, alertTone, 'right', 650)}

            {/* Axis labels */}
            {[0, 100, 200, 300].map((t) => (
                <React.Fragment key={t}>
                    {label(scale(t) - 20, 296, 40, `${t}ms`, 11, c.textMuted, 'center')}
                </React.Fragment>
            ))}

            {/* Legend breakdown */}
            {label(
                48,
                330,
                382,
                'Latency Stages (Immediate Mode):',
                13,
                c.textPrimary,
                'left',
                650,
            )}
            {label(
                48,
                352,
                382,
                '• 1. Parse AST: 12 ms · 2. Transport RTT: 55 ms',
                12,
                c.textMuted,
            )}
            {label(48, 372, 382, '• 3. Context & FIM Assembly: 28 ms', 12, c.textMuted)}
            {label(48, 392, 382, '• 4. Model Queue + First Token (TTFT): 78 ms', 12, modelTone)}
            {label(
                48,
                412,
                382,
                '• 5. Client Viewport Paint: 10 ms · Headroom: 17 ms',
                12,
                c.textMuted,
            )}
            {label(
                48,
                434,
                382,
                'Total 183 ms satisfies the 200 ms interactive threshold.',
                12,
                parseTone,
                'left',
                600,
            )}

            {/* Right Header */}
            {label(486, 75, 338, 'The Component p95 Trap', 16, alertTone, 'left', 700)}

            {/* Table headers */}
            {label(500, 120, 60, 'Trace', 12, c.textPrimary, 'left', 650)}
            {label(575, 120, 70, 'Stage 1', 12, c.textPrimary, 'center', 650)}
            {label(660, 120, 70, 'Stage 2', 12, c.textPrimary, 'center', 650)}
            {label(745, 120, 65, 'Total', 12, c.textPrimary, 'right', 650)}

            {/* Sample rows */}
            {label(500, 146, 60, 'Req 1', 12, c.textMuted)}
            {label(575, 146, 70, '100 ms', 12, alertTone, 'center')}
            {label(660, 146, 70, '1 ms', 12, c.textMuted, 'center')}
            {label(745, 146, 65, '101 ms', 12, alertTone, 'right', 600)}

            {label(500, 172, 60, 'Req 2', 12, c.textMuted)}
            {label(575, 172, 70, '1 ms', 12, c.textMuted, 'center')}
            {label(660, 172, 70, '100 ms', 12, alertTone, 'center')}
            {label(745, 172, 65, '101 ms', 12, alertTone, 'right', 600)}

            {label(500, 198, 60, 'Req 3..20', 12, c.textMuted)}
            {label(575, 198, 70, '1 ms', 12, c.textMuted, 'center')}
            {label(660, 198, 70, '1 ms', 12, c.textMuted, 'center')}
            {label(745, 198, 65, '2 ms', 12, c.textMuted, 'right')}

            {/* Percentile results */}
            {label(
                500,
                240,
                310,
                'Stage 1 p95: 1 ms · Stage 2 p95: 1 ms',
                13,
                parseTone,
                'left',
                600,
            )}
            {label(
                500,
                265,
                310,
                'Sum of Stage p95s = 1 ms + 1 ms = 2 ms',
                13,
                parseTone,
                'left',
                600,
            )}
            {label(
                500,
                295,
                310,
                'TRUE End-to-End Trace p95 = 101 ms!',
                14,
                alertTone,
                'left',
                700,
            )}

            {/* Fallacy Card Text */}
            {label(500, 365, 310, 'Never Sum Component Percentiles', 14, alertTone, 'left', 700)}
            {label(
                500,
                390,
                310,
                '• Independent jitter across stages shifts the joint tail.',
                12,
                c.textMuted,
            )}
            {label(
                500,
                412,
                310,
                '• Summing p95s drastically underestimates true latency.',
                12,
                c.textMuted,
            )}
            {label(
                500,
                434,
                310,
                '• Always measure end-to-end trace timers on clients.',
                12,
                alertTone,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
