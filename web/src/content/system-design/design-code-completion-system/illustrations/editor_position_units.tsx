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
    'Three encodings align on the character boundaries of a😀b. The emoji is drawn explicitly and labeled U+1F600. Python has one code point for it; UTF-16 has D83D and DE00; UTF-8 has F0 9F 98 80. The caret before b is Python index 2, UTF-16 offset 3, and UTF-8 offset 5. Python index 3 loses b. A UTF-8 cut at byte 3 stops halfway through the emoji.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const pyTone = getReadableToneColor('blue', c, c.bg)
    const utf16Tone = getReadableToneColor('purple', c, c.bg)
    const utf8Tone = getReadableToneColor('warm', c, c.bg)
    const caretTone = getReadableToneColor('green', c, c.bg)
    const errTone = getReadableToneColor('critical', c, c.bg)

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
                    {/* Left: Encodings Grid */}
                    <rect
                        x={24}
                        y={60}
                        width={500}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Source String Header */}
                    <rect
                        x={36}
                        y={110}
                        width={476}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Row 1: Python Code Points */}
                    <rect
                        x={36}
                        y={190}
                        width={476}
                        height={65}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={pyTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={140}
                        y={198}
                        width={50}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={pyTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={200}
                        y={198}
                        width={180}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={pyTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={390}
                        y={198}
                        width={50}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={pyTone}
                        strokeWidth={1}
                    />

                    {/* Row 2: UTF-16 Code Units (LSP / VS Code) */}
                    <rect
                        x={36}
                        y={270}
                        width={476}
                        height={65}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={utf16Tone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={140}
                        y={278}
                        width={50}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf16Tone}
                        strokeWidth={1}
                    />
                    <rect
                        x={200}
                        y={278}
                        width={85}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf16Tone}
                        strokeWidth={1}
                    />
                    <rect
                        x={295}
                        y={278}
                        width={85}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf16Tone}
                        strokeWidth={1}
                    />
                    <rect
                        x={390}
                        y={278}
                        width={50}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf16Tone}
                        strokeWidth={1}
                    />

                    {/* Row 3: UTF-8 Bytes */}
                    <rect
                        x={36}
                        y={350}
                        width={476}
                        height={65}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={utf8Tone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={140}
                        y={358}
                        width={50}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf8Tone}
                        strokeWidth={1}
                    />
                    <rect
                        x={200}
                        y={358}
                        width={40}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf8Tone}
                        strokeWidth={1}
                    />
                    <rect
                        x={245}
                        y={358}
                        width={40}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf8Tone}
                        strokeWidth={1}
                    />
                    <rect
                        x={290}
                        y={358}
                        width={40}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf8Tone}
                        strokeWidth={1}
                    />
                    <rect
                        x={335}
                        y={358}
                        width={40}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf8Tone}
                        strokeWidth={1}
                    />
                    <rect
                        x={390}
                        y={358}
                        width={50}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={utf8Tone}
                        strokeWidth={1}
                    />

                    {/* Caret Vertical Alignment Indicator */}
                    <line
                        x1={385}
                        y1={180}
                        x2={385}
                        y2={425}
                        stroke={caretTone}
                        strokeWidth={2.5}
                    />

                    {/* Right: Slicing Pitfalls */}
                    <rect
                        x={544}
                        y={60}
                        width={292}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={556}
                        y={110}
                        width={268}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={errTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={556}
                        y={290}
                        width={268}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={caretTone}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Editor Cursor Offsets · Code Points vs UTF-16 vs UTF-8 Byte Boundaries',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(
                36,
                75,
                476,
                'Target Buffer: "a😀b" (Caret placed immediately before "b")',
                16,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Source Display */}
            {label(48, 125, 100, 'Source: "a"', 16, c.textPrimary, 'left', 650)}
            {label(210, 125, 160, 'Emoji 😀 (U+1F600)', 15, utf8Tone, 'center', 600)}
            {label(390, 125, 100, 'Suffix: "b"', 16, c.textPrimary, 'left', 650)}

            {/* Python Row */}
            {label(48, 208, 90, 'Python', 13, pyTone, 'left', 650)}
            {label(140, 212, 50, '[0] "a"', 11, c.textPrimary, 'center')}
            {label(200, 212, 180, '[1] U+1F600 (1 code point)', 11, pyTone, 'center')}
            {label(390, 212, 50, '[2] "b"', 11, c.textPrimary, 'center')}
            {label(448, 208, 60, 'Idx: 2', 13, caretTone, 'center', 700)}

            {/* UTF-16 Row */}
            {label(48, 288, 90, 'UTF-16 (LSP)', 13, utf16Tone, 'left', 650)}
            {label(140, 292, 50, '0x0061', 10, c.textPrimary, 'center')}
            {label(200, 292, 85, '0xD83D', 10, utf16Tone, 'center')}
            {label(295, 292, 85, '0xDE00', 10, utf16Tone, 'center')}
            {label(390, 292, 50, '0x0062', 10, c.textPrimary, 'center')}
            {label(448, 288, 60, 'Off: 3', 13, caretTone, 'center', 700)}

            {/* UTF-8 Row */}
            {label(48, 368, 90, 'UTF-8 Bytes', 13, utf8Tone, 'left', 650)}
            {label(140, 372, 50, '0x61', 10, c.textPrimary, 'center')}
            {label(200, 372, 40, 'F0', 9, utf8Tone, 'center')}
            {label(245, 372, 40, '9F', 9, utf8Tone, 'center')}
            {label(290, 372, 40, '98', 9, utf8Tone, 'center')}
            {label(335, 372, 40, '80', 9, utf8Tone, 'center')}
            {label(390, 372, 50, '0x62', 10, c.textPrimary, 'center')}
            {label(448, 368, 60, 'Off: 5', 13, caretTone, 'center', 700)}

            {label(
                36,
                435,
                476,
                'Green line indicates exact cursor position before character "b"',
                12,
                caretTone,
                'center',
                600,
            )}

            {/* Right Header */}
            {label(556, 75, 268, 'Slicing Pitfalls & Desyncs', 16, c.textPrimary, 'left', 700)}

            {/* Danger 1 */}
            {label(568, 120, 244, 'Invalid Byte Truncation', 14, errTone, 'left', 650)}
            {label(568, 145, 244, '• Slicing UTF-8 at byte 3: [0x61, 0xF0, 0x9F]', 11, c.textMuted)}
            {label(568, 168, 244, '• Cuts 4-byte emoji sequence in half', 11, errTone)}
            {label(568, 188, 244, '• Causes UnicodeDecodeError in server', 11, errTone)}
            {label(568, 212, 244, '• Model receives invalid garbled prefix', 11, c.textMuted)}

            {/* Success 2 */}
            {label(568, 300, 244, 'Consistent LSP Conversion', 14, caretTone, 'left', 650)}
            {label(568, 325, 244, '• Client (VS Code) sends UTF-16 offset 3', 11, c.textMuted)}
            {label(568, 348, 244, '• Gateway decodes to Unicode code point 2', 11, c.textPrimary)}
            {label(568, 370, 244, '• Prefix: "a😀" (2 code points, 5 bytes)', 11, c.textMuted)}
            {label(568, 392, 244, '• Suffix: "b" correctly preserved', 11, caretTone, 'left', 600)}
            {label(568, 415, 244, '• Preserves prefix/suffix FIM alignment', 11, caretTone)}
        </Board>
    )
}

export default create('dark')
