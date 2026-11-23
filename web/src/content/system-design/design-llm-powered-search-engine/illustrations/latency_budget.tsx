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
    'Timeline budget comparing search synthesis latency paths on a 0 to 1000 millisecond scale. In the parallel path, query planning overlaps raw retrieval (0-260 ms), achieving first token at 800 ms and first verified claim at 980 ms. In the serial rewrite-dependent path, retrieval waits for rewrite completion, pushing first token to 840 ms.'

export const numericAnchors = {
    parallel: {
        planning: [0, 40],
        retrieval: [0, 260],
        rerank: [260, 350],
        pack: [350, 370],
        modelPrefill: [370, 800],
        claimGen: [800, 900],
        claimCheck: [900, 980],
        ttft: 800,
        firstVerifiedClaim: 980,
    },
    serial: {
        rewrite: [0, 40],
        retrieval: [40, 300],
        rerank: [300, 390],
        pack: [390, 410],
        modelPrefill: [410, 840],
        ttft: 840,
    },
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 12,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem
            x={x}
            y={y}
            width={w}
            height={Math.min(
                height - y,
                Math.ceil(
                    fontSize *
                        1.4 *
                        Math.max(1, Math.ceil((text.length * fontSize * 0.55) / Math.max(w, 1))),
                ),
            )}
        >
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

    // Scale 0-1000 ms to width 680px (X: 120 -> 800)
    const sx = (ms: number) => 120 + Math.round((ms / 1000) * 680)
    const sw = (start: number, end: number) => Math.max(4, Math.round(((end - start) / 1000) * 680))

    const ticks = [0, 200, 400, 600, 800, 1000]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Path A Bars */}
                    {/* Planning bar: 0 - 40 */}
                    <rect x={sx(0)} y={112} width={sw(0, 40)} height={20} rx={4} fill={blueTone} />
                    {/* Retrieval bar: 0 - 260 */}
                    <rect
                        x={sx(0)}
                        y={140}
                        width={sw(0, 260)}
                        height={20}
                        rx={4}
                        fill={greenTone}
                    />

                    {/* Pipeline composite row A (y=168) */}
                    <rect
                        x={sx(0)}
                        y={168}
                        width={sw(0, 260)}
                        height={26}
                        rx={4}
                        fill={theme === 'dark' ? '#16221c' : '#f0fdf4'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={sx(260)}
                        y={168}
                        width={sw(260, 350)}
                        height={26}
                        rx={4}
                        fill={blueTone}
                    />
                    <rect
                        x={sx(350)}
                        y={168}
                        width={sw(350, 370)}
                        height={26}
                        rx={2}
                        fill={warmTone}
                    />
                    <rect
                        x={sx(370)}
                        y={168}
                        width={sw(370, 800)}
                        height={26}
                        rx={4}
                        fill={purpleTone}
                    />
                    <rect
                        x={sx(800)}
                        y={168}
                        width={sw(800, 900)}
                        height={26}
                        rx={4}
                        fill={warmTone}
                    />
                    <rect
                        x={sx(900)}
                        y={168}
                        width={sw(900, 980)}
                        height={26}
                        rx={4}
                        fill={greenTone}
                    />

                    {/* Milestone lines Path A */}
                    <line
                        x1={sx(800)}
                        y1={168}
                        x2={sx(800)}
                        y2={206}
                        stroke={purpleTone}
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                    />
                    <line
                        x1={sx(980)}
                        y1={168}
                        x2={sx(980)}
                        y2={206}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                    />

                    {/* Path B Bars */}
                    {/* Rewrite bar: 0 - 40 */}
                    <rect x={sx(0)} y={278} width={sw(0, 40)} height={20} rx={4} fill={warmTone} />

                    {/* Pipeline composite row B (y=304) */}
                    <rect
                        x={sx(0)}
                        y={304}
                        width={sw(0, 40)}
                        height={26}
                        rx={4}
                        fill={theme === 'dark' ? '#251b14' : '#fffbeb'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={sx(40)}
                        y={304}
                        width={sw(40, 300)}
                        height={26}
                        rx={4}
                        fill={blueTone}
                    />
                    <rect
                        x={sx(300)}
                        y={304}
                        width={sw(300, 390)}
                        height={26}
                        rx={4}
                        fill={blueTone}
                    />
                    <rect
                        x={sx(390)}
                        y={304}
                        width={sw(390, 410)}
                        height={26}
                        rx={2}
                        fill={warmTone}
                    />
                    <rect
                        x={sx(410)}
                        y={304}
                        width={sw(410, 840)}
                        height={26}
                        rx={4}
                        fill={purpleTone}
                    />

                    {/* Milestone line Path B */}
                    <line
                        x1={sx(840)}
                        y1={304}
                        x2={sx(840)}
                        y2={342}
                        stroke={warmTone}
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                    />

                    {/* Time Axis Line */}
                    <line
                        x1={sx(0)}
                        y1={385}
                        x2={sx(1000)}
                        y2={385}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                    />
                    {ticks.map((t) => (
                        <line
                            key={`tick-line-${t}`}
                            x1={sx(t)}
                            y1={380}
                            x2={sx(t)}
                            y2={390}
                            stroke={c.textMuted}
                            strokeWidth={1.5}
                        />
                    ))}

                    {/* Footer Insight Box */}
                    <rect
                        x={40}
                        y={432}
                        width={780}
                        height={50}
                        rx={8}
                        fill={theme === 'dark' ? '#111e2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'End-to-End Latency Budget: Parallel vs Serial Search Paths',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Streaming search measures two clocks: time-to-first-token (TTFT) and time-to-first-verified-claim',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Path 1: Overlapped Parallel Execution */}
            {label(
                40,
                86,
                780,
                'PATH A: PARALLEL RETRIEVAL (Raw query dispatches concurrently with query planning)',
                12,
                greenTone,
                'left',
                700,
            )}

            {/* Row 1: Planning & Retrieval */}
            {label(40, 114, 75, 'Planning', 11, c.textMuted, 'left', 500)}
            {label(40, 142, 75, 'Raw Retrieval', 11, c.textMuted, 'left', 500)}
            {label(40, 172, 75, 'Pipeline', 11, c.textMuted, 'left', 500)}

            {/* Stage labels inside or above Gantt bars */}
            {label(sx(0), 174, sw(0, 260), '260ms wait', 10, c.textMuted, 'center', 400)}
            {label(sx(260), 174, sw(260, 350), 'Rerank 90ms', 10, blueTone, 'center', 600)}
            {label(
                sx(370),
                174,
                sw(370, 800),
                'Model Prefill & TTFT (430ms)',
                11,
                purpleTone,
                'center',
                600,
            )}
            {label(sx(800), 174, sw(800, 900), 'Claim', 10, warmTone, 'center', 600)}
            {label(sx(900), 174, sw(900, 980), 'Verify', 10, greenTone, 'center', 600)}

            {/* Path 1 Milestone badges */}
            {label(sx(800) - 50, 208, 100, 'TTFT 800ms', 11, purpleTone, 'center', 700)}
            {label(sx(980) - 70, 208, 140, 'First Verified: 980ms', 11, greenTone, 'center', 700)}

            {/* Path 2: Serial Query Rewrite Execution */}
            {label(
                40,
                252,
                780,
                'PATH B: SERIAL DEPENDENT RETRIEVAL (Retrieval waits for LLM query rewrite completion)',
                12,
                warmTone,
                'left',
                700,
            )}

            {label(40, 280, 75, 'Rewrite', 11, c.textMuted, 'left', 500)}
            {label(40, 308, 75, 'Pipeline', 11, c.textMuted, 'left', 500)}

            {label(sx(40), 310, sw(40, 300), 'Retrieval (260ms)', 10, blueTone, 'center', 600)}
            {label(sx(300), 310, sw(300, 390), 'Rerank 90ms', 10, blueTone, 'center', 600)}
            {label(
                sx(410),
                310,
                sw(410, 840),
                'Model Prefill & TTFT (430ms)',
                11,
                purpleTone,
                'center',
                600,
            )}

            {/* Path 2 Milestone badge */}
            {label(sx(840) - 50, 344, 100, 'TTFT 840ms (+40ms)', 11, warmTone, 'center', 700)}

            {/* Timeline X-Axis ticks */}
            {ticks.map((t) => (
                <React.Fragment key={`tick-${t}`}>
                    {label(sx(t) - 30, 400, 60, `${t} ms`, 11, c.textMuted, 'center', 400)}
                </React.Fragment>
            ))}

            {/* Bottom Insight Box */}
            {label(
                52,
                442,
                756,
                'System Trade-off: Parallel Speculation vs Rewritten Recall',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                460,
                756,
                'Dispatching lexical search alongside query planning cuts TTFT by 40 ms; expanded sub-queries merge before reranking.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
