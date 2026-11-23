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
    'A captured editor snapshot S contains document, version, selection and policy, and a request epoch travels with each candidate. Three concrete triggers route differently: Polic uses local lexical completion to PolicyGraph; graph. uses local semantic type members when receiver type information is available; is_allowed equals may use remote FIM with upload permission. All results rejoin the same current-snapshot gate before ghost text and version-checked Tab insertion. A separate plan, edit, test, review loop depicts the slower multi-file coding agent.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const lexTone = getReadableToneColor('blue', c, c.bg)
    const semTone = getReadableToneColor('purple', c, c.bg)
    const fimTone = getReadableToneColor('green', c, c.bg)
    const dropTone = getReadableToneColor('critical', c, c.bg)

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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left: Completion Lanes & Freshness Gate */}
                    <rect
                        x={24}
                        y={60}
                        width={530}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Snapshot Header */}
                    <rect
                        x={36}
                        y={105}
                        width={506}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* 3 Triggers & Lanes */}
                    {/* Lane 1: Lexical */}
                    <rect
                        x={36}
                        y={170}
                        width={220}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={lexTone}
                        strokeWidth={1.5}
                    />
                    <line x1={256} y1={195} x2={300} y2={195} stroke={lexTone} strokeWidth={2} />
                    <rect
                        x={300}
                        y={170}
                        width={242}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={lexTone}
                        strokeWidth={1.5}
                    />

                    {/* Lane 2: Semantic */}
                    <rect
                        x={36}
                        y={230}
                        width={220}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={semTone}
                        strokeWidth={1.5}
                    />
                    <line x1={256} y1={255} x2={300} y2={255} stroke={semTone} strokeWidth={2} />
                    <rect
                        x={300}
                        y={230}
                        width={242}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={semTone}
                        strokeWidth={1.5}
                    />

                    {/* Lane 3: Remote FIM */}
                    <rect
                        x={36}
                        y={290}
                        width={220}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={fimTone}
                        strokeWidth={1.5}
                    />
                    <line x1={256} y1={315} x2={300} y2={315} stroke={fimTone} strokeWidth={2} />
                    <rect
                        x={300}
                        y={290}
                        width={242}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={fimTone}
                        strokeWidth={1.5}
                    />

                    {/* Rejoin bus into Freshness Gate */}
                    <line x1={542} y1={195} x2={552} y2={195} stroke={stroke} strokeWidth={1.5} />
                    <line x1={542} y1={255} x2={552} y2={255} stroke={stroke} strokeWidth={1.5} />
                    <line x1={542} y1={315} x2={552} y2={315} stroke={stroke} strokeWidth={1.5} />
                    <line x1={552} y1={195} x2={552} y2={390} stroke={stroke} strokeWidth={1.5} />
                    <line x1={552} y1={390} x2={536} y2={390} stroke={stroke} strokeWidth={1.5} />

                    {/* Freshness Gate */}
                    <rect
                        x={36}
                        y={355}
                        width={506}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={semTone}
                        strokeWidth={1.5}
                    />

                    {/* Right: Multi-File Coding Agent Loop */}
                    <rect
                        x={574}
                        y={60}
                        width={262}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {['1. Plan', '2. Edit', '3. Test', '4. Review'].map((step, i) => (
                        <g key={step}>
                            <rect
                                x={594}
                                y={115 + i * 75}
                                width={222}
                                height={55}
                                rx={6}
                                fill={c.bgCardAlt}
                                stroke={stroke}
                                strokeWidth={1.2}
                            />
                            {i < 3 && (
                                <line
                                    x1={705}
                                    y1={170 + i * 75}
                                    x2={705}
                                    y2={190 + i * 75}
                                    stroke={stroke}
                                    strokeWidth={1.5}
                                />
                            )}
                        </g>
                    ))}
                    {/* Return loop line */}
                    <path
                        d="M 594 367 H 584 V 142 H 594"
                        fill="none"
                        stroke={stroke}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Code Completion Engine · Multi-Lane Routing & Snapshot Freshness',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(
                36,
                75,
                506,
                'Inline Suggestion Engine (<200 ms latency envelope)',
                17,
                lexTone,
                'left',
                700,
            )}

            {/* Snapshot Box */}
            {label(
                48,
                114,
                482,
                'Captured Snapshot S: Document URI · Version V · Caret Offset · Epoch',
                14,
                c.textPrimary,
                'left',
                650,
            )}
            {label(
                48,
                134,
                482,
                'Request epoch and exact caret coordinates travel with every suggestion candidate',
                12,
                c.textMuted,
            )}

            {/* Lane 1 */}
            {label(48, 178, 196, 'Input: Polic|', 13, lexTone, 'left', 650)}
            {label(48, 198, 196, 'Exact prefix token', 11, c.textMuted)}
            {label(312, 178, 218, 'Local Lexical Index', 13, lexTone, 'left', 650)}
            {label(312, 198, 218, 'PolicyGraph (<5 ms lookup)', 11, c.textPrimary)}

            {/* Lane 2 */}
            {label(48, 238, 196, 'Input: graph.|', 13, semTone, 'left', 650)}
            {label(48, 258, 196, 'Member trigger', 11, c.textMuted)}
            {label(312, 238, 218, 'Language Server (LSP)', 13, semTone, 'left', 650)}
            {label(312, 258, 218, 'Type members (<20 ms ast)', 11, c.textPrimary)}

            {/* Lane 3 */}
            {label(48, 298, 196, 'Input: is_allowed = |', 13, fimTone, 'left', 650)}
            {label(48, 318, 196, 'General expression', 11, c.textMuted)}
            {label(312, 298, 218, 'Remote Fill-In-the-Middle', 13, fimTone, 'left', 650)}
            {label(312, 318, 218, 'LLM prefix+suffix (<150 ms)', 11, c.textPrimary)}

            {/* Freshness Gate */}
            {label(
                48,
                365,
                482,
                'Editor Freshness Gate: Current S == Candidate S?',
                15,
                semTone,
                'left',
                700,
            )}
            {label(
                48,
                390,
                482,
                '• Caret moved or key typed during inference → DISCARD candidate immediately',
                12,
                dropTone,
            )}
            {label(
                48,
                410,
                482,
                '• Matches current buffer → Paint ghost text in editor viewport',
                12,
                c.textPrimary,
            )}
            {label(
                48,
                430,
                482,
                '• User presses Tab → Atomic version-checked insertion',
                12,
                fimTone,
                'left',
                600,
            )}

            {/* Right Header */}
            {label(584, 75, 242, 'Coding Agent Loop', 17, c.textPrimary, 'left', 700)}
            {label(604, 125, 202, '1. Plan (Goal decomposition)', 13, c.textPrimary, 'left', 600)}
            {label(604, 145, 202, 'LLM generates edits', 11, c.textMuted)}

            {label(604, 200, 202, '2. Edit (Multi-file patches)', 13, c.textPrimary, 'left', 600)}
            {label(604, 220, 202, 'Applies diffs to workspace', 11, c.textMuted)}

            {label(604, 275, 202, '3. Test (Test suite & linter)', 13, c.textPrimary, 'left', 600)}
            {label(604, 295, 202, 'Validates execution in sandbox', 11, c.textMuted)}

            {label(604, 350, 202, '4. Review (PR / Feedback)', 13, c.textPrimary, 'left', 600)}
            {label(604, 370, 202, 'Developer accepts changes', 11, c.textMuted)}

            {label(
                584,
                435,
                242,
                'Seconds to minutes scale vs 150 ms inline typing',
                11,
                c.textMuted,
                'center',
            )}
        </Board>
    )
}

export default create('dark')
