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
    'A file has prefix def validate_token_scope(request): followed by is_allowed equals, a visible hole, and the suffix return is_allowed. Colored routes copy the prefix and suffix into a vertical Prefix-Suffix-Middle prompt: PRE, prefix, SUF, suffix, MID. The suffix occurs before the model generates graph.allows(request.scope). A return arrow sends only that generated middle back to the original hole; the suffix stays in place. Marker strings name checkpoint-specific sentinel roles.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const preTone = getReadableToneColor('blue', c, c.bg)
    const sufTone = getReadableToneColor('purple', c, c.bg)
    const midTone = getReadableToneColor('green', c, c.bg)

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
                    {/* Left: Editor Buffer with Caret Hole */}
                    <rect
                        x={24}
                        y={60}
                        width={380}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Prefix Container */}
                    <rect
                        x={36}
                        y={110}
                        width={356}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={preTone}
                        strokeWidth={1.5}
                    />

                    {/* Hole (Cursor position) */}
                    <rect
                        x={36}
                        y={225}
                        width={356}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={midTone}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                    />

                    {/* Suffix Container */}
                    <rect
                        x={36}
                        y={295}
                        width={356}
                        height={75}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={sufTone}
                        strokeWidth={1.5}
                    />

                    {/* Left Notes Box */}
                    <rect
                        x={36}
                        y={380}
                        width={356}
                        height={85}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Transform connectors between panels */}
                    <line x1={404} y1={162} x2={440} y2={162} stroke={preTone} strokeWidth={2} />
                    <line x1={404} y1={332} x2={440} y2={260} stroke={sufTone} strokeWidth={2} />
                    <line
                        x1={440}
                        y1={370}
                        x2={404}
                        y2={255}
                        stroke={midTone}
                        strokeWidth={2}
                        strokeDasharray="3 3"
                    />

                    {/* Right: PSM Prompt Assembly & Model Generation */}
                    <rect
                        x={440}
                        y={60}
                        width={396}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* PSM Prompt Block */}
                    <rect
                        x={452}
                        y={110}
                        width={372}
                        height={205}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={462}
                        y={120}
                        width={352}
                        height={65}
                        rx={4}
                        fill={c.bgCard}
                        stroke={preTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={462}
                        y={192}
                        width={352}
                        height={55}
                        rx={4}
                        fill={c.bgCard}
                        stroke={sufTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={462}
                        y={254}
                        width={352}
                        height={45}
                        rx={4}
                        fill={c.bgCard}
                        stroke={midTone}
                        strokeWidth={1}
                    />

                    {/* Generated Output Block */}
                    <rect
                        x={452}
                        y={330}
                        width={372}
                        height={135}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={midTone}
                        strokeWidth={2}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Fill-In-the-Middle (FIM) Prompt Assembly & Autoregressive Suffix Conditioning',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(36, 75, 356, '1. Active Editor File Buffer', 17, preTone, 'left', 700)}

            {/* Prefix */}
            {label(48, 120, 332, 'PREFIX (Code before caret)', 13, preTone, 'left', 650)}
            {label(
                48,
                142,
                332,
                'def validate_token_scope(request):',
                13,
                c.textPrimary,
                'left',
                600,
            )}
            {label(48, 168, 332, '    is_allowed = ', 13, c.textPrimary, 'left', 600)}

            {/* Caret Hole */}
            {label(48, 235, 332, 'HOLE (Cursor Position)', 13, midTone, 'left', 700)}
            {label(48, 258, 332, '[ Model fills this single location ]', 12, midTone, 'left', 600)}

            {/* Suffix */}
            {label(48, 305, 332, 'SUFFIX (Code after caret)', 13, sufTone, 'left', 650)}
            {label(48, 330, 332, '    return is_allowed', 13, c.textPrimary, 'left', 600)}

            {/* Left Notes */}
            {label(48, 392, 332, 'Without FIM, model sees only prefix', 12, c.textMuted)}
            {label(48, 412, 332, 'and often duplicates the return statement.', 12, c.textMuted)}
            {label(
                48,
                434,
                332,
                'FIM conditions generation on surrounding context.',
                12,
                preTone,
                'left',
                600,
            )}

            {/* Right Header */}
            {label(
                452,
                75,
                372,
                '2. PSM Token Order (Prefix-Suffix-Middle)',
                17,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Prompt tokens */}
            {label(
                472,
                126,
                332,
                '<PRE> def validate_token_scope(request):',
                12,
                preTone,
                'left',
                600,
            )}
            {label(472, 148, 332, '    is_allowed = ', 12, preTone, 'left', 600)}

            {label(472, 198, 332, '<SUF> \\n    return is_allowed', 12, sufTone, 'left', 600)}
            {label(472, 220, 332, '(Enables attention to variable use below)', 11, c.textMuted)}

            {label(
                472,
                262,
                332,
                '<MID> (Sentinel initiates middle generation)',
                12,
                midTone,
                'left',
                700,
            )}

            {/* Output */}
            {label(
                468,
                342,
                340,
                'Model Generation (Autoregressive Stream):',
                14,
                midTone,
                'left',
                700,
            )}
            {label(468, 370, 340, 'graph.allows(request.scope)', 15, midTone, 'left', 700)}
            {label(
                468,
                400,
                340,
                '• Generation stops at <EOT> end-of-text sentinel',
                12,
                c.textMuted,
            )}
            {label(
                468,
                420,
                340,
                '• Only generated middle inserted into cursor hole',
                12,
                c.textPrimary,
            )}
            {label(
                468,
                440,
                340,
                '• Existing return is_allowed preserved intact',
                12,
                midTone,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
