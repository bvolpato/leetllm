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
    'A host-owned scratch backing object supplies one private guest filesystem for A/generation 1. Upper and work are separate private directories on that same filesystem, and work stays outside the merged user view. Four aligned guest mount states track immutable lower config.txt bytes marked base. Reading uses the lower file with an empty upper. Modifying config.txt copies it into upper with A’s bytes. Creating output.csv puts its data row 1,99 only in upper. Deleting config.txt leaves a whiteout in upper, while lower still retains the original bytes and the merged view shows only output.csv. After authoritative A/generation 1 execution retirement and reference closure, the host disposes of its scratch backing. Fresh A/generation 2 has empty upper and work directories and sees the clean lower config.txt in its merged view. The guest owns its mounts. Disposal and retention require their own runtime verification.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const lowerTone = getReadableToneColor('blue', c, c.bg)
    const upperTone = getReadableToneColor('warm', c, c.bg)
    const mergedTone = getReadableToneColor('green', c, c.bg)
    const whiteoutTone = getReadableToneColor('critical', c, c.bg)

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
                    {/* Col 1: OverlayFS Layer Stack */}
                    <rect
                        x={24}
                        y={60}
                        width={250}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    {/* Merged View */}
                    <rect
                        x={36}
                        y={110}
                        width={226}
                        height={90}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={mergedTone}
                        strokeWidth={1.5}
                    />
                    {/* Upperdir */}
                    <rect
                        x={36}
                        y={220}
                        width={226}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={upperTone}
                        strokeWidth={1.5}
                    />
                    {/* Lowerdir */}
                    <rect
                        x={36}
                        y={350}
                        width={226}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={lowerTone}
                        strokeWidth={1.5}
                    />

                    {/* Col 2: Copy-Up & Whiteout Mechanics */}
                    <rect
                        x={298}
                        y={60}
                        width={290}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={310}
                        y={110}
                        width={266}
                        height={75}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={310}
                        y={195}
                        width={266}
                        height={85}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={upperTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={310}
                        y={290}
                        width={266}
                        height={80}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={upperTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={310}
                        y={380}
                        width={266}
                        height={80}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={whiteoutTone}
                        strokeWidth={1.2}
                    />

                    {/* Col 3: Reset & Generation Recycling */}
                    <rect
                        x={612}
                        y={60}
                        width={224}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={624}
                        y={110}
                        width={200}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={whiteoutTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={624}
                        y={295}
                        width={200}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={mergedTone}
                        strokeWidth={1.5}
                    />

                    {/* Connectors */}
                    <line x1={262} y1={275} x2={298} y2={275} stroke={stroke} strokeWidth={1.5} />
                    <line x1={588} y1={275} x2={612} y2={275} stroke={stroke} strokeWidth={1.5} />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'OverlayFS Scratch Mechanics: Copy-Up, Whiteouts & Generation Reset',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Col 1 */}
            {label(36, 75, 226, 'OverlayFS Architecture', 17, c.textPrimary, 'left', 700)}

            {label(48, 118, 202, '/workspace (Merged View)', 14, mergedTone, 'left', 650)}
            {label(48, 140, 202, '• Unified POSIX filesystem', 12, c.textPrimary)}
            {label(48, 160, 202, '• Read-through to lower layer', 12, c.textMuted)}
            {label(48, 180, 202, '• Writes trapped to upper layer', 12, c.textMuted)}

            {label(48, 228, 202, '/scratch/upper (Writable)', 14, upperTone, 'left', 650)}
            {label(48, 250, 202, '• Ephemeral private disk mount', 12, c.textMuted)}
            {label(48, 270, 202, '• Holds modified & new files', 12, c.textMuted)}
            {label(48, 290, 202, '• /scratch/work internal helper', 12, c.textMuted)}
            {label(48, 310, 202, '• Dedicated to one generation', 11, upperTone, 'left', 600)}

            {label(48, 358, 202, '/rootfs/lower (Sealed RO)', 14, lowerTone, 'left', 650)}
            {label(48, 380, 202, '• Immutable base template disk', 12, c.textMuted)}
            {label(48, 400, 202, '• config.txt (base version)', 12, c.textMuted)}
            {label(48, 420, 202, '• System binaries & runtimes', 12, c.textMuted)}
            {label(48, 440, 202, '• Shared across all microVMs', 11, lowerTone, 'left', 600)}

            {/* Col 2 */}
            {label(310, 75, 266, 'Guest Filesystem Transitions', 17, upperTone, 'left', 700)}

            {label(322, 118, 242, '1. Read Unmodified File', 13, stroke, 'left', 650)}
            {label(322, 138, 242, '• cat config.txt → served directly from lower', 11, c.textMuted)}
            {label(
                322,
                158,
                242,
                '• Zero disk allocation; upperdir remains empty',
                11,
                c.textMuted,
            )}

            {label(322, 202, 242, '2. Modify File → Copy-Up', 13, upperTone, 'left', 650)}
            {label(322, 222, 242, '• echo "A" >> config.txt triggers copy-up', 11, c.textPrimary)}
            {label(
                322,
                242,
                242,
                '• Lower file cloned into upper with tenant edit',
                11,
                c.textMuted,
            )}
            {label(322, 262, 242, '• Lowerdir base file remains 100% unaltered', 11, lowerTone)}

            {label(322, 298, 242, '3. Create New File', 13, upperTone, 'left', 650)}
            {label(322, 318, 242, '• touch output.csv (1,99) written to upper', 11, c.textPrimary)}
            {label(
                322,
                338,
                242,
                '• Visible in merged view; non-existent in lower',
                11,
                c.textMuted,
            )}

            {label(322, 388, 242, '4. Delete Base File → Whiteout', 13, whiteoutTone, 'left', 650)}
            {label(
                322,
                408,
                242,
                '• rm config.txt creates char dev (0:0) in upper',
                11,
                c.textMuted,
            )}
            {label(
                322,
                428,
                242,
                '• Masks lower file from merged directory listing',
                11,
                c.textMuted,
            )}
            {label(322, 448, 242, '• Base image file on lowerdir unharmed', 11, lowerTone)}

            {/* Col 3 */}
            {label(624, 75, 200, 'Generation Lifecycle', 17, c.textPrimary, 'left', 700)}

            {label(636, 120, 176, 'Retirement (A / Gen 1)', 14, whiteoutTone, 'left', 650)}
            {label(636, 145, 176, '• Process finishes / exits', 12, c.textMuted)}
            {label(636, 170, 176, '• VMM unmounts OverlayFS', 12, c.textMuted)}
            {label(636, 195, 176, '• Scratch upper disk wiped', 12, whiteoutTone)}
            {label(636, 220, 176, '• Dirty blocks discarded', 12, c.textMuted)}
            {label(636, 245, 176, 'Zero tenant residue', 11, whiteoutTone, 'left', 600)}

            {label(636, 305, 176, 'Fresh Start (A / Gen 2)', 14, mergedTone, 'left', 650)}
            {label(636, 330, 176, '• New empty scratch upper', 12, c.textMuted)}
            {label(636, 355, 176, '• Pristine config.txt base', 12, c.textPrimary)}
            {label(636, 380, 176, '• Zero whiteouts or leaks', 12, c.textMuted)}
            {label(636, 405, 176, '• Instant clean environment', 12, mergedTone)}
        </Board>
    )
}

export default create('dark')
