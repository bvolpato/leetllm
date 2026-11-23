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
    'Ordered local handler state. Typing r, o and dot creates snapshots with request epochs 1, 2 and 3, document versions 1, 2 and 3 and caret offsets 1, 2 and 3 under policy epoch 7. The first two 150 ms debounce tasks are canceled. Only request 3 is sent, immediately. A paint gate checks both request epoch and the entire editor snapshot: completion-3 paints, while late epoch 2 is dropped. A cursor move sets epoch 4, version 3 and selection (0,0), clears the ghost and sends nothing. Late epoch 3 drops; fresh at epoch 4 paints. Policy 7 to 8 sets epoch 5, clears the ghost, and sends nothing. Tab checks freshness and requires a version-checked insertion.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const sendTone = getReadableToneColor('green', c, c.bg)
    const cancelTone = getReadableToneColor('critical', c, c.bg)
    const gateTone = getReadableToneColor('purple', c, c.bg)
    const moveTone = getReadableToneColor('warm', c, c.bg)

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
                    {/* Left: Keystroke Sequence & Debounce Invalidation */}
                    <rect
                        x={24}
                        y={60}
                        width={400}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Step 1: Type 'r' */}
                    <rect
                        x={36}
                        y={110}
                        width={376}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={cancelTone}
                        strokeWidth={1.2}
                    />
                    <line
                        x1={260}
                        y1={140}
                        x2={295}
                        y2={140}
                        stroke={cancelTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={295}
                        y={120}
                        width={105}
                        height={40}
                        rx={4}
                        fill={c.bgCard}
                        stroke={cancelTone}
                        strokeWidth={1}
                    />

                    {/* Step 2: Type 'o' */}
                    <rect
                        x={36}
                        y={185}
                        width={376}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={cancelTone}
                        strokeWidth={1.2}
                    />
                    <line
                        x1={260}
                        y1={215}
                        x2={295}
                        y2={215}
                        stroke={cancelTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={295}
                        y={195}
                        width={105}
                        height={40}
                        rx={4}
                        fill={c.bgCard}
                        stroke={cancelTone}
                        strokeWidth={1}
                    />

                    {/* Step 3: Type '.' (trigger char) */}
                    <rect
                        x={36}
                        y={260}
                        width={376}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={sendTone}
                        strokeWidth={2}
                    />
                    <line x1={260} y1={290} x2={295} y2={290} stroke={sendTone} strokeWidth={2} />
                    <rect
                        x={295}
                        y={270}
                        width={105}
                        height={40}
                        rx={4}
                        fill={c.bgCard}
                        stroke={sendTone}
                        strokeWidth={1}
                    />

                    {/* Step 4: Arrow Key / Caret Move */}
                    <rect
                        x={36}
                        y={335}
                        width={376}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={moveTone}
                        strokeWidth={1.2}
                    />
                    <line x1={260} y1={365} x2={295} y2={365} stroke={moveTone} strokeWidth={1.5} />
                    <rect
                        x={295}
                        y={345}
                        width={105}
                        height={40}
                        rx={4}
                        fill={c.bgCard}
                        stroke={moveTone}
                        strokeWidth={1}
                    />

                    {/* Left footer note */}
                    <rect
                        x={36}
                        y={405}
                        width={376}
                        height={58}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Right: Dual Gate Verification (Paint & Tab) */}
                    <rect
                        x={444}
                        y={60}
                        width={392}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Paint Gate */}
                    <rect
                        x={456}
                        y={110}
                        width={368}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={gateTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={468}
                        y={150}
                        width={344}
                        height={50}
                        rx={4}
                        fill={c.bgCard}
                        stroke={sendTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={468}
                        y={210}
                        width={344}
                        height={50}
                        rx={4}
                        fill={c.bgCard}
                        stroke={cancelTone}
                        strokeWidth={1}
                    />

                    {/* Tab Gate */}
                    <rect
                        x={456}
                        y={295}
                        width={368}
                        height={168}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={gateTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={468}
                        y={340}
                        width={344}
                        height={110}
                        rx={4}
                        fill={c.bgCard}
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
                'Editor Snapshot Freshness · Debounce Invalidation & Dual Verification Gates',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(
                36,
                75,
                376,
                '1. Keystroke Stream & Debounce Lifecycle',
                16,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Step 1 */}
            {label(
                48,
                120,
                200,
                "Type 'r' (Epoch e=1, v=1, pos=1)",
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(48, 142, 200, '150 ms debounce armed', 11, c.textMuted)}
            {label(295, 132, 105, "Canceled by 'o'", 11, cancelTone, 'center', 600)}

            {/* Step 2 */}
            {label(
                48,
                195,
                200,
                "Type 'o' (Epoch e=2, v=2, pos=2)",
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(48, 217, 200, '150 ms debounce armed', 11, c.textMuted)}
            {label(295, 207, 105, "Canceled by '.'", 11, cancelTone, 'center', 600)}

            {/* Step 3 */}
            {label(48, 270, 200, "Type '.' (Epoch e=3, v=3, pos=3)", 12, sendTone, 'left', 700)}
            {label(48, 292, 200, 'Trigger char: 0 ms delay', 11, sendTone)}
            {label(295, 282, 105, 'Sent to Model', 11, sendTone, 'center', 700)}

            {/* Step 4 */}
            {label(48, 345, 200, 'Caret Move (Epoch e=4, pos=0)', 12, moveTone, 'left', 650)}
            {label(48, 367, 200, 'User jumps to start of line', 11, c.textMuted)}
            {label(295, 357, 105, 'Ghost Cleared', 11, moveTone, 'center', 600)}

            {/* Left note */}
            {label(
                48,
                415,
                352,
                'Sent Requests: [e=3] · Shown Suggestions: [completion-3]',
                11,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                48,
                435,
                352,
                'Debounce prevents firing unneeded inference on intermediate keystrokes.',
                10,
                c.textMuted,
            )}

            {/* Right Header */}
            {label(456, 75, 368, '2. Dual Gate Verification', 16, gateTone, 'left', 700)}

            {/* Paint Gate */}
            {label(
                468,
                120,
                344,
                'Paint Gate (Incoming Inference Result)',
                13,
                gateTone,
                'left',
                700,
            )}
            {label(
                478,
                158,
                324,
                '✓ e=3 arrives: (3 == 3) && buffer current → PAINT ghost',
                11,
                sendTone,
                'left',
                600,
            )}
            {label(
                478,
                218,
                324,
                '✗ e=2 late arrival: (2 != 4) → DROP stale completion',
                11,
                cancelTone,
                'left',
                600,
            )}
            {label(
                478,
                238,
                324,
                'Prevents ghost text from appearing at wrong cursor location.',
                10,
                c.textMuted,
            )}

            {/* Tab Gate */}
            {label(468, 305, 344, 'Tab Gate (Atomic Text Insertion)', 13, gateTone, 'left', 700)}
            {label(
                478,
                350,
                324,
                'When user presses Tab to accept suggestion:',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                478,
                372,
                324,
                '1. Verify current document version matches snapshot',
                11,
                c.textMuted,
            )}
            {label(478, 392, 324, '2. Verify caret has not moved during keypress', 11, c.textMuted)}
            {label(
                478,
                412,
                324,
                '3. Apply edit atomically in single undo block',
                11,
                sendTone,
                'left',
                600,
            )}
            {label(
                478,
                432,
                324,
                'Prevents corrupting buffer if file changed externally.',
                10,
                c.textMuted,
            )}
        </Board>
    )
}

export default create('dark')
